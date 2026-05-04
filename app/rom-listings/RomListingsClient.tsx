'use client'

import { useMemo, useState } from 'react'
import type { RomListingsResponse, Tier, Faction, MemoryMb } from '@/types/rom'
import { TIERS, FACTIONS, MEMORY_OPTIONS } from '@/types/rom'
import { calcEfficiency } from '@/lib/rom-calculations'
import { Nav } from '../components/Nav'
import { RomTable } from './RomTable'
import { ControlBar } from './ControlBar'
import { FilterBar } from './FilterBar'

interface Props {
  data: RomListingsResponse
}

export interface DisplaySettings {
  linked: boolean
  juiced: boolean
}

export interface ActiveFilters {
  factions: Faction[]
  tiers: Tier[]
  memories: MemoryMb[]
}

export function RomListingsClient({ data }: Props) {
  const { listings, ethUsd, lastUpdated } = data

  const [settings, setSettings] = useState<DisplaySettings>({
    linked: false,
    juiced: false,
  })

  const [filters, setFilters] = useState<ActiveFilters>({
    factions: [...FACTIONS],
    tiers: [...TIERS],
    memories: [...MEMORY_OPTIONS],
  })

  const enrichedListings = useMemo(
    () =>
      listings.map((rom) => ({
        ...rom,
        ...calcEfficiency(rom.tier, rom.memory, rom.priceEth, settings.linked, settings.juiced),
      })),
    [listings, settings.linked, settings.juiced],
  )

  const filteredListings = useMemo(
    () =>
      enrichedListings.filter(
        (rom) =>
          filters.factions.includes(rom.faction) &&
          filters.tiers.includes(rom.tier) &&
          filters.memories.includes(rom.memory),
      ),
    [enrichedListings, filters],
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
          <h1 className="font-bitcell text-[20px] uppercase tracking-[3px] text-giga-gold">
            Gigaverse ROMs
          </h1>
          <p
            className="font-bitcell text-[10px] uppercase tracking-[1px]"
            style={{ color: '#7a8a9e', maxWidth: '760px', lineHeight: '1.8' }}
          >
            The premier assets of Gigaverse ecosystem. ROMs generate extra energy and exclusive
            faction materials (shards and dust). There are 4 rarities of ROMs — Silver, Gold, Void
            and Giga — with different types of Memory that result in production output.
          </p>
          <p className="font-bitcell text-[10px] uppercase tracking-[1.5px]" style={{ color: '#F5C563' }}>
            Updated {lastUpdatedFormatted}
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <span className="font-bitcell text-[10px] uppercase tracking-[2px]" style={{ color: '#e0e0e0' }}>
            Filters
          </span>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {/* Legend + boosts bar */}
        <div
          className="border-y-[4px] relative px-4 py-2.5 flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: '#0483AB1a', backgroundColor: '#081420' }}
        >
          <span
            className="absolute inset-0 pointer-events-none -mx-[4px] border-x-[4px]"
            style={{ borderColor: '#0483AB1a' }}
            aria-hidden
          />
          <div className="font-bitcell text-[11px] uppercase tracking-[1px] space-y-1" style={{ color: '#7a8a9e' }}>
            <p>Energy Eff = Weekly energy ÷ price ETH &nbsp;|&nbsp; Shard Eff = Weekly shards ÷ price ETH &nbsp;|&nbsp; Dust Eff = Weekly dust ÷ price ETH</p>
            {(settings.linked || settings.juiced) && (
              <p style={{ color: '#F5C563' }}>
                ★ Active boosts:{settings.linked ? ' Linked ×1.6' : ''}{settings.linked && settings.juiced ? ' ·' : ''}{settings.juiced ? ' Juiced ×1.2' : ''}
              </p>
            )}
          </div>
          <ControlBar settings={settings} onChange={setSettings} />
        </div>

        {/* Table */}
        <RomTable
          listings={filteredListings}
          ethUsd={ethUsd}
        />
      </main>
    </div>
  )
}
