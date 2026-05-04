import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gigaverse NFTs',
  description: 'Browse and compare Gigaverse ROM NFT listings by efficiency and return rate.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-giga-navy text-giga-heading antialiased">
        {children}
      </body>
    </html>
  )
}
