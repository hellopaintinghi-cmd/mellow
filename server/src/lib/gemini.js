import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORLDS = JSON.parse(readFileSync(path.resolve(__dirname, '../../../data/moodWorlds.json'), 'utf8'))

let genAI = null

function getClient() {
  if (!process.env.GEMINI_API_KEY) return null
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return genAI
}

// Concise world descriptions for the prompt — keep token count low
const WORLD_SUMMARY = WORLDS.map(w =>
  `${w.id} | ${w.name} | emotions: ${w.emotionTags.join(',')} | activity: ${w.activityTags.join(',')} | setting: ${w.settingTags.join(',')} | weather: ${w.weatherTags.join(',')} | energy:${w.energyLevel}/5`
).join('\n')

const SYSTEM_PROMPT = `You are the mood engine for Mellow, an aesthetic music platform.
Given a user's mood description, you map it to the most emotionally fitting world.

Available worlds (id | name | emotions | activity | setting | weather | energy):
${WORLD_SUMMARY}

Rules:
- Prioritise EMOTIONAL resonance over surface keywords. "12 am sadness" → loneliness, late night, quiet → pick a night/introspective world, NOT a daytime/energetic one.
- "midnight", "3am", "late night", "can't sleep" → night worlds (midnight-coding, tokyo-neon-night, jazz-bar-midnight, thunderstorm-window, late-night-ramen)
- "sad", "lonely", "heartbreak", "missing someone" → calm/introspective worlds with low energy
- "study", "exam", "focus" → locked-in-exam or cozy-library
- "rain" without sadness → rainy-bookstore or thunderstorm-window
- Never pick a high-energy world (energy 4-5) for sad/tired/quiet moods
- The spotifyQuery should be 3-6 words that a DJ would use to find matching tracks on Spotify

Respond ONLY with minified JSON (no markdown, no explanation):
{"worldId":"<id>","customTitle":"<evocative 3-5 word title>","customTagline":"<one poetic sentence max 12 words>","spotifyQuery":"<3-6 word Spotify search>","energyLevel":<1-5>,"focusLevel":<1-5>,"calmLevel":<1-5>}`

export async function analyzeMoodWithGemini(userPrompt) {
  const client = getClient()
  if (!client) return null   // caller falls back to keyword engine

  try {
    const model  = client.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(
      SYSTEM_PROMPT + '\n\nUser mood: "' + userPrompt + '"'
    )
    const text = result.response.text().trim()

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Validate worldId exists
    const world = WORLDS.find(w => w.id === parsed.worldId)
    if (!world) {
      console.warn('[Gemini] Returned unknown worldId:', parsed.worldId, '— falling back')
      return null
    }

    return {
      world,
      customTitle:   parsed.customTitle   || world.name,
      customTagline: parsed.customTagline || world.tagline,
      spotifyQuery:  parsed.spotifyQuery  || `${world.primaryGenre} ${world.emotionTags[0]}`,
      energyLevel:   parsed.energyLevel   || world.energyLevel,
      focusLevel:    parsed.focusLevel    || world.focusLevel,
      calmLevel:     parsed.calmLevel     || world.calmLevel,
    }
  } catch (err) {
    console.error('[Gemini] Analysis failed:', err.message)
    return null
  }
}
