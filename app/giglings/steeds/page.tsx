import type { Metadata } from 'next'
import type { GiglingListingsResponse } from '@/types/gigling'
import { GiglingListingsClient } from '../gigling-listings/GiglingListingsClient'

export const metadata: Metadata = {
  title: 'Steeds · Gigaverse NFTs',
  description: 'Browse Gigaverse Steed (Pet) Gigling NFT listings.',
}

export const revalidate = 21600

async function loadData(): Promise<GiglingListingsResponse> {
  if (!process.env.OPENSEA_API_KEY) {
    return { listings: [], ethUsd: 0, lastUpdated: new Date().toISOString() }
  }

  const { fetchEthUsd } = await import('@/lib/coingecko')
  const { fetchGiglingListings } = await import('@/lib/opensea-giglings')

  const ethUsd = await fetchEthUsd()
  const all = await fetchGiglingListings(ethUsd)
  const listings = all.filter((g) => g.state === 'PET')
  return { listings, ethUsd, lastUpdated: new Date().toISOString() }
}

export default async function SteedsPage() {
  let data: GiglingListingsResponse

  try {
    data = await loadData()
  } catch (err) {
    console.error('Failed to fetch Steed listings:', err)
    data = { listings: [], ethUsd: 0, lastUpdated: new Date().toISOString() }
  }

  return <GiglingListingsClient data={data} variant="STEEDS" />
}
