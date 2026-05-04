'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/roms', label: 'ROMs' },
  { href: '/giglings/steeds', label: 'Steeds' },
  { href: '/giglings/eggs', label: 'Eggs' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav
      className="border-b px-6 py-3 flex items-center gap-6"
      style={{ backgroundColor: '#081420', borderColor: '#0483AB33' }}
    >
      <Link
        href="/"
        className="font-bitcell text-[14px] uppercase tracking-[3px] text-giga-gold hover:opacity-80 transition-opacity"
      >
        GIGAVERSE
      </Link>

      <span className="h-4 w-px opacity-20" style={{ backgroundColor: '#0483AB' }} />

      {LINKS.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="font-bitcell text-[12px] uppercase tracking-[2px] transition-colors"
            style={{ color: active ? '#02C7D7' : '#7a8a9e' }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
