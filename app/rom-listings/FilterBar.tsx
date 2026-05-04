'use client'

import { PixelButton } from '@gigaverse/ui'
import type { ActiveFilters } from './RomListingsClient'
import type { Tier, Faction, MemoryMb } from '@/types/rom'
import { TIERS, FACTIONS, MEMORY_OPTIONS } from '@/types/rom'

const FACTION_COLORS: Record<Faction, string> = {
  ARCHON: '#0383AC',
  ATHENA: '#9026CD',
  CHOBO: '#C7DCD0',
  CRUSADER: '#C32454',
  FOXGLOVE: '#229062',
  OVERSEER: '#EB4F36',
  SUMMONER: '#FEC733',
  GIGUS: '#562344',
}

const TIER_COLORS: Record<Tier, string> = {
  SILVER: '#C0C0C0',
  GOLD: '#F5C563',
  VOID: '#9026CD',
  GIGA: '#FFCC33',
}

const GIGA_TEXT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(90deg, #FFCC33, #02C7D7, #CC86CB)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const GIGA_BORDER_STYLE: React.CSSProperties = {
  borderImage: 'linear-gradient(90deg, #FFCC33, #02C7D7, #CC86CB) 1',
}

function toLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function BadgeGroup<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  getColor,
  getLabel,
  getActiveTextStyle,
  getActiveBorderStyle,
}: {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (v: T[]) => void
  getColor: (opt: T) => string
  getLabel?: (opt: T) => string
  getActiveTextStyle?: (opt: T) => React.CSSProperties
  getActiveBorderStyle?: (opt: T) => React.CSSProperties
}) {
  const toggle = (opt: T) =>
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    )

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span
        className="font-bitcell text-[10px] uppercase tracking-[1.5px] mr-0.5"
        style={{ color: '#e0e0e0' }}
      >
        {label}
      </span>
      {options.map((opt) => {
        const active = selected.includes(opt)
        const color = getColor(opt)
        const borderStyle = active && getActiveBorderStyle
          ? getActiveBorderStyle(opt)
          : { borderColor: active ? `${color}55` : '#0c1e2e' }

        return (
          <button
            key={String(opt)}
            onClick={() => toggle(opt)}
            className="relative px-2 py-0.5 border-y-[3px] font-bitcell text-[11px] uppercase tracking-[0.5px] transition-all"
            style={{
              backgroundColor: active ? `${color}18` : 'transparent',
              color: active ? color : '#2e3e52',
              ...borderStyle,
            }}
          >
            <span
              className="absolute inset-0 pointer-events-none -mx-[3px] border-x-[3px]"
              style={borderStyle}
              aria-hidden
            />
            <span style={active && getActiveTextStyle ? getActiveTextStyle(opt) : undefined}>
              {getLabel ? getLabel(opt) : String(opt)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  filters: ActiveFilters
  onChange: (f: ActiveFilters) => void
}

export function FilterBar({ filters, onChange }: Props) {
  const isDirty =
    filters.factions.length < FACTIONS.length ||
    filters.tiers.length < TIERS.length ||
    filters.memories.length < MEMORY_OPTIONS.length

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <BadgeGroup<Tier>
        label="Tier"
        options={TIERS}
        selected={filters.tiers}
        onChange={(tiers) => onChange({ ...filters, tiers })}
        getColor={(t) => TIER_COLORS[t]}
        getActiveTextStyle={(t) =>
          t === 'GIGA' ? GIGA_TEXT_STYLE : { color: TIER_COLORS[t] }
        }
        getActiveBorderStyle={(t) =>
          t === 'GIGA' ? GIGA_BORDER_STYLE : { borderColor: `${TIER_COLORS[t]}55` }
        }
      />

      <BadgeGroup<Faction>
        label="Faction"
        options={FACTIONS}
        selected={filters.factions}
        onChange={(factions) => onChange({ ...filters, factions })}
        getColor={(f) => FACTION_COLORS[f]}
        getLabel={(f) => toLabel(f)}
      />

      <BadgeGroup<MemoryMb>
        label="Memory"
        options={MEMORY_OPTIONS}
        selected={filters.memories}
        onChange={(memories) => onChange({ ...filters, memories })}
        getColor={() => '#02C7D7'}
        getLabel={(m) => `${m}mb`}
      />

      {isDirty && (
        <PixelButton
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              factions: [...FACTIONS],
              tiers: [...TIERS],
              memories: [...MEMORY_OPTIONS],
            })
          }
        >
          Clear
        </PixelButton>
      )}
    </div>
  )
}
