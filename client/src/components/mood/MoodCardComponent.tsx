import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Sparkles } from 'lucide-react'
import type { MoodCard } from '@/types'
import { useMellowStore, useProfile } from '@/store/mellowStore'
import { energyLabel, energyColor, cn } from '@/lib/utils'
import PixelWorld from '@/components/world/PixelWorld'

interface Props {
  card: MoodCard
  compact?: boolean
  onClick?: () => void
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-xs font-medium" style={{ color }}>{label}</span>
        <span className="font-body text-xs text-warm-300">{energyLabel(value)}</span>
      </div>
      <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 5) * 100}%` }}
          transition={{ duration: 1, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </div>
  )
}

export default function MoodCardComponent({ card, compact = false, onClick }: Props) {
  const { saveCard, removeCard } = useMellowStore()
  const profile = useProfile()
  const isSaved = profile.savedCards.includes(card.id)

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    isSaved ? removeCard(card.id) : saveCard(card)
  }

  const { world } = card

  return (
    <motion.div
      layout
      whileHover={compact ? { scale: 1.03, y: -4 } : {}}
      onClick={onClick}
      className={cn(
        'relative rounded-3xl overflow-hidden shadow-card bg-white cursor-pointer group',
        compact ? 'card-hover' : ''
      )}
      style={{ '--world-bg': world.palette.bg } as React.CSSProperties}
    >
      {/* Gradient header band */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${world.palette.bg}, ${world.palette.secondary})`,
          padding: compact ? '16px 16px 0' : '20px 20px 0',
        }}
      >
        {/* Match score badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
          <Sparkles size={10} className="text-white/80" />
          <span className="text-white/80 text-[10px] font-body font-medium">
            {Math.round(card.matchScore * 100)}% match
          </span>
        </div>

        {/* Pixel world scene */}
        <div className={cn('flex justify-center', compact ? 'mb-2' : 'mb-3')}>
          <PixelWorld
            world={world}
            className={compact ? 'w-full max-w-[220px]' : 'w-full max-w-[280px]'}
          />
        </div>
      </div>

      {/* Card body */}
      <div className={cn('p-4', compact ? 'p-3' : 'p-5')}>
        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-bold text-warm-500 leading-loose truncate', compact ? 'text-[9px]' : 'text-[11px]')} style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {card.title}
            </h3>
            {!compact && (
              <p className="text-warm-300 text-sm font-body mt-0.5 line-clamp-2">{card.tagline}</p>
            )}
          </div>
          <button
            onClick={toggleSave}
            className="shrink-0 p-1.5 rounded-full hover:bg-cream-100 transition-colors"
            title={isSaved ? 'Remove from collection' : 'Save card'}
          >
            {isSaved
              ? <BookmarkCheck size={16} className="text-lavender-400" />
              : <Bookmark     size={16} className="text-warm-300" />
            }
          </button>
        </div>

        {/* Quote */}
        {!compact && (
          <blockquote className="mt-3 mb-4 pl-3 border-l-2 border-lavender-200 text-warm-300 text-xs font-body italic leading-relaxed">
            "{card.quote}"
          </blockquote>
        )}

        {/* Stat bars */}
        {!compact && (
          <div className="space-y-2 mb-4">
            <StatBar label="Energy"  value={card.energyLevel} color={energyColor(card.energyLevel)} />
            <StatBar label="Focus"   value={card.focusLevel}  color="#7FAE7A" />
            <StatBar label="Calmness"value={card.calmLevel}   color="#7C9CC8" />
          </div>
        )}

        {/* Genre tags */}
        <div className="flex flex-wrap gap-1.5">
          {[world.primaryGenre, world.secondaryGenre].map(g => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-full text-[11px] font-body font-medium"
              style={{ background: world.palette.primary + '22', color: world.palette.primary }}
            >
              {g}
            </span>
          ))}
          {!compact && world.ambientSounds.slice(0, 2).map(a => (
            <span key={a} className="px-2 py-0.5 rounded-full text-[11px] font-body bg-cream-100 text-warm-300">
              {a}
            </span>
          ))}
        </div>

        {/* Playlist preview (full card only) */}
        {!compact && card.playlist.length > 0 && (
          <div className="mt-4 pt-4 border-t border-cream-200">
            <p className="text-xs text-warm-300 font-body font-medium mb-2">Playlist</p>
            <div className="space-y-1.5">
              {card.playlist.slice(0, 4).map((song, i) => (
                <div key={song.id} className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-body font-medium shrink-0"
                    style={{ background: world.palette.primary }}
                  >{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-warm-500 text-xs font-body font-medium truncate">{song.title}</p>
                    <p className="text-warm-300 text-[11px] font-body truncate">{song.artist}</p>
                  </div>
                  <span className="text-warm-200 text-[11px] font-body shrink-0">
                    {Math.floor(song.durationSec / 60)}:{String(song.durationSec % 60).padStart(2,'0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
