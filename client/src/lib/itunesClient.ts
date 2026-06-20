/**
 * Browser-callable iTunes Search.
 * Apple's iTunes Search API sends permissive CORS headers, so this works
 * directly from the browser with no backend involved — useful as a live
 * "repair" mechanism when a track's preview URL is missing or has gone stale.
 */

export interface RepairedTrack {
  previewUrl:  string
  albumArt:    string | null
  durationSec: number
}

function cleanTerm(s: string): string {
  // Strip parenthetical noise like "(Remastered 2011)" which often hurts iTunes matching
  return s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
}

export async function findItunesPreview(title: string, artist: string): Promise<RepairedTrack | null> {
  const term = cleanTerm(`${title} ${artist}`)
  if (!term) return null

  try {
    const url = `https://itunes.apple.com/search?` + new URLSearchParams({
      term,
      media:  'music',
      entity: 'song',
      limit:  '5',
    })
    const res = await fetch(url)
    if (!res.ok) return null

    const data  = await res.json()
    const match = (data.results ?? []).find((t: any) => !!t.previewUrl)
    if (!match) return null

    return {
      previewUrl:  match.previewUrl,
      albumArt:    match.artworkUrl100?.replace('100x100', '300x300') ?? null,
      durationSec: Math.round((match.trackTimeMillis ?? 30000) / 1000),
    }
  } catch {
    return null
  }
}
