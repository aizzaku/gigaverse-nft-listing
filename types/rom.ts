export type Tier = 'SILVER' | 'GOLD' | 'VOID' | 'GIGA'
export type Faction =
  | 'ARCHON'
  | 'ATHENA'
  | 'CHOBO'
  | 'CRUSADER'
  | 'FOXGLOVE'
  | 'OVERSEER'
  | 'SUMMONER'
  | 'GIGUS'

export const TIERS: Tier[] = ['SILVER', 'GOLD', 'VOID', 'GIGA']
export const FACTIONS: Faction[] = [
  'ARCHON',
  'ATHENA',
  'CHOBO',
  'CRUSADER',
  'FOXGLOVE',
  'OVERSEER',
  'SUMMONER',
  'GIGUS',
]
export const MEMORY_OPTIONS = [8, 16, 32, 64, 128, 256, 512, 1024] as const
export type MemoryMb = (typeof MEMORY_OPTIONS)[number]

export interface RomListing {
  tokenId: string
  faction: Faction
  tier: Tier
  memory: MemoryMb
  priceEth: number
  priceUsd: number
  openseaUrl: string
  imageUrl?: string
}

export interface RomListingsResponse {
  listings: RomListing[]
  ethUsd: number
  lastUpdated: string
}
