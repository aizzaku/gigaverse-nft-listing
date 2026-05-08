import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { GiglingListingsResponse } from '@/types/gigling'

export const dynamic = 'force-dynamic'
/** Eggs need ~300ms × listed-egg-count for gigaverse.io hatch calls; allow up to 5 min */
export const maxDuration = 300

export async function GET(
  request: NextRequest,
): Promise<NextResponse<GiglingListingsResponse | { error: string }>> {
  const variant = request.nextUrl.searchParams.get('variant')?.toUpperCase()

  if (!process.env.OPENSEA_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  try {
    const { fetchEthUsd } = await import('@/lib/coingecko')
    const { fetchGiglingListings } = await import('@/lib/opensea-giglings')

    const ethUsd = await fetchEthUsd()
    const all = await fetchGiglingListings(ethUsd)

    let listings = variant === 'EGGS'
      ? all.filter((g) => g.state === 'EGG')
      : all.filter((g) => g.state === 'PET')

    if (variant === 'EGGS') {
      const { fetchEggHatchData } = await import('@/lib/gigaverse-eggs')
      const hatchMap = await fetchEggHatchData(listings.map((g) => g.tokenId))
      listings = listings.map((g) => ({ ...g, ...(hatchMap.get(g.tokenId) ?? {}) }))
    }

    return NextResponse.json({ listings, ethUsd, lastUpdated: new Date().toISOString() })
  } catch (err) {
    console.error('Gigling listings refresh failed:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }
}
