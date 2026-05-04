import type { Tier, MemoryMb } from '@/types/rom'

export const ENERGY_BY_MEMORY: Record<MemoryMb, number> = {
  8: 70,
  16: 105,
  32: 140,
  64: 175,
  128: 300,
  256: 420,
  512: 560,
  1024: 1120,
}

export const SHARDS_BY_TIER: Record<Tier, number> = {
  SILVER: 1,
  GOLD: 2,
  VOID: 8,
  GIGA: 28,
}

export const DUST_BY_TIER: Record<Tier, number> = {
  SILVER: 5,
  GOLD: 10,
  VOID: 20,
  GIGA: 60,
}

export const STUBS_BY_TIER: Record<Tier, number> = {
  SILVER: 30,
  GOLD: 50,
  VOID: 120,
  GIGA: 300,
}

const LINKED_BOOST = 1.6
const JUICED_BOOST = 1.2

export interface RomEfficiency {
  energyPerWeek: number
  shardsPerWeek: number
  dustPerWeek: number
  energyEfficiency: number
  shardsEfficiency: number
  dustEfficiency: number
}

export function calcEfficiency(
  tier: Tier,
  memory: MemoryMb,
  priceEth: number,
  linked: boolean,
  juiced: boolean,
): RomEfficiency {
  const multiplier = (linked ? LINKED_BOOST : 1) * (juiced ? JUICED_BOOST : 1)
  const energyPerWeek = ENERGY_BY_MEMORY[memory] * multiplier
  const shardsPerWeek = SHARDS_BY_TIER[tier] * multiplier
  const dustPerWeek = DUST_BY_TIER[tier] * multiplier

  if (priceEth === 0) {
    return { energyPerWeek, shardsPerWeek, dustPerWeek, energyEfficiency: 0, shardsEfficiency: 0, dustEfficiency: 0 }
  }

  return {
    energyPerWeek,
    shardsPerWeek,
    dustPerWeek,
    energyEfficiency: energyPerWeek / priceEth,
    shardsEfficiency: shardsPerWeek / priceEth,
    dustEfficiency: dustPerWeek / priceEth,
  }
}
