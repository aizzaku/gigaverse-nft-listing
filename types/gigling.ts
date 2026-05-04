export type GiglingState = 'PET' | 'EGG'
export type GiglingRarity = 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'RELIC' | 'GIGA'
export type GiglingFaction =
  | 'ARCHON'
  | 'ATHENA'
  | 'CHOBO'
  | 'CRUSADER'
  | 'FOXGLOVE'
  | 'OVERSEER'
  | 'SUMMONER'
  | 'GIGUS'
  | 'NONE'
export type GiglingGender = 'MALE' | 'FEMALE'

/** The 5 distinct types of Gigling Eggs */
export type EggType = 'INAUGURAL_STEED' | 'SILVER' | 'GOLD' | 'VOID' | 'GIGA'

export const GIGLING_STATES: GiglingState[] = ['PET', 'EGG']

export const RARITY_BY_NUMBER: Record<string, GiglingRarity> = {
  '1': 'UNCOMMON',
  '2': 'RARE',
  '3': 'EPIC',
  '4': 'LEGENDARY',
  '5': 'RELIC',
  '6': 'GIGA',
}

/** "Egg Type" trait string → EggType (matches gigaverse.io metadatav2 values) */
export const EGG_TYPE_BY_STRING: Record<string, EggType> = {
  'Inaugural Steed': 'INAUGURAL_STEED',
  'Silver ROM': 'SILVER',
  'Gold ROM': 'GOLD',
  'Void ROM': 'VOID',
  'Giga ROM': 'GIGA',
}

export const EGG_TYPE_LABELS: Record<EggType, string> = {
  INAUGURAL_STEED: 'Inaugural Steed',
  SILVER: 'Silver ROM',
  GOLD: 'Gold ROM',
  VOID: 'Void ROM',
  GIGA: 'Giga ROM',
}

export const GIGLING_RARITIES: GiglingRarity[] = [
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'RELIC',
  'GIGA',
]
export const GIGLING_FACTIONS: GiglingFaction[] = [
  'ARCHON',
  'ATHENA',
  'CHOBO',
  'CRUSADER',
  'FOXGLOVE',
  'OVERSEER',
  'SUMMONER',
  'GIGUS',
  'NONE',
]
export const GIGLING_GENDERS: GiglingGender[] = ['MALE', 'FEMALE']
export const EGG_TYPES: EggType[] = ['INAUGURAL_STEED', 'SILVER', 'GOLD', 'VOID', 'GIGA']

export const RARITY_ORDER: Record<GiglingRarity, number> = {
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
  RELIC: 5,
  GIGA: 6,
}

/** Base output multiplier per rarity tier */
export const BASE_OUTPUT_RATE: Record<GiglingRarity, number> = {
  UNCOMMON: 1,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 2,
  RELIC: 3,
  GIGA: 4,
}

/**
 * When a Gigling has a faction, output splits between factionless and faction pools.
 * Factionless Giglings (faction = NONE) always produce 100% factionless output.
 */
export const FACTION_SPLIT: Record<GiglingRarity, { factionless: number; faction: number }> = {
  UNCOMMON:  { factionless: 75, faction: 25 },
  RARE:      { factionless: 70, faction: 30 },
  EPIC:      { factionless: 70, faction: 30 },
  LEGENDARY: { factionless: 65, faction: 35 },
  RELIC:     { factionless: 65, faction: 35 },
  GIGA:      { factionless: 60, faction: 40 },
}

export interface GiglingListing {
  tokenId: string
  state: GiglingState
  /** Pets always have rarity; eggs do not */
  rarity?: GiglingRarity
  faction: GiglingFaction
  /** Eggs may not have an assigned gender */
  gender?: GiglingGender
  /** Populated for state === 'EGG' */
  eggType?: EggType
  priceEth: number
  priceUsd: number
  openseaUrl: string
  imageUrl?: string
}

export interface GiglingListingsResponse {
  listings: GiglingListing[]
  ethUsd: number
  lastUpdated: string
}
