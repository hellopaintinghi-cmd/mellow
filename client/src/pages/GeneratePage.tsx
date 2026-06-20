import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Shuffle } from 'lucide-react'
import { useMellowStore } from '@/store/mellowStore'
import { usePlayerStore, toPlayerTrack } from '@/components/player/MusicPlayer'
import type { MoodCard } from '@/types'
import { v4 as uuid } from 'uuid'
import { sleep } from '@/lib/utils'
import api from '@/lib/api'
import { generateMood } from '@/lib/recommender'

const PROMPTS = [
  'Kyoto café during winter, snow falling outside',
  'Midnight coding while it rains',
  'Main character walking through Tokyo at night',
  'Reading a book on a train crossing snowy mountains',
  'Soft girl Sunday morning with pancakes',
  'Locked-in exam prep mode, deadline tomorrow',
  'Campfire stargazing with old friends',
  'Autumn forest walk with crunchy leaves',
  'Rainy day bookstore afternoon',
  'Cherry blossom stroll, petals falling slow',
  'Late night ramen shop, steam on the glass',
  'Lavender fields, no plans, no rush',
  '12 am sadness, missing someone',
  'Ocean sunset, waves doing their thing',
  'Cozy library, tall shelves, good silence',
]

const LOADING_MESSAGES = [
  'Reading the feeling…',
  'Finding your world…',
  'Curating the playlist…',
  'Setting the scene…',
  'Almost there…',
]

function LoadingScreen({ prompt }: { prompt: string }) {
  const [msgIdx, setMsgIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 800)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
    >
      <motion.div
        animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="text-5xl"
      >🎐</motion.div>
      <div className="text-center">
        <p className="font-body text-warm-400 text-sm mb-1 italic">"{prompt}"</p>
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-xl text-warm-500"
        >{LOADING_MESSAGES[msgIdx]}</motion.p>
      </div>
      <div className="loading-dots flex gap-2">
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-lavender-300 inline-block" />
        ))}
      </div>
    </motion.div>
  )
}

export default function GeneratePage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const [input, setInput]     = useState(params.get('q') ?? '')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const setCurrentCard = useMellowStore(s => s.setCurrentCard)
  const setPlaylist    = usePlayerStore(s => s.setPlaylist)

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus()
    const q = params.get('q')
    if (q) { setInput(q); handleGenerate(q) }
  }, []) // eslint-disable-line

  const handleGenerate = async (overrideInput?: string) => {
    const prompt = (overrideInput ?? input).trim()
    if (!prompt || loading) return
    setLoading(true)

    try {
      // Try API first (uses Gemini + Spotify if keys are set)
      const { data } = await api.post('/mood/generate', { prompt, playlistSize: 8 })

      const card: MoodCard = {
        id:          data.id ?? uuid(),
        title:       data.title,
        tagline:     data.tagline,
        userPrompt:  prompt,
        worldId:     data.worldId,
        world:       data.world,
        playlist:    data.playlist,
        quote:       data.quote,
        energyLevel: data.energyLevel,
        focusLevel:  data.focusLevel,
        calmLevel:   data.calmLevel,
        matchScore:  data.matchScore,
        createdAt:   data.createdAt ?? Date.now(),
      }

      setCurrentCard(card)
      // Load the playlist into the global player
      setPlaylist(data.playlist.map(toPlayerTrack), 0)
      navigate(`/mood/${data.worldId}?cardId=${card.id}`)
    } catch (err) {
      // API unavailable — fall back to client-side recommender
      console.warn('[GeneratePage] API unavailable, using local recommender', err)
      await sleep(2200)
      const result = generateMood(prompt)
      const card: MoodCard = {
        id: uuid(), title: result.world.name, tagline: result.world.tagline,
        userPrompt: prompt, worldId: result.world.id, world: result.world,
        playlist: result.playlist, quote: result.quote,
        energyLevel: result.world.energyLevel, focusLevel: result.world.focusLevel,
        calmLevel: result.world.calmLevel, matchScore: result.matchScore,
        createdAt: Date.now(),
      }
      setCurrentCard(card)
      setPlaylist(result.playlist.map(toPlayerTrack), 0)
      navigate(`/mood/${result.world.id}?cardId=${card.id}`)
    } finally {
      setLoading(false)
    }
  }

  const shuffle = () => {
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    setInput(p)
    textareaRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-200 flex flex-col">
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen key="loading" prompt={input} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 px-6 py-16 gap-10"
          >
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-5xl mb-4">🎐</motion.div>
              <h1
  className="pixel-heading pixel-shadow text-xl md:text-2xl text-warm-500 pixel-cursor"
>What do you feel like?</h1>
              <p className="mt-3 text-warm-300 font-body">
                Type a mood, a place, a vibe — anything. Gemini understands it.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-deep p-6"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
                placeholder="e.g. 12 am sadness, missing someone far away…"
                rows={3}
                className="w-full resize-none font-body text-lg text-warm-500 placeholder-warm-200 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-200">
                <button
                  onClick={shuffle}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cream-100 text-warm-300 text-sm font-body hover:bg-cream-200 transition-colors"
                >
                  <Shuffle size={14} /> Surprise me
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-200 font-body hidden sm:block">⌘↵ to generate</span>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => handleGenerate()}
                    disabled={!input.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-lavender-300 to-dusty-300 text-white font-body font-semibold disabled:opacity-40 shadow-soft hover:shadow-glow transition-shadow"
                  >
                    <Wand2 size={16} /> Generate
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="w-full max-w-2xl"
            >
              <p className="text-xs text-warm-200 font-body mb-3 text-center">Or try one of these</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {PROMPTS.slice(0, 9).map(p => (
                  <button key={p} onClick={() => { setInput(p); handleGenerate(p) }}
                    className="px-4 py-2 rounded-full bg-white border border-cream-200 text-warm-400 text-sm font-body hover:border-lavender-300 hover:text-lavender-500 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
