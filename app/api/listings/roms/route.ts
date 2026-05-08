import { NextResponse } from 'next/server'
import type { RomListingsResponse } from '@/types/rom'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse<RomListingsResponse | { error: string }>> {
  if (!process.env.OPENSEA_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  try {
    const { fetchEthUsd } = await import('@/lib/coingecko')
    const { fetchRomListings } = await import('@/lib/opensea')

    const ethUsd = await fetchEthUsd()
    const listings = await fetchRomListings(ethUsd)

    return NextResponse.json({ listings, ethUsd, lastUpdated: new Date().toISOString() })
  } catch (err) {
    console.error('ROM listings refresh failed:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  }
}
