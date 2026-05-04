import type { Metadata } from 'next'
import type { RomListingsResponse } from '@/types/rom'
import { RomListingsClient } from '../rom-listings/RomListingsClient'

export const metadata: Metadata = {
  title: 'ROMs · Gigaverse NFTs',
  description: 'Browse and compare Gigaverse ROM NFT listings by efficiency.',
}

export const revalidate = 21600

async function loadData(): Promise<RomListingsResponse> {
  if (!process.env.OPENSEA_COLLECTION_SLUG || !process.env.OPENSEA_CONTRACT_ADDRESS) {
    return { listings: [], ethUsd: 0, lastUpdated: new Date().toISOString() }
  }

  const { fetchEthUsd } = await import('@/lib/coingecko')
  const { fetchRomListings } = await import('@/lib/opensea')

  const ethUsd = await fetchEthUsd()
  const listings = await fetchRomListings(ethUsd)
  return { listings, ethUsd, lastUpdated: new Date().toISOString() }
}

export default async function RomsPage() {
  let data: RomListingsResponse

  try {
    data = await loadData()
  } catch (err) {
    console.error('Failed to fetch ROM listings:', err)
    data = { listings: [], ethUsd: 0, lastUpdated: new Date().toISOString() }
  }

  return <RomListingsClient data={data} />
}
