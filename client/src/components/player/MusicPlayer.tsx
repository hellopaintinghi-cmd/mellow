import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, ExternalLink, ChevronDown, ChevronUp, Music, Loader2, AlertCircle
} from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import { useRepairedTrack } from '@/hooks/useRepairedTrack'
import { forceRepair } from '@/lib/previewCache'

// ── Player Store ──────────────────────────────────────────────────────────────
export interface PlayerTrack {
  id: string
  title: string
  artist: string
  albumArt?: string | null
  previewUrl?: string | null
  spotifyUrl?: string | null
  durationSec: number
  genre: string
}

interface PlayerState {
  playlist:    PlayerTrack[]
  currentIdx:  number
  isPlaying:   boolean
  volume:      number
  muted:       boolean
  visible:     boolean
  setPlaylist: (tracks: PlayerTrack[], startIdx?: number) => void
  play:        (idx?: number) => void
  pause:       () => void
  toggle:      () => void
  next:        () => void
  prev:        () => void
  setVolume:   (v: number) => void
  toggleMute:  () => void
  hide:        () => void
  show:        () => void
  updateTrack: (id: string, patch: Partial<PlayerTrack>) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playlist:   [],
  currentIdx: 0,
  isPlaying:  false,
  volume:     0.7,
  muted:      false,
  visible:    false,

  setPlaylist: (tracks, startIdx = 0) => {
    set({ playlist: tracks, currentIdx: startIdx, visible: tracks.length > 0 })
  },
  play:       (idx) => set(s => ({ isPlaying: true, currentIdx: idx ?? s.currentIdx })),
  pause:      ()    => set({ isPlaying: false }),
  toggle:     ()    => set(s => ({ isPlaying: !s.isPlaying })),
  next:       ()    => set(s => s.playlist.length > 0
    ? { currentIdx: (s.currentIdx + 1) % s.playlist.length, isPlaying: true }
    : {}),
  prev:       ()    => set(s => s.playlist.length > 0
    ? { currentIdx: (s.currentIdx - 1 + s.playlist.length) % s.playlist.length, isPlaying: true }
    : {}),
  setVolume:  (v)   => set({ volume: v, muted: v === 0 }),
  toggleMute: ()    => set(s => ({ muted: !s.muted })),
  hide:       ()    => set({ visible: false, isPlaying: false }),
  show:       ()    => set({ visible: true }),
  updateTrack: (id, patch) => set(s => ({
    playlist: s.playlist.map(t => t.id === id ? { ...t, ...patch } : t),
  })),
}))

// ── Helper to convert any song/track shape → PlayerTrack ─────────────────────
export function toPlayerTrack(t: any): PlayerTrack {
  return {
    id:         t.id,
    title:      t.title,
    artist:     t.artist,
    albumArt:   t.albumArt ?? null,
    previewUrl: t.previewUrl ?? null,
    spotifyUrl: t.spotifyUrl ?? null,
    durationSec:t.durationSec ?? 30,
    genre:      t.genre ?? '',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MusicPlayer() {
  const {
    playlist, currentIdx, isPlaying, volume, muted,
    visible, toggle, next, prev, setVolume, toggleMute, play, hide, updateTrack,
  } = usePlayerStore()

  const audioRef     = useRef<HTMLAudioElement>(null)
  const [progress,   setProgress]   = useState(0)      // 0–1
  const [duration,   setDuration]   = useState(30)
  const [currentSec, setCurrentSec] = useState(0)
  const [expanded,   setExpanded]   = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)       // bump to force a fresh repair lookup
  const [skipTimer,  setSkipTimer]  = useState<number | null>(null)

  const track = playlist[currentIdx] ?? null

  // Self-healing preview lookup — if track.previewUrl is missing, this
  // automatically searches iTunes in the background and returns the result
  // the moment it resolves.
  const repaired = useRepairedTrack(
    track?.title ?? '', track?.artist ?? '', track?.previewUrl, undefined
  )
  const effectiveUrl = repaired.previewUrl

  // Once a repair succeeds, push it back into the playlist so the UI
  // (album art, "preview" badge) stays in sync everywhere.
  useEffect(() => {
    if (track && repaired.status === 'found' && repaired.previewUrl && !track.previewUrl) {
      updateTrack(track.id, {
        previewUrl: repaired.previewUrl,
        albumArt:   track.albumArt ?? repaired.albumArt,
      })
    }
  }, [repaired.status, repaired.previewUrl]) // eslint-disable-line

  // Clear any pending auto-skip timer when the track changes
  useEffect(() => {
    if (skipTimer) { window.clearTimeout(skipTimer); setSkipTimer(null) }
    setProgress(0)
    setCurrentSec(0)
  }, [track?.id]) // eslint-disable-line

  // ── Wire the <audio> element to whatever URL we currently trust ──────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (effectiveUrl) {
      if (audio.src !== effectiveUrl) audio.src = effectiveUrl
      if (isPlaying) audio.play().catch(() => { /* autoplay block — user can hit play */ })
    } else {
      audio.removeAttribute('src')
      audio.load()
    }
  }, [effectiveUrl]) // eslint-disable-line

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !effectiveUrl) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying, effectiveUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  // If a track is genuinely unavailable (repair already tried and failed),
  // don't leave the player looking "stuck" — auto-advance after a short pause
  // so the user sees what happened instead of silence forever.
  useEffect(() => {
    if (!track) return
    if (repaired.status === 'missing' && isPlaying) {
      const t = window.setTimeout(() => next(), 1400)
      setSkipTimer(t)
      return () => window.clearTimeout(t)
    }
  }, [repaired.status, isPlaying]) // eslint-disable-line

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentSec(audio.currentTime)
    setProgress(audio.currentTime / audio.duration)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }, [])

  const handleEnded = useCallback(() => next(), [next])

  // The actual fix for "looks playing but isn't": real <audio> errors are now
  // caught. We try one fresh repair (in case the URL went stale), and if that
  // also fails, we auto-skip instead of sitting in a fake "playing" state.
  const handleError = useCallback(() => {
    if (!track) return
    forceRepair(track.title, track.artist).then(result => {
      if (result.status === 'found' && result.previewUrl) {
        updateTrack(track.id, { previewUrl: result.previewUrl })
        setRetryNonce(n => n + 1)
      } else {
        const t = window.setTimeout(() => next(), 1200)
        setSkipTimer(t)
      }
    })
  }, [track]) // eslint-disable-line

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
    setProgress(ratio)
  }

  if (!visible || !track) return null

  const isLoading   = repaired.status === 'loading'
  const isMissing   = repaired.status === 'missing'
  const isPlayable  = !!effectiveUrl && !isMissing

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload="auto"
      />

      <AnimatePresence>
        <motion.div
          key="player"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-[640px] md:rounded-2xl overflow-hidden shadow-deep"
          style={{ background: 'rgba(30,26,46,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-white/10 cursor-pointer" onClick={seek}>
            <motion.div
              className="h-full bg-gradient-to-r from-lavender-300 to-dusty-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Main row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
              {track.albumArt
                ? <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                : <Music size={16} className="text-white/40" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/90 font-body font-semibold text-sm truncate">{track.title}</p>
              <p className="text-white/45 font-body text-xs truncate">{track.artist}</p>
              {isLoading && (
                <p className="text-white/35 text-[10px] font-body flex items-center gap-1">
                  <Loader2 size={9} className="animate-spin" /> finding a playable version…
                </p>
              )}
              {isMissing && (
                <p className="text-amber-400/80 text-[10px] font-body flex items-center gap-1">
                  <AlertCircle size={9} /> unavailable — skipping…
                </p>
              )}
            </div>

            <span className="text-white/35 text-xs font-body shrink-0 hidden sm:block">
              {formatDuration(Math.floor(currentSec))} / {formatDuration(Math.floor(duration))}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <PlayerBtn onClick={prev}><SkipBack size={16}/></PlayerBtn>

              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={toggle}
                disabled={!isPlayable}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-lavender-300 to-dusty-300 flex items-center justify-center text-white disabled:opacity-40"
              >
                {isLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : isPlaying ? <Pause size={16}/> : <Play size={16} className="ml-0.5"/>
                }
              </motion.button>

              <PlayerBtn onClick={next}><SkipForward size={16}/></PlayerBtn>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button onClick={toggleMute} className="text-white/45 hover:text-white/80 transition-colors">
                {muted || volume === 0 ? <VolumeX size={15}/> : <Volume2 size={15}/>}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 appearance-none rounded-full cursor-pointer accent-lavender-400"
                style={{ background: `linear-gradient(to right, #C9A0DC ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(muted ? 0 : volume) * 100}%)` }}
              />
            </div>

            {track.spotifyUrl && (
              <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer"
                className="text-white/35 hover:text-[#1DB954] transition-colors shrink-0" title="Open in Spotify">
                <ExternalLink size={15}/>
              </a>
            )}

            <button onClick={() => setExpanded(v => !v)} className="text-white/35 hover:text-white/60 transition-colors shrink-0">
              {expanded ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
            </button>

            <button onClick={hide} className="text-white/25 hover:text-white/50 transition-colors text-xs font-body shrink-0 ml-1" title="Close player">✕</button>
          </div>

          {/* Expanded playlist */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10"
              >
                <div className="max-h-64 overflow-y-auto py-2">
                  {playlist.map((t, i) => (
                    <motion.button
                      key={t.id}
                      onClick={() => play(i)}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        i === currentIdx ? 'bg-white/10' : ''
                      )}
                    >
                      <div className="w-5 shrink-0 text-center">
                        {i === currentIdx && isPlaying
                          ? <span className="text-lavender-300 text-xs">♪</span>
                          : <span className="text-white/25 text-xs">{i + 1}</span>
                        }
                      </div>

                      {t.albumArt
                        ? <img src={t.albumArt} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                        : <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center">
                            <Music size={12} className="text-white/30" />
                          </div>
                      }

                      <div className="flex-1 min-w-0">
                        <p className={cn('font-body text-sm truncate', i === currentIdx ? 'text-white' : 'text-white/70')}>{t.title}</p>
                        <p className="text-white/35 text-xs truncate font-body">{t.artist}</p>
                      </div>

                      {!t.previewUrl && (
                        <span className="text-amber-400/50 text-[10px] font-body shrink-0">checking…</span>
                      )}

                      <span className="text-white/25 text-xs font-body shrink-0">{formatDuration(t.durationSec)}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function PlayerBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors rounded-full hover:bg-white/10"
    >
      {children}
    </motion.button>
  )
}
