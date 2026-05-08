'use client'

import { useMemo, useState } from 'react'
import { ArrowClockwise } from '@phosphor-icons/react'
import type {
  GiglingListingsResponse,
  GiglingRarity,
  GiglingFaction,
  GiglingGender,
  EggType,
} from '@/types/gigling'
import {
  GIGLING_RARITIES,
  GIGLING_FACTIONS,
  GIGLING_GENDERS,
  EGG_TYPES,
} from '@/types/gigling'
import { Nav } from '../../components/Nav'
import { GiglingTable } from './GiglingTable'
import { GiglingFilterBar } from './GiglingFilterBar'

export type GiglingVariant = 'STEEDS' | 'EGGS'

export interface GiglingActiveFilters {
  rarities: GiglingRarity[]
  eggTypes: EggType[]
  factions: GiglingFaction[]
  genders: GiglingGender[]
}

const TITLES: Record<GiglingVariant, string> = {
  STEEDS: 'Gigling Steeds',
  EGGS: 'Gigling Eggs',
}

const SUBTITLES: Record<GiglingVariant, string> = {
  STEEDS:
    'Gigling Steeds are hatched pets. There are 6 rarities, 8 factions and 2 genders that affect the production output.',
  EGGS:
    'Gigling Eggs are unhatched pets. There are 5 types. All of them produce the inaugural steeds. The ROM-type eggs also produce ROMling noob skin based on rarity.',
}

interface Props {
  data: GiglingListingsResponse
  variant: GiglingVariant
}

export function GiglingListingsClient({ data, variant }: Props) {
  const [listings, setListings] = useState(data.listings)
  const [ethUsd, setEthUsd] = useState(data.ethUsd)
  const [lastUpdated, setLastUpdated] = useState(data.lastUpdated)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(false)

  const [filters, setFilters] = useState<GiglingActiveFilters>({
    rarities: [...GIGLING_RARITIES],
    eggTypes: [...EGG_TYPES],
    factions: [...GIGLING_FACTIONS],
    genders: [...GIGLING_GENDERS],
  })

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshError(false)
    try {
      const res = await fetch(`/api/listings/giglings?variant=${variant}`)
      if (!res.ok) { setRefreshError(true); return }
      const fresh = (await res.json()) as GiglingListingsResponse
      setListings(fresh.listings)
      setEthUsd(fresh.ethUsd)
      setLastUpdated(fresh.lastUpdated)
    } catch {
      setRefreshError(true)
    } finally {
      setRefreshing(false)
    }
  }

  const filteredListings = useMemo(
    () =>
      listings.filter((g) => {
        if (variant === 'STEEDS') {
          return (
            !!g.rarity &&
            filters.rarities.includes(g.rarity) &&
            filters.factions.includes(g.faction) &&
            (g.gender === undefined || filters.genders.includes(g.gender))
          )
        }
        return g.eggType !== undefined && filters.eggTypes.includes(g.eggType)
      }),
    [listings, filters, variant],
  )

  const lastUpdatedFormatted = useMemo(() => {
    try { return new Date(lastUpdated).toLocaleString() } catch { return lastUpdated }
  }, [lastUpdated])

  return (
    <div className="min-h-screen bg-giga-navy">
      <Nav />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="font-bitcell text-[24px] uppercase tracking-[3px] text-giga-gold">
            {TITLES[variant]}
          </h1>
          <p
            className="font-bitcell text-[11px] uppercase tracking-[1px]"
            style={{ color: '#7a8a9e', maxWidth: '760px', lineHeight: '1.8' }}
          >
            {SUBTITLES[variant]}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-bitcell text-[11px] uppercase tracking-[1.5px]" style={{ color: '#F5C563' }}>
              Updated {lastUpdatedFormatted}
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 font-bitcell text-[11px] uppercase tracking-[1.5px] transition-opacity disabled:opacity-40"
              style={{ color: refreshError ? '#C32454' : '#02C7D7' }}
            >
              <ArrowClockwise size={12} weight="bold" className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : refreshError ? 'Failed — retry' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-bitcell text-[12px] uppercase tracking-[2px]" style={{ color: '#e0e0e0' }}>
            Filters
          </span>
          <GiglingFilterBar filters={filters} onFiltersChange={setFilters} variant={variant} />
        </div>

        <GiglingTable listings={filteredListings} ethUsd={ethUsd} variant={variant} />
      </main>
    </div>
  )
}
