import type { RomListing, Tier, Faction, MemoryMb } from '@/types/rom'

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

interface OpenSeaNft {
  identifier: string
  image_url?: string
  traits: Array<{ trait_type: string; value: string | number }>
}

function parseTrait<T extends string | number>(
  traits: OpenSeaNft['traits'],
  type: string,
): T | null {
  const t = traits.find((a) => a.trait_type.toLowerCase() === type.toLowerCase())
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

// Fetches all NFTs from the contract in pages of 200.
// Stops early once every listed token has been found.
async function fetchNftTraits(
  listedIds: Set<string>,
): Promise<Map<string, OpenSeaNft>> {
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

export async function fetchRomListings(ethUsd: number): Promise<RomListing[]> {
  const priceMap = await fetchAllListings(ethUsd)
  const tokenIds = Array.from(priceMap.keys())
  if (tokenIds.length === 0) return []

  const nftMap = await fetchNftTraits(new Set(tokenIds))
  const listings: RomListing[] = []

  for (const [tokenId, price] of priceMap) {
    const nft = nftMap.get(tokenId)
    if (!nft) continue

    const tier = parseTrait<string>(nft.traits, 'tier')?.toUpperCase() as Tier | null
    const faction = parseTrait<string>(nft.traits, 'faction')?.toUpperCase() as Faction | null
    const memoryRaw = parseTrait<string>(nft.traits, 'memory')
    const memory = memoryRaw ? (parseInt(memoryRaw, 10) as MemoryMb) : null

    if (!tier || !faction || memory == null || isNaN(memory)) continue

    listings.push({
      tokenId,
      tier,
      faction,
      memory,
      priceEth: price.priceEth,
      priceUsd: price.priceUsd,
      openseaUrl: `https://opensea.io/assets/${CHAIN}/${CONTRACT}/${tokenId}`,
      imageUrl: nft.image_url,
    })
  }

  return listings
}
