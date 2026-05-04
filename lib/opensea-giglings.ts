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
const CONTRACT = process.env.OPENSEA_GIGLINGS_CONTRACT_ADDRESS ?? null

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

interface OpenSeaNft {
  identifier: string
  image_url?: string
  traits: Array<{ trait_type: string; value: string | number }>
}

function parseTrait(traits: OpenSeaNft['traits'], type: string): string | null {
  const attr = traits.find((a) => a.trait_type.toLowerCase() === type.toLowerCase())
  return attr != null ? String(attr.value) : null
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

// Fetches all NFTs from the contract in pages of 200.
// Stops early once every listed token has been found.
async function fetchNftTraits(listedIds: Set<string>): Promise<Map<string, OpenSeaNft>> {
  if (!CONTRACT) return new Map()

  const nfts = new Map<string, OpenSeaNft>()
  let cursor: string | null = null

  do {
    const qs = cursor ? `?limit=200&next=${encodeURIComponent(cursor)}` : '?limit=200'
    let res: Response | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch(`${BASE}/chain/${CHAIN}/contract/${CONTRACT}/nfts${qs}`, {
          headers: osHeaders,
        })
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
          res = null
          continue
        }
        break
      } catch {
        // network error — retry
      }
    }

    if (!res?.ok) break

    const data = (await res.json()) as { nfts: OpenSeaNft[]; next: string | null }

    for (const nft of data.nfts) {
      if (listedIds.has(nft.identifier)) {
        nfts.set(nft.identifier, nft)
      }
    }

    cursor = data.next ?? null

    if (nfts.size >= listedIds.size) break

    if (cursor) await new Promise((r) => setTimeout(r, 600))
  } while (cursor)

  return nfts
}

const VALID_FACTIONS = new Set<string>([
  'ARCHON', 'ATHENA', 'CHOBO', 'CRUSADER', 'FOXGLOVE', 'OVERSEER', 'SUMMONER', 'GIGUS', 'NONE',
])
const VALID_GENDERS = new Set<string>(['MALE', 'FEMALE'])

export async function fetchGiglingListings(ethUsd: number): Promise<GiglingListing[]> {
  const { prices } = await fetchAllListings(ethUsd)
  const tokenIds = Array.from(prices.keys())
  if (tokenIds.length === 0) return []

  const nftMap = await fetchNftTraits(new Set(tokenIds))
  const listings: GiglingListing[] = []

  for (const [tokenId, price] of prices) {
    const nft = nftMap.get(tokenId)
    if (!nft) continue

    const stateRaw = parseTrait(nft.traits, 'State')
    if (!stateRaw || (stateRaw !== 'Pet' && stateRaw !== 'Egg')) continue
    const state: GiglingState = stateRaw === 'Pet' ? 'PET' : 'EGG'

    const rarityRaw = parseTrait(nft.traits, 'Rarity')
    const rarity: GiglingRarity | undefined = rarityRaw
      ? RARITY_BY_NUMBER[rarityRaw]
      : undefined

    if (state === 'PET' && !rarity) continue

    const eggTypeRaw = parseTrait(nft.traits, 'Egg Type')
    const eggType: EggType | undefined =
      state === 'EGG' && eggTypeRaw ? EGG_TYPE_BY_STRING[eggTypeRaw] : undefined

    if (state === 'EGG' && !eggType) continue

    const factionRaw = parseTrait(nft.traits, 'Faction')?.toUpperCase() ?? 'NONE'
    const faction: GiglingFaction = VALID_FACTIONS.has(factionRaw)
      ? (factionRaw as GiglingFaction)
      : 'NONE'

    const genderRaw = parseTrait(nft.traits, 'Gender')?.toUpperCase()
    const gender: GiglingGender | undefined =
      genderRaw && VALID_GENDERS.has(genderRaw)
        ? (genderRaw as GiglingGender)
        : undefined

    listings.push({
      tokenId,
      state,
      rarity,
      faction,
      gender,
      eggType,
      priceEth: price.priceEth,
      priceUsd: price.priceUsd,
      openseaUrl: `https://opensea.io/assets/${CHAIN}/${CONTRACT}/${tokenId}`,
      imageUrl: nft.image_url,
    })
  }

  return listings
}
