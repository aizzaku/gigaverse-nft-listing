export async function fetchEthUsd(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    { next: { revalidate: 21600 }, headers: { 'user-agent': 'GigaverseHub.com' } },
  )
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data = await res.json() as { ethereum: { usd: number } }
  return data.ethereum.usd
}
