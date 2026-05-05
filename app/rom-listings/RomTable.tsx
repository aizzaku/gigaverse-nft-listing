'use client'

import { useState, useMemo } from 'react'
import {
  PixelPagination,
  PixelPaginationContent,
  PixelPaginationItem,
  PixelPaginationLink,
  PixelPaginationPrevious,
  PixelPaginationNext,
  PixelPaginationEllipsis,
} from '@gigaverse/ui'
import { CaretUp, CaretDown, ArrowsDownUp, ArrowSquareOut } from '@phosphor-icons/react'
import type { RomListing, Tier, Faction } from '@/types/rom'
import type { RomEfficiency } from '@/lib/rom-calculations'
type EnrichedListing = RomListing & RomEfficiency

type SortKey = 'priceEth' | 'energyEfficiency' | 'shardsEfficiency' | 'dustEfficiency'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 25

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

function tierTextStyle(tier: Tier): React.CSSProperties {
  return tier === 'GIGA' ? GIGA_TEXT_STYLE : { color: TIER_COLORS[tier] }
}

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

function formatNum(n: number, decimals = 2): string {
  if (!isFinite(n) || n === 0) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })
}

function SortButton({
  label,
  tooltip,
  active,
  dir,
  onClick,
}: {
  label: string
  tooltip?: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="flex items-center gap-1 font-bitcell text-[14px] uppercase tracking-[1.5px] transition-colors hover:text-giga-heading"
      style={{ color: active ? '#02C7D7' : '#7a8a9e' }}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <CaretUp size={14} weight="bold" />
        ) : (
          <CaretDown size={14} weight="bold" />
        )
      ) : (
        <ArrowsDownUp size={14} className="opacity-30" />
      )}
    </button>
  )
}

function PageJumper({ totalPages, onJump }: { totalPages: number; onJump: (p: number) => void }) {
  const [val, setVal] = useState('')

  function commit() {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages) onJump(n)
    setVal('')
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-bitcell text-[12px] uppercase tracking-[1.5px]" style={{ color: '#7a8a9e' }}>
        Go
      </span>
      <div className="relative border-y-[3px]" style={{ borderColor: '#0483AB66' }}>
        <span
          className="absolute inset-0 pointer-events-none -mx-[3px] border-x-[3px]"
          style={{ borderColor: '#0483AB66' }}
          aria-hidden
        />
        <input
          type="number"
          min={1}
          max={totalPages}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder={String(totalPages)}
          className="font-bitcell text-[13px] bg-transparent px-2 py-0.5 w-14 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: '#e0e0e0' }}
        />
      </div>
    </div>
  )
}

function OpenSeaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 90 90" fill="currentColor" aria-hidden>
      <path d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.849 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.71 34.911 46.953C34.839 47.061 34.713 47.124 34.578 47.124H22.545C22.221 47.124 22.032 46.773 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.461V52.677H37.467C37.143 52.677 36.945 52.308 37.134 52.047C37.206 51.939 37.278 51.849 37.368 51.723C38.97 49.491 41.31 46.08 43.623 42.21C44.865 40.149 46.08 37.953 47.007 35.757C47.178 35.37 47.331 34.965 47.475 34.578C47.7 33.948 47.898 33.381 48.042 32.85C48.168 32.391 48.276 31.905 48.357 31.437C48.573 30.213 48.663 28.944 48.663 27.648C48.663 27.18 48.645 26.694 48.6 26.226C48.564 25.722 48.501 25.218 48.438 24.714C48.393 24.264 48.294 23.823 48.204 23.4C48.069 22.779 47.898 22.158 47.7 21.555L47.637 21.285C47.502 20.826 47.358 20.385 47.205 19.944C46.719 18.477 46.188 17.019 45.612 15.642C45.414 15.183 45.198 14.742 44.982 14.31C44.721 13.77 44.424 13.248 44.145 12.735C43.992 12.456 43.83 12.195 43.677 11.952C43.506 11.682 43.344 11.43 43.182 11.196L42.804 10.584C42.633 10.323 42.831 9.999 43.146 10.035L65.502 12.456H65.547C65.619 12.456 65.7 12.474 65.763 12.51L66.501 12.888C66.501 12.888 66.474 12.915 66.447 12.933L66.213 13.113C66.096 13.203 65.979 13.32 65.862 13.446C65.484 13.851 65.124 14.427 64.872 15.084C64.206 16.803 63.864 18.918 63.954 21.204C63.981 21.888 64.035 22.545 64.134 23.166C64.224 23.832 64.368 24.444 64.566 25.029C64.854 25.884 65.268 26.658 65.808 27.288C66.006 27.513 66.267 27.693 66.501 27.882C66.753 28.08 67.023 28.233 67.311 28.35C67.698 28.512 68.13 28.62 68.616 28.638C69.102 28.656 69.642 28.575 70.209 28.35C70.389 28.278 70.605 28.17 70.839 28.044L71.82 27.441C71.865 27.387 71.883 27.351 71.883 27.351L72.189 27.171C72.495 26.991 72.837 27.225 72.837 27.576V52.164C72.837 52.524 72.729 52.749 74.376 52.812Z" />
    </svg>
  )
}

interface Props {
  listings: EnrichedListing[]
  ethUsd: number
}

export function RomTable({ listings, ethUsd }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('energyEfficiency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(
    () =>
      [...listings].sort((a, b) =>
        sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey],
      ),
    [listings, sortKey, sortDir],
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const thBase = {
    padding: '6px 12px',
    backgroundColor: '#070d18',
    borderBottom: '1px solid #0c2030',
    whiteSpace: 'nowrap' as const,
  }

  const tdBase = {
    padding: '5px 12px',
    borderBottom: '1px solid #081420',
    whiteSpace: 'nowrap' as const,
  }

  const colLabel = (text: string) => (
    <span className="font-bitcell text-[14px] uppercase tracking-[1.5px]" style={{ color: '#7a8a9e' }}>
      {text}
    </span>
  )

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="border-y-[6px] relative rounded-none overflow-hidden"
        style={{ borderColor: '#0483AB4d' }}>
        <span className="absolute inset-0 pointer-events-none -mx-[6px] border-x-[6px]"
          style={{ borderColor: '#0483AB4d' }} aria-hidden />

        <div className="overflow-x-auto" style={{ minHeight: '480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thBase, padding: '6px 8px 6px 12px', width: '72px' }} />
                <th style={thBase} className="text-left">{colLabel('Token')}</th>
                <th style={thBase} className="text-left">{colLabel('Tier')}</th>
                <th style={thBase} className="text-left">{colLabel('Memory')}</th>
                <th style={thBase} className="text-left">{colLabel('Faction')}</th>
                <th style={thBase} className="text-left">
                  <SortButton
                    label="Price ETH"
                    active={sortKey === 'priceEth'}
                    dir={sortDir}
                    onClick={() => handleSort('priceEth')}
                  />
                </th>
                <th style={thBase} className="text-left">{colLabel('Price USD')}</th>
                <th style={thBase} className="text-left">
                  <SortButton
                    label="Energy Eff"
                    tooltip="Weekly Energy per 1 ETH"
                    active={sortKey === 'energyEfficiency'}
                    dir={sortDir}
                    onClick={() => handleSort('energyEfficiency')}
                  />
                </th>
                <th style={thBase} className="text-left">
                  <SortButton
                    label="Shard Eff"
                    tooltip="Weekly Shards per 1 ETH"
                    active={sortKey === 'shardsEfficiency'}
                    dir={sortDir}
                    onClick={() => handleSort('shardsEfficiency')}
                  />
                </th>
                <th style={thBase} className="text-left">
                  <SortButton
                    label="Dust Eff"
                    tooltip="Weekly Dust per 1 ETH"
                    active={sortKey === 'dustEfficiency'}
                    dir={sortDir}
                    onClick={() => handleSort('dustEfficiency')}
                  />
                </th>
                <th style={thBase} />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ ...tdBase, textAlign: 'center', padding: '48px 12px' }}>
                    <span className="font-bitcell text-[14px] uppercase tracking-[2px]"
                      style={{ color: '#7a8a9e' }}>
                      No listings match current filters
                    </span>
                  </td>
                </tr>
              ) : (
                pageItems.map((rom, i) => {
                  const rowBg = i % 2 === 0 ? '#081420' : '#070d18'

                  return (
                    <tr
                      key={rom.tokenId}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ backgroundColor: rowBg }}
                    >
                      <td style={{ ...tdBase, padding: '4px 8px 4px 12px' }}>
                        {rom.imageUrl ? (
                          <img
                            src={rom.imageUrl}
                            alt={`ROM #${rom.tokenId}`}
                            width={56}
                            height={56}
                            style={{ imageRendering: 'pixelated', display: 'block' }}
                            className="rounded-none"
                          />
                        ) : (
                          <div style={{ width: 56, height: 56, backgroundColor: '#0c2030', opacity: 0.5 }} />
                        )}
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[18px]" style={{ color: '#7a8a9e' }}>
                          #{rom.tokenId}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[16px] uppercase tracking-[1.5px]"
                          style={tierTextStyle(rom.tier)}>
                          {rom.tier}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[18px]" style={{ color: '#e0e0e0' }}>
                          {rom.memory}mb
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[16px] uppercase tracking-[1.5px]"
                          style={{ color: FACTION_COLORS[rom.faction] }}>
                          {rom.faction}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[19px] tabular-nums" style={{ color: '#e0e0e0' }}>
                          {rom.priceEth.toFixed(4)}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[19px] tabular-nums" style={{ color: '#7a8a9e' }}>
                          ${rom.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[19px] tabular-nums" style={{ color: '#02C7D7' }}>
                          {formatNum(rom.energyEfficiency, 0)}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[19px] tabular-nums" style={{ color: '#e0e0e0' }}>
                          {formatNum(rom.shardsEfficiency, 2)}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <span className="font-bitcell text-[19px] tabular-nums" style={{ color: '#e0e0e0' }}>
                          {formatNum(rom.dustEfficiency, 2)}
                        </span>
                      </td>

                      <td style={tdBase}>
                        <a
                          href={rom.openseaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative inline-flex items-center gap-1.5 px-2.5 py-1 border-y-[4px] font-bitcell text-[13px] uppercase tracking-[1.5px] transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: '#0483AB1a',
                            color: '#02C7D7',
                            borderColor: '#0483AB66',
                          }}
                        >
                          <span className="absolute inset-0 pointer-events-none -mx-[4px] border-x-[4px]"
                            style={{ borderColor: '#0483AB66' }} aria-hidden />
                          <OpenSeaIcon />
                          Buy
                          <ArrowSquareOut size={13} weight="bold" />
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bitcell text-[13px] uppercase tracking-[1.5px]"
            style={{ color: '#7a8a9e' }}>
            {sorted.length} LISTINGS · PAGE {currentPage}/{totalPages}
          </span>

          <div className="flex items-center gap-3">
          <PixelPagination>
            <PixelPaginationContent>
              <PixelPaginationItem>
                <PixelPaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}
                />
              </PixelPaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pg) => {
                  if (totalPages <= 7) return true
                  if (pg === 1 || pg === totalPages) return true
                  if (Math.abs(pg - currentPage) <= 1) return true
                  return false
                })
                .reduce<(number | 'ellipsis')[]>((acc, pg, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) !== pg - 1) acc.push('ellipsis')
                  acc.push(pg)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PixelPaginationItem key={`e-${idx}`}>
                      <PixelPaginationEllipsis />
                    </PixelPaginationItem>
                  ) : (
                    <PixelPaginationItem key={item}>
                      <PixelPaginationLink
                        href="#"
                        isActive={currentPage === item}
                        onClick={(e) => { e.preventDefault(); setPage(item as number) }}
                      >
                        {item}
                      </PixelPaginationLink>
                    </PixelPaginationItem>
                  ),
                )}

              <PixelPaginationItem>
                <PixelPaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}
                />
              </PixelPaginationItem>
            </PixelPaginationContent>
          </PixelPagination>
          <PageJumper totalPages={totalPages} onJump={setPage} />
          </div>
        </div>
      )}

    </div>
  )
}
