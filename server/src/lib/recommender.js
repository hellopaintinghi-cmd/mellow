import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir   = path.resolve(__dirname, '../../../data')

const SONGS  = JSON.parse(readFileSync(path.join(dataDir, 'songs.json'),     'utf8'))
const WORLDS = JSON.parse(readFileSync(path.join(dataDir, 'moodWorlds.json'),'utf8'))
const QUOTES = JSON.parse(readFileSync(path.join(dataDir, 'quotes.json'),    'utf8'))

const FEATURE_KEYS = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness']

const GENRE_TARGET = {
  lofi:      [0.30, 0.52, 0.43, 0.62, 0.84],
  jazz:      [0.38, 0.52, 0.55, 0.58, 0.64],
  classical: [0.28, 0.28, 0.44, 0.92, 0.97],
  ambient:   [0.15, 0.20, 0.38, 0.72, 0.92],
  synth:     [0.66, 0.72, 0.56, 0.09, 0.73],
  acoustic:  [0.38, 0.50, 0.62, 0.82, 0.22],
  indie:     [0.50, 0.58, 0.57, 0.42, 0.14],
  citypop:   [0.64, 0.72, 0.72, 0.17, 0.11],
  piano:     [0.22, 0.28, 0.44, 0.94, 0.97],
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
  return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb))
}

const STOP = new Set(['a','an','the','i','my','me','is','am','are','to','in',
  'at','on','of','and','or','with','that','this','like','want','feel','im',
  'feeling','feels','while','its'])

function tokenise(text) {
  return text.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(t => t && !STOP.has(t))
}

function scoreWorld(world, tokens) {
  let hits = 0
  for (const kw of world.keywords) {
    if (tokenise(kw).some(t => tokens.has(t))) hits += 2
  }
  for (const tag of [...world.emotionTags, ...world.activityTags, ...world.settingTags, ...world.weatherTags]) {
    if (tokenise(tag).some(t => tokens.has(t))) hits++
  }
  const max = world.keywords.length * 2 +
    world.emotionTags.length + world.activityTags.length +
    world.settingTags.length + world.weatherTags.length
  return max === 0 ? 0 : hits / max
}

export function generateMood(prompt, playlistSize = 6) {
  const tokens = new Set(tokenise(prompt))

  let best = WORLDS[0], bestScore = -1
  for (const w of WORLDS) {
    const s = scoreWorld(w, tokens)
    if (s > bestScore) { bestScore = s; best = w }
  }
  if (bestScore === 0) best = WORLDS[Math.floor(Math.random() * WORLDS.length)]

  const primaryTarget   = GENRE_TARGET[best.primaryGenre]   ?? GENRE_TARGET.lofi
  const secondaryTarget = GENRE_TARGET[best.secondaryGenre] ?? GENRE_TARGET.lofi
  const target = primaryTarget.map((v, i) => v * 0.65 + secondaryTarget[i] * 0.35)

  const scored = SONGS.map(song => {
    const vec  = FEATURE_KEYS.map(k => song[k])
    const sim  = cosine(vec, target)
    const bonus = (song.genre === best.primaryGenre || song.genre === best.secondaryGenre) ? 0.05 : 0
    return { song, score: Math.min(1, sim + bonus) }
  }).sort((a, b) => b.score - a.score)

  const playlist = scored.slice(0, playlistSize).map(s => s.song)

  const emotionSet = new Set(best.emotionTags)
  const matching   = QUOTES.filter(q => q.tags.some(t => emotionSet.has(t)) || q.tags.includes('general'))
  const pool       = matching.length > 0 ? matching : QUOTES
  const quote      = pool[Math.floor(Math.random() * pool.length)].text

  return { world: best, playlist, quote, matchScore: Math.min(1, bestScore > 0 ? bestScore : 0.5) }
}

export function relatedWorlds(worldId, n = 4) {
  const base = WORLDS.find(w => w.id === worldId)
  if (!base) return WORLDS.slice(0, n)
  const baseSet = new Set([...base.emotionTags, ...base.activityTags, ...base.settingTags])
  return WORLDS.filter(w => w.id !== worldId)
    .map(w => {
      const wSet = new Set([...w.emotionTags, ...w.activityTags, ...w.settingTags])
      let inter = 0
      for (const t of wSet) if (baseSet.has(t)) inter++
      const union = new Set([...baseSet, ...wSet]).size
      return { world: w, j: union === 0 ? 0 : inter / union }
    })
    .sort((a, b) => b.j - a.j)
    .slice(0, n)
    .map(r => r.world)
}

export { WORLDS, SONGS, QUOTES }
