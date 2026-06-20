import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { analyzeMoodWithGemini } from '../lib/gemini.js'
import { searchTracks, buildSpotifyQuery } from '../lib/spotify.js'
import { searchItunesTracks, buildItunesQuery } from '../lib/itunes.js'
import { generateMood, relatedWorlds, WORLDS } from '../lib/recommender.js'

const router = Router()

/**
 * POST /api/mood/generate
 * 1. Gemini → world matching + spotifyQuery
 * 2. Spotify search (filters to tracks WITH preview_url)
 * 3. iTunes fallback if Spotify returns 0 previews (very common since late 2024)
 * 4. Static songs.json fallback if both APIs fail
 */
router.post('/generate', async (req, res) => {
  const { prompt, playlistSize = 6 } = req.body
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' })
  if (prompt.length > 500) return res.status(400).json({ error: 'prompt too long' })

  try {
    // ── Step 1: World matching ───────────────────────────────────────────────
    let world, customTitle, customTagline, spotifyQuery, energyLevel, focusLevel, calmLevel

    const geminiResult = await analyzeMoodWithGemini(prompt.trim())

    if (geminiResult) {
      ;({ world, customTitle, customTagline, spotifyQuery, energyLevel, focusLevel, calmLevel } = geminiResult)
      console.log(`[Gemini] "${prompt}" → ${world.id} (${customTitle})`)
    } else {
      const fallback = generateMood(prompt.trim(), playlistSize)
      world         = fallback.world
      customTitle   = world.name
      customTagline = world.tagline
      spotifyQuery  = buildSpotifyQuery(world)
      energyLevel   = world.energyLevel
      focusLevel    = world.focusLevel
      calmLevel     = world.calmLevel
      console.log(`[Keyword] "${prompt}" → ${world.id}`)
    }

    // ── Step 2: Playlist (Spotify → iTunes → static) ─────────────────────────
    let playlist    = null
    let audioSource = 'static'

    // Try Spotify first
    const spotifyTracks = await searchTracks(spotifyQuery, playlistSize)
    if (spotifyTracks && spotifyTracks.length > 0) {
      playlist    = spotifyTracks
      audioSource = 'spotify'
      console.log(`[Spotify] ✅ ${playlist.length} tracks with previews for "${spotifyQuery}"`)
    }

    // Spotify returned nothing with previews → try iTunes
    if (!playlist) {
      const itunesQuery  = buildItunesQuery(world, spotifyQuery)
      const itunesTracks = await searchItunesTracks(itunesQuery, playlistSize)
      if (itunesTracks && itunesTracks.length > 0) {
        playlist    = itunesTracks
        audioSource = 'itunes'
        console.log(`[iTunes] ✅ ${playlist.length} tracks with previews for "${itunesQuery}"`)
      }
    }

    // Both APIs failed → static fallback (no audio but still shows track names)
    if (!playlist) {
      playlist    = generateMood(prompt.trim(), playlistSize).playlist
      audioSource = 'static'
      console.log('[Fallback] Using static songs.json (no previews)')
    }

    // ── Step 3: Quote ────────────────────────────────────────────────────────
    const { quote } = generateMood(prompt.trim(), 1)

    return res.json({
      id:          uuid(),
      title:       customTitle,
      tagline:     customTagline,
      userPrompt:  prompt.trim(),
      worldId:     world.id,
      world,
      playlist,
      quote,
      energyLevel,
      focusLevel,
      calmLevel,
      matchScore:  geminiResult ? 0.95 : 0.5,
      usedGemini:  !!geminiResult,
      usedSpotify: audioSource === 'spotify',
      usedItunes:  audioSource === 'itunes',
      audioSource,
      createdAt:   Date.now(),
    })
  } catch (err) {
    console.error('[/mood/generate]', err)
    return res.status(500).json({ error: 'Mood generation failed' })
  }
})

router.get('/worlds', (_req, res) => {
  res.json(WORLDS.map(w => ({
    id: w.id, name: w.name, tagline: w.tagline, palette: w.palette,
    energyLevel: w.energyLevel, focusLevel: w.focusLevel, calmLevel: w.calmLevel,
    primaryGenre: w.primaryGenre, emotionTags: w.emotionTags, gardenPlant: w.gardenPlant,
  })))
})

router.get('/worlds/:id', (req, res) => {
  const world = WORLDS.find(w => w.id === req.params.id)
  if (!world) return res.status(404).json({ error: 'World not found' })
  res.json({ world, related: relatedWorlds(req.params.id, 4) })
})

router.get('/explore', (req, res) => {
  const { genre, energy } = req.query
  let results = [...WORLDS]
  if (genre)           results = results.filter(w => w.primaryGenre === genre || w.secondaryGenre === genre)
  if (energy === 'low')    results = results.filter(w => w.energyLevel <= 2)
  if (energy === 'medium') results = results.filter(w => w.energyLevel === 3)
  if (energy === 'high')   results = results.filter(w => w.energyLevel >= 4)
  res.json(results)
})

export default router
