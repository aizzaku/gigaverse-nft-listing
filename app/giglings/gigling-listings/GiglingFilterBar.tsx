'use client'

import { PixelButton } from '@gigaverse/ui'
import type { GiglingActiveFilters, GiglingVariant } from './GiglingListingsClient'
import type { GiglingRarity, GiglingFaction, GiglingGender, EggType } from '@/types/gigling'
import {
  GIGLING_RARITIES,
  GIGLING_FACTIONS,
  GIGLING_GENDERS,
  EGG_TYPES,
} from '@/types/gigling'

const RARITY_COLORS: Record<GiglingRarity, string> = {
  UNCOMMON: '#4DCC4D',
  RARE: '#4D4DFF',
  EPIC: '#CC33CC',
  LEGENDARY: '#FFCC00',
  RELIC: '#CC4D00',
  GIGA: '#FFCC33',
}

const FACTION_COLORS: Record<GiglingFaction, string> = {
  ARCHON: '#0383AC',
  ATHENA: '#9026CD',
  CHOBO: '#C7DCD0',
  CRUSADER: '#C32454',
  FOXGLOVE: '#229062',
  OVERSEER: '#EB4F36',
  SUMMONER: '#FEC733',
  GIGUS: '#562344',
  NONE: '#3a4a5e',
}

const GENDER_COLORS: Record<GiglingGender, string> = {
  MALE: '#4a9fd5',
  FEMALE: '#CC86CB',
}

const EGG_TYPE_COLORS: Record<EggType, string> = {
  INAUGURAL_STEED: '#4DCC4D',
  SILVER: '#C0C0C0',
  GOLD: '#F5C563',
  VOID: '#9026CD',
  GIGA: '#FFCC33',
}

const EGG_TYPE_LABELS: Record<EggType, string> = {
  INAUGURAL_STEED: 'Inaugural Steed',
  SILVER: 'Silver',
  GOLD: 'Gold',
  VOID: 'Void',
  GIGA: 'Giga',
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

function BadgeGroup<T extends string>({
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
              {getLabel ? getLabel(opt) : toLabel(String(opt))}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function isGigaRarity(r: GiglingRarity) { return r === 'GIGA' }
function isGigaEggType(e: EggType) { return e === 'GIGA' }

interface Props {
  filters: GiglingActiveFilters
  onFiltersChange: (f: GiglingActiveFilters) => void
  variant: GiglingVariant
}

export function GiglingFilterBar({ filters, onFiltersChange, variant }: Props) {
  const isDirty = variant === 'STEEDS'
    ? (
        filters.rarities.length < GIGLING_RARITIES.length ||
        filters.factions.length < GIGLING_FACTIONS.length ||
        filters.genders.length < GIGLING_GENDERS.length
      )
    : filters.eggTypes.length < EGG_TYPES.length

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {variant === 'STEEDS' ? (
        <>
          <BadgeGroup<GiglingRarity>
            label="Rarity"
            options={GIGLING_RARITIES}
            selected={filters.rarities}
            onChange={(rarities) => onFiltersChange({ ...filters, rarities })}
            getColor={(r) => RARITY_COLORS[r]}
            getActiveTextStyle={(r) => isGigaRarity(r) ? GIGA_TEXT_STYLE : { color: RARITY_COLORS[r] }}
            getActiveBorderStyle={(r) => isGigaRarity(r) ? GIGA_BORDER_STYLE : { borderColor: `${RARITY_COLORS[r]}55` }}
          />

          <BadgeGroup<GiglingFaction>
            label="Faction"
            options={GIGLING_FACTIONS}
            selected={filters.factions}
            onChange={(factions) => onFiltersChange({ ...filters, factions })}
            getColor={(f) => FACTION_COLORS[f]}
            getLabel={(f) => (f === 'NONE' ? 'None' : toLabel(f))}
          />

          <BadgeGroup<GiglingGender>
            label="Gender"
            options={GIGLING_GENDERS}
            selected={filters.genders}
            onChange={(genders) => onFiltersChange({ ...filters, genders })}
            getColor={(g) => GENDER_COLORS[g]}
          />
        </>
      ) : (
        <BadgeGroup<EggType>
          label="Type"
          options={EGG_TYPES}
          selected={filters.eggTypes}
          onChange={(eggTypes) => onFiltersChange({ ...filters, eggTypes })}
          getColor={(e) => EGG_TYPE_COLORS[e]}
          getLabel={(e) => EGG_TYPE_LABELS[e]}
          getActiveTextStyle={(e) => isGigaEggType(e) ? GIGA_TEXT_STYLE : { color: EGG_TYPE_COLORS[e] }}
          getActiveBorderStyle={(e) => isGigaEggType(e) ? GIGA_BORDER_STYLE : { borderColor: `${EGG_TYPE_COLORS[e]}55` }}
        />
      )}

      {isDirty && (
        <PixelButton
          variant="ghost"
          size="sm"
          onClick={() =>
            onFiltersChange({
              rarities: [...GIGLING_RARITIES],
              eggTypes: [...EGG_TYPES],
              factions: [...GIGLING_FACTIONS],
              genders: [...GIGLING_GENDERS],
            })
          }
        >
          Clear
        </PixelButton>
      )}
    </div>
  )
}
