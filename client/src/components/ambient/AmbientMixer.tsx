import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react'
import type { AmbientSound, MoodWorld } from '@/types'
import { AMBIENT_META } from '@/types'
import { useMellowStore } from '@/store/mellowStore'
import { ambientEngine } from '@/lib/ambientSynth'

const DEFAULT_VOL = 0.28

interface Props { world: MoodWorld }

export default function AmbientMixer({ world }: Props) {
  const [open, setOpen]         = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const { ambientActive, ambientVolumes, toggleAmbient, setAmbientVolume } = useMellowStore()

  const sounds = world.ambientSounds as AmbientSound[]

  // ── Unlock on first user gesture (required by browser autoplay policy) ────
  useEffect(() => {
    const unlock = () => {
      if (unlocked) return
      ambientEngine.unlock()
      setUnlocked(true)
      // Auto-start ambient the moment audio is unlocked
      useMellowStore.setState({ ambientActive: true })
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [unlocked])

  // ── Start/stop sounds for this world when active state or world changes ──
  useEffect(() => {
    if (!unlocked) return
    if (ambientActive) {
      sounds.forEach(sound => ambientEngine.start(sound, ambientVolumes[sound] ?? DEFAULT_VOL))
      // Stop any sounds left over from a previous world that aren't in this one
      ambientEngine.activeSounds().forEach(s => {
        if (!sounds.includes(s)) ambientEngine.stop(s)
      })
    } else {
      ambientEngine.stopAll()
    }
  }, [ambientActive, unlocked, world.id]) // eslint-disable-line

  // ── Live volume updates from sliders ───────────────────────────────────────
  useEffect(() => {
    sounds.forEach(sound => {
      if (ambientEngine.isPlaying(sound)) {
        ambientEngine.setVolume(sound, ambientVolumes[sound] ?? DEFAULT_VOL)
      }
    })
  }, [ambientVolumes]) // eslint-disable-line

  // ── Cleanup on unmount (leaving the mood page entirely) ────────────────────
  useEffect(() => () => { ambientEngine.stopAll() }, [])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!unlocked) {
      ambientEngine.unlock()
      setUnlocked(true)
      toggleAmbient()
      return
    }
    toggleAmbient()
  }, [toggleAmbient, unlocked])

  const reallyPlaying = unlocked && ambientActive && sounds.some(s => ambientEngine.isPlaying(s))

  return (
    <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎧</span>
          <div className="text-left">
            <p className="font-body font-semibold text-warm-500 text-sm">Ambient Sounds</p>
            <p className="font-body text-xs">
              {!unlocked
                ? <span className="text-warm-200">tap to start — synthesized live, no files needed</span>
                : reallyPlaying
                  ? <span className="text-lavender-400">▶ playing — {sounds.filter(s => ambientEngine.isPlaying(s)).length} layers</span>
                  : <span className="text-warm-300">paused</span>
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`p-2 rounded-full transition-colors ${
              reallyPlaying ? 'bg-lavender-100 text-lavender-500' : 'bg-cream-100 text-warm-300'
            }`}
            title={ambientActive ? 'Pause ambient' : 'Play ambient'}
          >
            {reallyPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {open ? <ChevronUp size={16} className="text-warm-300" /> : <ChevronDown size={16} className="text-warm-300" />}
        </div>
      </button>

      {/* Sliders */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-cream-200 pt-4">
              {sounds.map(sound => {
                const meta = AMBIENT_META[sound]
                const vol  = ambientVolumes[sound] ?? DEFAULT_VOL
                const live = unlocked && ambientActive && ambientEngine.isPlaying(sound)
                return (
                  <div key={sound} className="flex items-center gap-3">
                    <span className="text-lg w-7 relative">
                      {meta?.emoji ?? '🔊'}
                      {live && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sage-400 animate-pulse-soft" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-xs text-warm-400">{meta?.label ?? sound}</span>
                        <span className="font-body text-xs text-warm-300">{Math.round(vol * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0} max={1} step={0.05}
                        value={vol}
                        onChange={e => setAmbientVolume(sound, parseFloat(e.target.value))}
                        className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-lavender-400"
                        style={{ background: `linear-gradient(to right, #C9A0DC ${vol*100}%, #E0CDB5 ${vol*100}%)` }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="text-[11px] text-warm-200 font-body text-center pt-1">
                🔊 Generated live in your browser — no audio files, never breaks
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
