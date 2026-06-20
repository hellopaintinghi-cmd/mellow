// ─── Core Mood Types ──────────────────────────────────────────────────────────

export interface Song {
  id: string
  title: string
  artist: string
  genre: string
  energy: number
  tempo: number
  danceability: number
  valence: number
  acousticness: number
  instrumentalness: number
  durationSec: number
  coverPalette: string | null
}

export interface MoodWorld {
  id: string
  name: string
  tagline: string
  keywords: string[]
  emotionTags: string[]
  activityTags: string[]
  settingTags: string[]
  weatherTags: string[]
  energyLevel: number     // 1–5
  focusLevel: number      // 1–5
  calmLevel: number       // 1–5
  primaryGenre: string
  secondaryGenre: string
  palette: {
    bg: string
    primary: string
    secondary: string
    accent: string
    text: string
  }
  ambientSounds: AmbientSound[]
  scene: SceneConfig
  gardenPlant: PlantType
}

export interface SceneConfig {
  sky: [string, string]
  ground: string
  weather: 'rain' | 'snow' | 'stars' | 'none'
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'
  props: SceneProp[]
}

export type SceneProp = 
  | 'window' | 'laptop' | 'cup' | 'lamp' | 'shelf' | 'books' | 'plant'
  | 'flowers' | 'tree' | 'butterfly' | 'cloud' | 'sun' | 'moon' | 'fire'
  | 'tent' | 'mountain' | 'waves' | 'boat' | 'train' | 'umbrella'
  | 'telescope' | 'stall'

export type AmbientSound =
  | 'rain' | 'thunder' | 'ocean-waves' | 'fireplace' | 'wind'
  | 'cafe-chatter' | 'birds' | 'train-hum' | 'keyboard-clicks'
  | 'page-turns' | 'vinyl-crackle' | 'neon-hum' | 'forest-night'
  | 'snow-wind' | 'cup-clinks' | 'distant-traffic' | 'grass-rustle'
  | 'clock-tick' | 'seagulls'

export type PlantType =
  | 'lavender' | 'cherry-blossom' | 'sunflower' | 'tulip' | 'daisy'
  | 'water-lily' | 'wildflower' | 'fern' | 'pine-sprig' | 'white-orchid'
  | 'maple-leaf' | 'neon-cactus'

// ─── Generated Mood Card ──────────────────────────────────────────────────────

export interface MoodCard {
  id: string
  title: string
  tagline: string
  userPrompt: string
  worldId: string
  world: MoodWorld
  playlist: Song[]
  quote: string
  energyLevel: number
  focusLevel: number
  calmLevel: number
  matchScore: number        // 0–1  how well the query matched
  createdAt: number         // epoch ms
  savedAt?: number
}

// ─── User & Gamification ──────────────────────────────────────────────────────

export type PetSpecies = 'cat' | 'bunny' | 'fox' | 'capybara' | 'penguin'

export interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string
  pet: PetSpecies
  petLevel: number          // 1–10
  xp: number
  level: number
  streakDays: number
  lastActiveDate: string    // ISO date
  savedCards: string[]      // MoodCard ids
  garden: GardenSlot[]
  boards: Board[]
  moodsGenerated: number
  joinedAt: number
}

export interface GardenSlot {
  slotId: number
  plant: PlantType
  level: number             // 1–3 growth stages
  unlockedAt: number
}

export interface Board {
  id: string
  title: string
  description: string
  cardIds: string[]
  coverCardId?: string
  createdAt: number
}

// ─── XP / Levels ─────────────────────────────────────────────────────────────

export const LEVEL_NAMES: Record<number, string> = {
  1:   'Dreamer',
  5:   'Wanderer',
  10:  'Explorer',
  15:  'Curator',
  20:  'Storyteller',
  30:  'Realm Builder',
  50:  'Mood Architect',
  75:  'Dimension Keeper',
  100: 'Universe Creator',
}

export function getLevelName(level: number): string {
  const thresholds = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a)
  for (const t of thresholds) {
    if (level >= t) return LEVEL_NAMES[t]
  }
  return 'Dreamer'
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1))
}

export function levelFromXp(xp: number): number {
  let l = 1
  let total = 0
  while (true) {
    const needed = xpForLevel(l)
    if (total + needed > xp) return l
    total += needed
    l++
  }
}

// ─── Ambient Sound Config ─────────────────────────────────────────────────────

export const AMBIENT_META: Record<AmbientSound, { label: string; emoji: string }> = {
  'rain':           { label: 'Rain',           emoji: '🌧️' },
  'thunder':        { label: 'Thunder',        emoji: '⛈️' },
  'ocean-waves':    { label: 'Ocean Waves',    emoji: '🌊' },
  'fireplace':      { label: 'Fireplace',      emoji: '🔥' },
  'wind':           { label: 'Wind',           emoji: '💨' },
  'cafe-chatter':   { label: 'Café Chatter',   emoji: '☕' },
  'birds':          { label: 'Birds',          emoji: '🐦' },
  'train-hum':      { label: 'Train Hum',      emoji: '🚆' },
  'keyboard-clicks':{ label: 'Keyboard',       emoji: '⌨️' },
  'page-turns':     { label: 'Page Turns',     emoji: '📖' },
  'vinyl-crackle':  { label: 'Vinyl Crackle',  emoji: '🎵' },
  'neon-hum':       { label: 'Neon Hum',       emoji: '💡' },
  'forest-night':   { label: 'Forest Night',   emoji: '🌲' },
  'snow-wind':      { label: 'Snow Wind',      emoji: '❄️' },
  'cup-clinks':     { label: 'Cup Clinks',     emoji: '🫖' },
  'distant-traffic':{ label: 'City Traffic',   emoji: '🏙️' },
  'grass-rustle':   { label: 'Grass Rustle',   emoji: '🌿' },
  'clock-tick':     { label: 'Clock Tick',     emoji: '🕐' },
  'seagulls':       { label: 'Seagulls',       emoji: '🐚' },
}
