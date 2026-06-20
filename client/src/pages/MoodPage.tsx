import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Wand2, Bookmark, BookmarkCheck, Play } from 'lucide-react'
import { useMellowStore, useProfile } from '@/store/mellowStore'
import PixelWorld from '@/components/world/PixelWorld'
import AmbientMixer from '@/components/ambient/AmbientMixer'
import { energyLabel, energyColor, cn } from '@/lib/utils'
import { relatedWorlds } from '@/lib/recommender'
import ParticleField from '@/components/mood/ParticleField'
import { usePlayerStore, toPlayerTrack } from '@/components/player/MusicPlayer'
import PlaylistRow from '@/components/mood/PlaylistRow'

function StatDot({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 400, damping: 20 }}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: i <= value ? color : '#E0CDB5' }} />
      ))}
    </div>
  )
}

export default function MoodPage() {
  const { worldId }  = useParams()
  const [search]     = useSearchParams()
  const navigate     = useNavigate()
  const cardId       = search.get('cardId')
  const { cards, saveCard, removeCard, currentCard } = useMellowStore()
  const profile      = useProfile()
  const { setPlaylist, play: playerPlay, isPlaying, currentIdx, playlist: playerPlaylist } = usePlayerStore()

  const card = currentCard?.id === cardId ? currentCard : cards.find(c => c.id === cardId) ?? currentCard

  useEffect(() => { if (!card) navigate('/generate', { replace: true }) }, [card, navigate])
  if (!card) return null

  const { world, playlist, quote } = card
  const isSaved  = profile.savedCards.includes(card.id)
  const related  = relatedWorlds(world.id, 3)

  // Check if this card's playlist is already loaded in the player
  const isThisCardInPlayer = playerPlaylist.length > 0 && playerPlaylist[0]?.id === playlist[0]?.id

  const handlePlayAll = () => {
    const tracks = playlist.map(toPlayerTrack)
    setPlaylist(tracks, 0)
    playerPlay(0)
  }

  const handlePlayTrack = (idx: number) => {
    if (!isThisCardInPlayer) {
      setPlaylist(playlist.map(toPlayerTrack), idx)
    }
    playerPlay(idx)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen"
      style={{ background: `linear-gradient(160deg, ${world.palette.bg}33, #FAF7F2 40%)` }}>

      {/* Top bar */}
      <div className="sticky top-0 z-20 glass border-b border-white/40 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/generate')}
          className="flex items-center gap-2 text-warm-400 hover:text-warm-500 font-body text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => isSaved ? removeCard(card.id) : saveCard(card)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm transition-all',
              isSaved ? 'bg-lavender-100 text-lavender-500' : 'bg-white text-warm-400 hover:bg-cream-100')}>
            {isSaved ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>}
            {isSaved ? 'Saved' : 'Save card'}
          </button>
          <button onClick={handlePlayAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-lavender-300 to-dusty-300 text-white font-body text-sm">
            <Play size={15} className="ml-0.5" /> Play all
          </button>
          <button onClick={() => navigate('/generate')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-warm-400 border border-cream-200 font-body text-sm">
            <Wand2 size={15}/> New mood
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 pb-32">
        {/* Hero row */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Pixel world */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden shadow-deep"
            style={{ background: `linear-gradient(135deg, ${world.palette.bg}, ${world.palette.secondary})` }}>
            <ParticleField count={20} dark />
            <div className="relative z-10 p-6 flex flex-col items-center">
              <PixelWorld world={world} className="w-full max-w-sm" />
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {world.ambientSounds.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-white/15 text-white/75 text-xs font-body backdrop-blur-sm">
                    🎵 {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col gap-5">
            <div>
              <p className="text-warm-300 font-body text-sm mb-1 italic">"{card.userPrompt}"</p>
              <h1 className="pixel-heading pixel-shadow text-sm md:text-base text-warm-500">{card.title}</h1>
              <p className="text-warm-300 font-body mt-1">{card.tagline}</p>
            </div>

            <blockquote className="rounded-2xl p-4 border-l-4 font-body text-warm-400 italic text-sm leading-relaxed"
              style={{ borderColor: world.palette.primary, background: world.palette.primary + '15' }}>
              "{quote}"
            </blockquote>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Energy',   value: card.energyLevel, color: energyColor(card.energyLevel) },
                { label: 'Focus',    value: card.focusLevel,  color: '#7FAE7A' },
                { label: 'Calmness', value: card.calmLevel,   color: '#7C9CC8' },
              ].map(({ label, value, color }) => (
                <motion.div key={label} whileHover={{ scale: 1.03 }}
                  className="rounded-2xl p-3 bg-white shadow-soft text-center">
                  <p className="font-body text-xs text-warm-300 mb-1">{label}</p>
                  <p className="font-display text-xl font-bold mb-1.5" style={{ color }}>{energyLabel(value)}</p>
                  <StatDot value={value} color={color} />
                </motion.div>
              ))}
            </div>

            {/* Palette swatches */}
            <div className="flex items-center gap-2">
              <span className="text-warm-300 font-body text-xs">Palette</span>
              {Object.values(world.palette).map((hex, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white shadow-soft cursor-pointer hover:scale-110 transition-transform"
                  style={{ background: hex }} title={hex} />
              ))}
            </div>

            <AmbientMixer world={world} />
          </motion.div>
        </div>

        {/* Playlist */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl shadow-soft mb-6 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-cream-200">
            <span className="text-xl">🎵</span>
            <h2 className="text-xs font-bold text-warm-500 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>♪ Playlist</h2>
            <span className="text-warm-200 text-sm font-body">{playlist.length} tracks</span>
            <button onClick={handlePlayAll}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-lavender-100 text-lavender-500 text-sm font-body hover:bg-lavender-200 transition-colors">
              <Play size={13} className="ml-0.5" /> Play all
            </button>
          </div>
          <div className="divide-y divide-cream-100">
            {playlist.map((song: any, i: number) => {
              const isCurrentTrack = isThisCardInPlayer && playerPlaylist[currentIdx]?.id === song.id
              return (
                <PlaylistRow
                  key={song.id}
                  song={song}
                  index={i}
                  delay={0.3 + i * 0.05}
                  isCurrentTrack={isCurrentTrack}
                  primaryColor={world.palette.primary}
                  onPlay={() => handlePlayTrack(i)}
                />
              )
            })}
          </div>
        </motion.div>

        {/* Related worlds */}
        <div>
          <h2 className="text-xs font-bold text-warm-500 mb-4 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>✦ You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(w => (
              <motion.button key={w.id} whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/generate?q=${encodeURIComponent(w.name)}`)}
                className="rounded-2xl p-4 text-left shadow-soft hover:shadow-card transition-all overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${w.palette.bg}, ${w.palette.secondary})` }}>
                <p className="font-display font-bold text-sm mb-1" style={{ color: w.palette.text }}>{w.name}</p>
                <p className="font-body text-xs opacity-75 line-clamp-2" style={{ color: w.palette.text }}>{w.tagline}</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {w.emotionTags.slice(0, 2).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-body bg-white/20 text-white/75">{t}</span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
