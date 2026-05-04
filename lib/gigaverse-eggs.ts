const BASE_URL = 'https://gigaverse.io/api/pets/metadatav2'
/** 200 req/min → 300 ms between calls keeps us safely under the limit */
const DELAY_MS = 300

export interface EggHatchData {
  progress?: number
  quality?: number
  fate?: Record<string, number>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchEggHatchData(tokenIds: string[]): Promise<Map<string, EggHatchData>> {
  const result = new Map<string, EggHatchData>()

  for (let i = 0; i < tokenIds.length; i++) {
    if (i > 0) await sleep(DELAY_MS)

    const tokenId = tokenIds[i]
    try {
      const res = await fetch(`${BASE_URL}/${tokenId}`, {
        headers: { 'User-Agent': 'GigaverseHub.com' },
      })
      if (!res.ok) continue

      const data = (await res.json()) as {
        attributes?: Array<{ trait_type: string; value: string | number }>
      }
      if (!data.attributes) continue

      const entry: EggHatchData = {}

      for (const attr of data.attributes) {
        if (attr.trait_type === 'Progress' && typeof attr.value === 'number') {
          entry.progress = attr.value
        } else if (attr.trait_type === 'Rarity' && typeof attr.value === 'number') {
          entry.quality = attr.value
        } else if (attr.trait_type.startsWith('Fate: ') && typeof attr.value === 'number') {
          const faction = attr.trait_type.slice(6).toUpperCase()
          entry.fate ??= {}
          entry.fate[faction] = attr.value
        }
      }

      if (entry.progress !== undefined || entry.quality !== undefined || entry.fate !== undefined) {
        result.set(tokenId, entry)
      }
    } catch {
      // skip per-token errors silently
    }
  }

  return result
}
