import type {
  GiglingListing,
  GiglingState,
  GiglingRarity,
  GiglingFaction,
  GiglingGender,
  EggType,
} from '@/types/gigling'
import { RARITY_BY_NUMBER, EGG_TYPE_BY_STRING } from '@/types/gigling'

const API_KEY = process.env.OPENSEA_API_KEY!
const BASE = 'https://api.opensea.io/api/v2'
const CHAIN = process.env.OPENSEA_CHAIN ?? 'ethereum'

function extractSlug(raw: string): string {
  try {
    const url = new URL(raw)
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('collection')
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
  } catch {
    // not a URL — use as-is
  }
  return raw
}

const COLLECTION_SLUG = extractSlug(
  process.env.OPENSEA_GIGLINGS_COLLECTION_SLUG ?? 'gigaverse-giglings',
)
const ENV_CONTRACT = process.env.OPENSEA_GIGLINGS_CONTRACT_ADDRESS ?? null

const osHeaders = {
  'x-api-key': API_KEY,
  accept: 'application/json',
  'user-agent': 'GigaverseHub.com',
}

interface OpenSeaListing {
  price: {
    current: {
      decimals: number
      value: string
    }
  }
  protocol_data: {
    parameters: {
      offer: Array<{ token: string; identifierOrCriteria: string }>
    }
  }
}

async function fetchAllListings(ethUsd: number): Promise<{
  prices: Map<string, { priceEth: number; priceUsd: number }>
}> {
  const prices = new Map<string, { priceEth: number; priceUsd: number }>()
  let next: string | null = null

  do {
    const qs = next
      ? `?limit=100&next=${encodeURIComponent(next)}`
      : '?limit=100'
    const res = await fetch(
      `${BASE}/listings/collection/${COLLECTION_SLUG}/all${qs}`,
      { headers: osHeaders },
    )
    if (!res.ok) throw new Error(`OpenSea listings ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as { listings: OpenSeaListing[]; next: string | null }

    for (const listing of data.listings) {
      const offer = listing.protocol_data.parameters.offer[0]
      if (!offer) continue
      const tokenId = offer.identifierOrCriteria
      const priceEth =
        Number(listing.price.current.value) / Math.pow(10, listing.price.current.decimals)
      prices.set(tokenId, { priceEth, priceUsd: priceEth * ethUsd })
    }

    next = data.next ?? null
  } while (next)

  return { prices }
}

interface GigaverseMetadata {
  name?: string
  image?: string
  attributes?: Array<{ trait_type: string; value: string | number }>
}

function parseTrait(
  attributes: GigaverseMetadata['attributes'],
  type: string,
): string | null {
  if (!attributes) return null
  const attr = attributes.find(
    (a) => a.trait_type.toLowerCase() === type.toLowerCase(),
  )
  return attr != null ? String(attr.value) : null
}

async function fetchGigaverseMetadata(tokenId: string): Promise<GigaverseMetadata | null> {
  try {
    const res = await fetch(
      `https://gigaverse.io/api/pets/metadatav2/${tokenId}`,
      { headers: { accept: 'application/json', 'user-agent': 'GigaverseHub.com' } },
    )
    if (!res.ok) return null
    return (await res.json()) as GigaverseMetadata
  } catch {
    return null
  }
}

const VALID_FACTIONS = new Set<string>([
  'ARCHON', 'ATHENA', 'CHOBO', 'CRUSADER', 'FOXGLOVE', 'OVERSEER', 'SUMMONER', 'GIGUS', 'NONE',
])
const VALID_GENDERS = new Set<string>(['MALE', 'FEMALE'])

export async function fetchGiglingListings(ethUsd: number): Promise<GiglingListing[]> {
  const { prices } = await fetchAllListings(ethUsd)
  const tokenIds = Array.from(prices.keys())
  if (tokenIds.length === 0) return []

  const BATCH = 20
  const listings: GiglingListing[] = []

  for (let i = 0; i < tokenIds.length; i += BATCH) {
    const batch = tokenIds.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async (tokenId): Promise<GiglingListing | null> => {
        const price = prices.get(tokenId)!
        const meta = await fetchGigaverseMetadata(tokenId)
        if (!meta) return null

        const stateRaw = parseTrait(meta.attributes, 'State')
        if (!stateRaw || (stateRaw !== 'Pet' && stateRaw !== 'Egg')) return null
        const state: GiglingState = stateRaw === 'Pet' ? 'PET' : 'EGG'

        const rarityRaw = parseTrait(meta.attributes, 'Rarity')
        const rarity: GiglingRarity | undefined = rarityRaw
          ? RARITY_BY_NUMBER[rarityRaw]
          : undefined

        // Pets must have a valid rarity; eggs derive type from "Egg Type" trait instead
        if (state === 'PET' && !rarity) return null

        const eggTypeRaw = parseTrait(meta.attributes, 'Egg Type')
        const eggType: EggType | undefined =
          state === 'EGG' && eggTypeRaw ? EGG_TYPE_BY_STRING[eggTypeRaw] : undefined

        if (state === 'EGG' && !eggType) return null

        const factionRaw = parseTrait(meta.attributes, 'Faction')?.toUpperCase() ?? 'NONE'
        const faction: GiglingFaction = VALID_FACTIONS.has(factionRaw)
          ? (factionRaw as GiglingFaction)
          : 'NONE'

        const genderRaw = parseTrait(meta.attributes, 'Gender')?.toUpperCase()
        const gender: GiglingGender | undefined =
          genderRaw && VALID_GENDERS.has(genderRaw)
            ? (genderRaw as GiglingGender)
            : undefined

        let imageUrl: string | undefined = meta.image || undefined
        if (imageUrl?.startsWith('ipfs://')) {
          imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`
        }

        return {
          tokenId,
          state,
          rarity,
          faction,
          gender,
          eggType,
          priceEth: price.priceEth,
          priceUsd: price.priceUsd,
          openseaUrl: `https://opensea.io/assets/${CHAIN}/${ENV_CONTRACT}/${tokenId}`,
          imageUrl,
        }
      }),
    )

    for (const r of results) {
      if (r) listings.push(r)
    }
  }

  return listings
}
