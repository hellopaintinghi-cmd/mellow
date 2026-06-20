import { motion } from 'framer-motion'
import { ExternalLink, Loader2 } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import { useRepairedTrack } from '@/hooks/useRepairedTrack'

interface Props {
  song: any
  index: number
  delay: number
  isCurrentTrack: boolean
  primaryColor: string
  onPlay: () => void
}

export default function PlaylistRow({ song, index, delay, isCurrentTrack, primaryColor, onPlay }: Props) {
  // Live repair status — if song.previewUrl is missing, this triggers a
  // background lookup and updates the badge the moment it resolves.
  const repaired = useRepairedTrack(song.title, song.artist, song.previewUrl)
  const hasPreview = !!repaired.previewUrl
  const albumArt   = song.albumArt ?? repaired.albumArt

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn('flex items-center gap-4 px-6 py-4 hover:bg-cream-50 transition-colors group cursor-pointer',
        isCurrentTrack ? 'bg-lavender-50' : '')}
      onClick={onPlay}
    >
      {/* Album art or number */}
      <div className="relative w-10 h-10 shrink-0">
        {albumArt
          ? <img src={albumArt} alt={song.title} className="w-10 h-10 rounded-xl object-cover" />
          : <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-body font-semibold text-white"
              style={{ background: primaryColor }}>{index + 1}</span>
        }
        {isCurrentTrack && (
          <div className="absolute inset-0 rounded-xl bg-lavender-500/30 flex items-center justify-center">
            <span className="text-white text-xs">♪</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('font-body font-semibold truncate', isCurrentTrack ? 'text-lavender-500' : 'text-warm-500')}>
          {song.title}
        </p>
        <p className="font-body text-warm-300 text-sm truncate">{song.artist}</p>
      </div>

      {/* Live preview status */}
      {repaired.status === 'loading' && (
        <span className="text-warm-200 text-xs font-body shrink-0 hidden sm:flex items-center gap-1">
          <Loader2 size={11} className="animate-spin" /> checking
        </span>
      )}
      {repaired.status === 'found' && (
        <span className="text-sage-400 text-xs font-body shrink-0 hidden sm:block">▶ preview</span>
      )}
      {repaired.status === 'missing' && (
        <span className="text-warm-200 text-xs font-body shrink-0 hidden sm:block">unavailable</span>
      )}

      {/* Spotify link */}
      {song.spotifyUrl && (
        <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-warm-200 hover:text-[#1DB954] transition-colors shrink-0" title="Open in Spotify">
          <ExternalLink size={14}/>
        </a>
      )}

      {/* Audio feature bars */}
      <div className="hidden md:flex items-center gap-3">
        {[{ label: 'Energy', val: song.energy }, { label: 'Valence', val: song.valence }].map(({ label, val }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="w-14 h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(val ?? 0.5) * 100}%`, background: primaryColor }} />
            </div>
            <span className="text-[10px] text-warm-200 font-body">{label}</span>
          </div>
        ))}
      </div>

      <span className="text-warm-200 text-sm font-body shrink-0">{formatDuration(song.durationSec)}</span>
    </motion.div>
  )
}
