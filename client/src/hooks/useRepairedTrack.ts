import { useEffect, useState } from 'react'
import { getCachedPreview, repairPreview, subscribePreviewCache, type RepairStatus } from '@/lib/previewCache'

export interface RepairedTrackInfo {
  previewUrl: string | null
  status:     RepairStatus
  albumArt:   string | null
}

/**
 * Returns the best-known playable preview URL for a track.
 * - If `originalPreviewUrl` is already present, it's returned immediately (status: 'found').
 * - If missing, a background iTunes lookup is triggered automatically and the
 *   hook re-renders the component once it resolves.
 *
 * Pass `forceRetry` (a changing number/string) to trigger a fresh lookup —
 * used when a previously-valid URL turns out to be dead at actual playback time.
 */
export function useRepairedTrack(
  title: string,
  artist: string,
  originalPreviewUrl: string | null | undefined,
  forceRetry?: number
): RepairedTrackInfo {
  const [, forceRender] = useState(0)

  useEffect(() => subscribePreviewCache(() => forceRender(n => n + 1)), [])

  useEffect(() => {
    if (originalPreviewUrl) return
    if (!title || !artist) return
    const cached = getCachedPreview(title, artist)
    if (!cached || forceRetry !== undefined) {
      repairPreview(title, artist)
    }
  }, [title, artist, originalPreviewUrl, forceRetry])

  if (originalPreviewUrl) {
    return { previewUrl: originalPreviewUrl, status: 'found', albumArt: null }
  }

  const cached = getCachedPreview(title, artist)
  if (!cached) return { previewUrl: null, status: 'loading', albumArt: null }
  return { previewUrl: cached.previewUrl, status: cached.status, albumArt: cached.albumArt }
}
