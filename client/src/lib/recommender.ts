/**
 * Mellow Recommendation Engine
 * ─────────────────────────────
 * Content-based filtering using cosine similarity on audio features.
 * No external API needed — works entirely with the static songs.json.
 *
 * Pipeline:
 *   1. Parse user prompt → keyword tokens
 *   2. Score each MoodWorld by keyword overlap (Jaccard-style + field weights)
 *   3. Pick best-matching world
 *   4. Build a target audio-feature vector from the world's profile
 *   5. Score each song by cosine similarity to the target vector
 *   6. Return top-K songs as playlist
 */

import type { Song, MoodWorld } from '@/types'
import songsData   from '@/data/songs.json'
import worldsData  from '@/data/moodWorlds.json'
import quotesData  from '@/data/quotes.json'

export const SONGS:  Song[]      = songsData  as unknown as Song[]
export const WORLDS: MoodWorld[] = worldsData as unknown as MoodWorld[]
export const QUOTES: { id: string; text: string; tags: string[] }[] = quotesData

// ── Feature vector keys (order matters for cosine similarity) ────────────────
const FEATURE_KEYS = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'] as const
type FeatureKey = typeof FEATURE_KEYS[number]

function songVector(s: Song): number[] {
  return FEATURE_KEYS.map(k => s[k as FeatureKey])
}

// Target vectors per genre — tuned empirically to match the genre profiles
const GENRE_TARGET: Record<string, number[]> = {
  //                  energy dance  valence acou   instr
  lofi:      [0.30,   0.52,   0.43,   0.62,   0.84],
  jazz:      [0.38,   0.52,   0.55,   0.58,   0.64],
  classical: [0.28,   0.28,   0.44,   0.92,   0.97],
  ambient:   [0.15,   0.20,   0.38,   0.72,   0.92],
  synth:     [0.66,   0.72,   0.56,   0.09,   0.73],
  acoustic:  [0.38,   0.50,   0.62,   0.82,   0.22],
  indie:     [0.50,   0.58,   0.57,   0.42,   0.14],
  citypop:   [0.64,   0.72,   0.72,   0.17,   0.11],
  piano:     [0.22,   0.28,   0.44,   0.94,   0.97],
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Normalise text: lowercase, remove punctuation, split on whitespace */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Simple stop words to skip in keyword matching */
const STOP = new Set(['a','an','the','i','my','me','is','am','are','to','in',
  'at','on','of','and','or','with','that','this','like','want','feel','im',
  'feeling','feels','while','its','its'])

/** Score a world against query tokens. Returns 0–1. */
function scoreWorld(world: MoodWorld, tokens: Set<string>): number {
  let hits = 0
  for (const kw of world.keywords) {
    const kwTokens = tokenise(kw)
    if (kwTokens.some(t => tokens.has(t))) hits += 2.0
  }
  for (const tag of [...world.emotionTags, ...world.activityTags, ...world.settingTags, ...world.weatherTags]) {
    const tTokens = tokenise(tag)
    if (tTokens.some(t => tokens.has(t))) hits += 1.0
  }
  const maxPossible = world.keywords.length * 2 + 
    (world.emotionTags.length + world.activityTags.length + world.settingTags.length + world.weatherTags.length)
  return maxPossible === 0 ? 0 : hits / maxPossible
}

export interface MoodResult {
  world: MoodWorld
  playlist: Song[]
  quote: string
  matchScore: number
}

export function generateMood(prompt: string, playlistSize = 6): MoodResult {
  const raw    = tokenise(prompt).filter(t => !STOP.has(t))
  const tokens = new Set(raw)

  // ── 1. Find best world ──────────────────────────────────────────────────
  let best: MoodWorld = WORLDS[0]
  let bestScore = -1
  for (const w of WORLDS) {
    const s = scoreWorld(w, tokens)
    if (s > bestScore) { bestScore = s; best = w }
  }
  // Fall back to a random world if nothing matched at all
  if (bestScore === 0) {
    best = WORLDS[Math.floor(Math.random() * WORLDS.length)]
  }

  // ── 2. Build target audio vector ────────────────────────────────────────
  const primaryTarget  = GENRE_TARGET[best.primaryGenre]  ?? GENRE_TARGET.lofi
  const secondaryTarget= GENRE_TARGET[best.secondaryGenre] ?? GENRE_TARGET.lofi
  // Blend: 65% primary, 35% secondary
  const target = primaryTarget.map((v, i) => v * 0.65 + secondaryTarget[i] * 0.35)

  // ── 3. Score songs by cosine similarity, prefer matching genre ──────────
  const scored = SONGS.map(song => {
    const sim = cosine(songVector(song), target)
    // Small bonus if genre matches exactly
    const genreBonus = (song.genre === best.primaryGenre || song.genre === best.secondaryGenre) ? 0.05 : 0
    return { song, score: Math.min(1, sim + genreBonus) }
  }).sort((a, b) => b.score - a.score)

  const playlist = scored.slice(0, playlistSize).map(s => s.song)

  // ── 4. Pick a quote ─────────────────────────────────────────────────────
  const emotionTags = new Set(best.emotionTags)
  const matchingQuotes = QUOTES.filter(q =>
    q.tags.some(t => emotionTags.has(t)) || q.tags.includes('general')
  )
  const quotePool = matchingQuotes.length > 0 ? matchingQuotes : QUOTES
  const quote = quotePool[Math.floor(Math.random() * quotePool.length)].text

  return {
    world:      best,
    playlist,
    quote,
    matchScore: Math.min(1, bestScore > 0 ? bestScore : 0.5),
  }
}

/** KNN: find N worlds most similar to a given worldId (by shared tags). */
export function relatedWorlds(worldId: string, n = 4): MoodWorld[] {
  const base = WORLDS.find(w => w.id === worldId)
  if (!base) return WORLDS.slice(0, n)
  const baseSet = new Set([...base.emotionTags, ...base.activityTags, ...base.settingTags])

  return WORLDS
    .filter(w => w.id !== worldId)
    .map(w => {
      const wSet = new Set([...w.emotionTags, ...w.activityTags, ...w.settingTags])
      let inter = 0
      for (const t of wSet) if (baseSet.has(t)) inter++
      const union = new Set([...baseSet, ...wSet]).size
      return { world: w, jaccard: union === 0 ? 0 : inter / union }
    })
    .sort((a, b) => b.jaccard - a.jaccard)
    .slice(0, n)
    .map(r => r.world)
}
