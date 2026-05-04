import type { RomListing, Tier, Faction, MemoryMb } from '@/types/rom'

const API_KEY = process.env.OPENSEA_API_KEY!
const BASE = 'https://api.opensea.io/api/v2'
const CHAIN = process.env.OPENSEA_CHAIN ?? 'ethereum'

/** Accept full OpenSea URLs or bare slugs */
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

const COLLECTION_SLUG = extractSlug(process.env.OPENSEA_COLLECTION_SLUG ?? '')
const CONTRACT = process.env.OPENSEA_CONTRACT_ADDRESS!

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

interface GigaverseMetadata {
  image?: string
  attributes: Array<{ trait_type: string; value: string | number }>
}

function parseTrait<T extends string | number>(
  attributes: GigaverseMetadata['attributes'],
  type: string,
): T | null {
  const t = attributes.find((a) => a.trait_type.toLowerCase() === type.toLowerCase())
  return t ? (t.value as T) : null
}

async function fetchAllListings(
  ethUsd: number,
): Promise<Map<string, { priceEth: number; priceUsd: number }>> {
  const prices = new Map<string, { priceEth: number; priceUsd: number }>()
  let next: string | null = null

  do {
    const qs = next
      ? `?limit=100&next=${encodeURIComponent(next)}`
      : '?limit=100'
    const res = await fetch(`${BASE}/listings/collection/${COLLECTION_SLUG}/all${qs}`, {
      headers: osHeaders,
    })
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

  return prices
}

async function fetchMetadataWithRetry(tokenId: string): Promise<GigaverseMetadata | null> {
  const url = `https://gigaverse.io/api/roms/metadatav2/${tokenId}`
  const headers = { accept: 'application/json', 'user-agent': 'GigaverseHub.com' }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers })
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)))
        continue
      }
      if (!res.ok) return null
      return (await res.json()) as GigaverseMetadata
    } catch {
      // network error — retry
    }
  }
  return null
}

async function fetchNftTraits(tokenIds: string[]): Promise<Map<string, GigaverseMetadata>> {
  const nfts = new Map<string, GigaverseMetadata>()
  const BATCH = 10

  for (let i = 0; i < tokenIds.length; i += BATCH) {
    const batch = tokenIds.slice(i, i + BATCH)
    const results = await Promise.all(batch.map((id) => fetchMetadataWithRetry(id)))
    results.forEach((data, idx) => {
      if (data) nfts.set(batch[idx], data)
    })
    if (i + BATCH < tokenIds.length) {
      await new Promise((r) => setTimeout(r, 50))
    }
  }

  return nfts
}

export async function fetchRomListings(ethUsd: number): Promise<RomListing[]> {
  const priceMap = await fetchAllListings(ethUsd)
  const tokenIds = Array.from(priceMap.keys())
  if (tokenIds.length === 0) return []

  const nftMap = await fetchNftTraits(tokenIds)
  const listings: RomListing[] = []

  for (const [tokenId, price] of priceMap) {
    const nft = nftMap.get(tokenId)
    if (!nft) continue

    const tier = parseTrait<string>(nft.attributes, 'tier')?.toUpperCase() as Tier | null
    const faction = parseTrait<string>(nft.attributes, 'faction')?.toUpperCase() as Faction | null
    // Memory comes back as "8MB" / "64MB" — strip the unit
    const memoryRaw = parseTrait<string>(nft.attributes, 'memory')
    const memory = memoryRaw ? (parseInt(memoryRaw, 10) as MemoryMb) : null

    if (!tier || !faction || memory == null || isNaN(memory)) continue

    let imageUrl: string | undefined = nft.image
    if (imageUrl?.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`
    }

    listings.push({
      tokenId,
      tier,
      faction,
      memory,
      priceEth: price.priceEth,
      priceUsd: price.priceUsd,
      openseaUrl: `https://opensea.io/assets/${CHAIN}/${CONTRACT}/${tokenId}`,
      imageUrl,
    })
  }

  return listings
}
