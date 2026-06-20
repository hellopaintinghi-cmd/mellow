/**
 * Shared cache for "repaired" preview lookups, keyed by title+artist.
 * Multiple components (MusicPlayer, playlist rows) can ask for the same
 * track without triggering duplicate iTunes requests — the first caller
 * triggers the lookup, everyone else reads from cache and re-renders via
 * the subscribe mechanism once it resolves.
 */
import { findItunesPreview } from './itunesClient'

export type RepairStatus = 'idle' | 'loading' | 'found' | 'missing'

export interface RepairEntry {
  previewUrl:  string | null
  albumArt:    string | null
  durationSec: number | null
  status:      RepairStatus
}

const cache = new Map<string, RepairEntry>()
const listeners = new Set<() => void>()

function cacheKey(title: string, artist: string): string {
  return `${title}|||${artist}`.toLowerCase().trim()
}

function notify() {
  listeners.forEach(fn => fn())
}

export function subscribePreviewCache(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getCachedPreview(title: string, artist: string): RepairEntry | undefined {
  return cache.get(cacheKey(title, artist))
}

/**
 * Look up (or re-use cached) a playable preview for a track.
 * Safe to call repeatedly — will not duplicate in-flight requests.
 */
export async function repairPreview(title: string, artist: string): Promise<RepairEntry> {
  const key = cacheKey(title, artist)
  const existing = cache.get(key)
  if (existing && existing.status !== 'idle') return existing

  cache.set(key, { previewUrl: null, albumArt: null, durationSec: null, status: 'loading' })
  notify()

  const result = await findItunesPreview(title, artist)

  const entry: RepairEntry = result
    ? { previewUrl: result.previewUrl, albumArt: result.albumArt, durationSec: result.durationSec, status: 'found' }
    : { previewUrl: null, albumArt: null, durationSec: null, status: 'missing' }

  cache.set(key, entry)
  notify()
  return entry
}

/** Force a fresh repair even if we previously found something (used when a known-good URL turns out to be dead at playback time). */
export async function forceRepair(title: string, artist: string): Promise<RepairEntry> {
  const key = cacheKey(title, artist)
  cache.delete(key)
  return repairPreview(title, artist)
}
