import { motion } from 'framer-motion'
import { Flower2, Lock } from 'lucide-react'
import { useProfile } from '@/store/mellowStore'
import type { PlantType } from '@/types'
import { cn } from '@/lib/utils'
import ParticleField from '@/components/mood/ParticleField'

const PLANT_META: Record<PlantType, { emoji: string; name: string; color: string; unlockHint: string }> = {
  'lavender':      { emoji: '💜', name: 'Lavender',       color: '#C9A0DC', unlockHint: 'Generate a lofi or calm mood' },
  'cherry-blossom':{ emoji: '🌸', name: 'Cherry Blossom', color: '#F49AC2', unlockHint: 'Generate a classical or study mood' },
  'sunflower':     { emoji: '🌻', name: 'Sunflower',      color: '#FFD27D', unlockHint: 'Generate a jazz or rainy mood' },
  'tulip':         { emoji: '🌷', name: 'Tulip',          color: '#E891A5', unlockHint: 'Generate a soft or morning mood' },
  'daisy':         { emoji: '🌼', name: 'Daisy',          color: '#FFF3B0', unlockHint: 'Generate a spring or outdoor mood' },
  'water-lily':    { emoji: '🪷', name: 'Water Lily',     color: '#5FA8B8', unlockHint: 'Generate an ocean or calm mood' },
  'wildflower':    { emoji: '🌺', name: 'Wildflower',     color: '#E98A4E', unlockHint: 'Generate a camping or adventure mood' },
  'fern':          { emoji: '🌿', name: 'Fern',           color: '#7FAE7A', unlockHint: 'Generate a stormy or greenhouse mood' },
  'pine-sprig':    { emoji: '🌲', name: 'Pine Sprig',     color: '#5C8A4E', unlockHint: 'Generate a cabin or arctic mood' },
  'white-orchid':  { emoji: '🤍', name: 'White Orchid',   color: '#D7E3EE', unlockHint: 'Generate a train or snowy mood' },
  'maple-leaf':    { emoji: '🍁', name: 'Maple Leaf',     color: '#E3A857', unlockHint: 'Generate an autumn or forest mood' },
  'neon-cactus':   { emoji: '🌵', name: 'Neon Cactus',    color: '#5CE1E6', unlockHint: 'Generate a synth or space mood' },
}

const ALL_PLANTS = Object.keys(PLANT_META) as PlantType[]

function PlantCard({ plant, level, locked }: { plant: PlantType; level?: number; locked: boolean }) {
  const meta = PLANT_META[plant]
  const growthEmoji = level === 3 ? '✨' : level === 2 ? '🌱' : '🌰'

  return (
    <motion.div
      whileHover={locked ? {} : { scale: 1.05, y: -4 }}
      className={cn(
        'relative rounded-3xl p-5 text-center transition-all',
        locked
          ? 'bg-cream-100 border-2 border-dashed border-cream-300'
          : 'bg-white shadow-soft border border-cream-200'
      )}
    >
      {locked ? (
        <>
          <div className="text-3xl mb-2 grayscale opacity-30">{meta.emoji}</div>
          <Lock size={16} className="text-warm-200 mx-auto mb-1" />
          <p className="font-body text-xs text-warm-200 leading-tight">{meta.unlockHint}</p>
        </>
      ) : (
        <>
          {/* Growth stage indicator */}
          <span className="absolute top-2 right-3 text-sm">{growthEmoji}</span>
          <div className="text-4xl mb-2 animate-float-slow">{meta.emoji}</div>
          <p className="font-body font-semibold text-warm-500 text-sm">{meta.name}</p>
          {/* Growth bar */}
          <div className="flex gap-1 justify-center mt-2">
            {[1,2,3].map(l => (
              <div
                key={l}
                className="w-4 h-1.5 rounded-full"
                style={{ background: l <= (level ?? 1) ? meta.color : '#E0CDB5' }}
              />
            ))}
          </div>
          <p className="font-body text-xs text-warm-300 mt-1">Stage {level ?? 1}/3</p>
        </>
      )}
    </motion.div>
  )
}

export default function GardenPage() {
  const profile = useProfile()
  const unlockedPlants = profile.garden
  const unlockedTypes  = new Set(unlockedPlants.map(g => g.plant))

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sage-100 to-cream-100 pointer-events-none" />
      <ParticleField count={20} dark={false} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Flower2 size={28} className="text-sage-400" />
            <h1 className="pixel-heading-shimmer pixel-shadow text-xl md:text-2xl">✿ Mood Garden</h1>
          </div>
          <p className="font-body text-warm-300">
            Every mood you save grows a new plant. Tend your garden by exploring new worlds.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Plants Unlocked', value: `${unlockedTypes.size} / ${ALL_PLANTS.length}`, emoji: '🌿' },
            { label: 'Total XP',        value: `${profile.xp}`,                                emoji: '✨' },
            { label: 'Day Streak',      value: `${profile.streakDays}`,                        emoji: '🔥' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl mb-1">{emoji}</p>
              <p className="font-display text-xl font-bold text-warm-500">{value}</p>
              <p className="font-body text-xs text-warm-300">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Garden grid */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4"
        >
          {ALL_PLANTS.map((plant, i) => {
            const slot  = unlockedPlants.find(g => g.plant === plant)
            const locked = !unlockedTypes.has(plant)
            return (
              <motion.div
                key={plant}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <PlantCard plant={plant} level={slot?.level} locked={locked} />
              </motion.div>
            )
          })}
        </motion.div>

        {/* How to unlock */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl bg-white/70 border border-cream-200 p-5"
        >
          <h3 className="text-xs font-bold text-warm-500 mb-3 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>How to grow your garden ✿</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', text: "Generate a mood that matches a plant's theme", emoji: '🎐' },
              { step: '2', text: 'Save the mood card to unlock its plant',       emoji: '🎴' },
              { step: '3', text: 'Generate more of the same vibe to level it up', emoji: '🌱' },
            ].map(({ step, text, emoji }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-sage-200 text-sage-500 font-body font-bold text-sm flex items-center justify-center shrink-0">
                  {step}
                </span>
                <p className="font-body text-sm text-warm-400 leading-snug">{emoji} {text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
