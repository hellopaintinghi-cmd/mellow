import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Check, X, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProfile, useMellowStore, useCardHistory } from '@/store/mellowStore'
import { useAuth } from '@/store/authStore'
import PetCompanion from '@/components/gamification/PetCompanion'
import { getLevelName, xpForLevel, LEVEL_NAMES, type PetSpecies } from '@/types'
import { cn, stringToColor } from '@/lib/utils'

const PETS: { species: PetSpecies; emoji: string; label: string }[] = [
  { species: 'cat',      emoji: '🐱', label: 'Cat'      },
  { species: 'bunny',    emoji: '🐰', label: 'Bunny'    },
  { species: 'fox',      emoji: '🦊', label: 'Fox'      },
  { species: 'capybara', emoji: '🐹', label: 'Capybara' },
  { species: 'penguin',  emoji: '🐧', label: 'Penguin'  },
]

const LEVEL_MILESTONES = Object.entries(LEVEL_NAMES)
  .map(([lvl, name]) => ({ lvl: Number(lvl), name }))
  .sort((a, b) => a.lvl - b.lvl)

export default function ProfilePage() {
  const profile  = useProfile()
  const history  = useCardHistory()
  const { setPet, setDisplayName, earnXp } = useMellowStore()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayedName = user?.displayName || profile.displayName

  const [editName,    setEditName]    = useState(false)
  const [nameInput,   setNameInput]   = useState(displayedName)
  const [showPetPick, setShowPetPick] = useState(false)

  // XP progress within current level
  const prevLevelXp = [...Array(profile.level - 1)].reduce(
    (acc, _, i) => acc + xpForLevel(i + 1), 0
  )
  const currentXpInLevel = profile.xp - prevLevelXp
  const neededXp         = xpForLevel(profile.level)
  const progress         = Math.min(1, currentXpInLevel / neededXp)

  const saveName = () => {
    if (nameInput.trim()) setDisplayName(nameInput.trim())
    setEditName(false)
  }

  const uniqueWorlds   = new Set(history.map(c => c.worldId)).size
  const totalMoods     = profile.moodsGenerated
  const plantsUnlocked = profile.garden.length

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="max-w-3xl mx-auto px-6 py-8 pb-28 md:pb-8 space-y-6">

        {/* ── Profile hero ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-lavender-100 via-cream-100 to-dusty-100 p-6 shadow-soft"
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold text-white shrink-0 shadow-card"
              style={{ background: stringToColor(displayedName) }}
            >
              {displayedName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="flex items-center gap-2 mb-0.5">
                {editName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                      className="font-display text-xl font-bold text-warm-500 bg-white/70 rounded-lg px-2 py-0.5 focus:outline-none border border-lavender-300 w-40"
                      autoFocus
                    />
                    <button onClick={saveName}      className="p-1 rounded-full bg-sage-200 text-sage-500"><Check size={14}/></button>
                    <button onClick={() => setEditName(false)} className="p-1 rounded-full bg-cream-200 text-warm-300"><X size={14}/></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-sm font-bold text-warm-500 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>{displayedName}</h1>
                    <button onClick={() => setEditName(true)} className="p-1 rounded-full hover:bg-white/50 text-warm-300">
                      <Edit2 size={14}/>
                    </button>
                  </>
                )}
              </div>

              {user?.email && (
                <p className="font-body text-xs text-warm-300 mb-1">{user.email}</p>
              )}
              <div className="flex items-center gap-3 mb-3">
                <p className="font-body text-sm text-lavender-500 font-medium">
                  Level {profile.level} · {getLevelName(profile.level)}
                </p>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-white/60 text-warm-300 text-xs font-body hover:text-red-400 hover:bg-white/90 transition-all"
                >
                  <LogOut size={11} /> Sign out
                </button>
              </div>

              {/* XP bar */}
              <div className="mb-1.5">
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs text-warm-300">{currentXpInLevel} / {neededXp} XP</span>
                  <span className="font-body text-xs text-warm-300">Next: Lv.{profile.level + 1}</span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-lavender-300 to-dusty-300 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Moods',    value: totalMoods,     emoji: '🎐' },
              { label: 'Worlds',   value: uniqueWorlds,   emoji: '🌍' },
              { label: 'Plants',   value: plantsUnlocked, emoji: '🌸' },
              { label: 'Streak',   value: `${profile.streakDays}d`, emoji: '🔥' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-white/60 rounded-2xl p-3 text-center">
                <p className="text-xl mb-0.5">{emoji}</p>
                <p className="font-display text-lg font-bold text-warm-500">{value}</p>
                <p className="font-body text-xs text-warm-300">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Pixel Pet ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-soft p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-warm-500 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>✦ Pixel Companion</h2>
              <p className="font-body text-warm-300 text-sm">Your pet grows as you explore moods.</p>
            </div>
            <button
              onClick={() => setShowPetPick(v => !v)}
              className="px-4 py-2 rounded-full bg-lavender-100 text-lavender-500 font-body text-sm font-medium hover:bg-lavender-200 transition-colors"
            >
              {showPetPick ? 'Done' : 'Change pet'}
            </button>
          </div>

          <div className="flex items-center gap-6">
            <PetCompanion size="lg" />
            <div>
              <p className="font-body font-semibold text-warm-500 capitalize">{profile.pet}</p>
              <p className="font-body text-warm-300 text-sm">Level {profile.petLevel}</p>
              <div className="flex gap-1 mt-2">
                {[1,2,3,4,5,6,7,8,9,10].map(l => (
                  <div
                    key={l}
                    className="w-3 h-1.5 rounded-full"
                    style={{ background: l <= profile.petLevel ? '#C9A0DC' : '#E0CDB5' }}
                  />
                ))}
              </div>
              <p className="font-body text-xs text-warm-200 mt-1">Save more cards to level up!</p>
            </div>
          </div>

          {/* Pet picker */}
          <AnimatePresence>
            {showPetPick && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 mt-5 pt-5 border-t border-cream-200">
                  {PETS.map(({ species, emoji, label }) => (
                    <button
                      key={species}
                      onClick={() => setPet(species)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all font-body text-xs',
                        profile.pet === species
                          ? 'bg-lavender-100 text-lavender-500 border-2 border-lavender-300'
                          : 'bg-cream-100 text-warm-300 hover:bg-cream-200'
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Level Roadmap ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-soft p-6"
        >
          <h2 className="text-xs font-bold text-warm-500 mb-4 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>✦ Level Roadmap</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-cream-200" />
            <div className="space-y-5">
              {LEVEL_MILESTONES.map(({ lvl, name }, i) => {
                const reached = profile.level >= lvl
                return (
                  <motion.div
                    key={lvl}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 pl-2"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-pixel z-10',
                        reached
                          ? 'bg-lavender-300 border-lavender-300 text-white'
                          : 'bg-white border-cream-300 text-warm-200'
                      )}
                    >
                      {reached ? '✓' : lvl}
                    </div>
                    <div>
                      <span className={cn('font-body font-medium text-sm', reached ? 'text-warm-500' : 'text-warm-200')}>
                        Lv.{lvl} — {name}
                      </span>
                      {profile.level === lvl && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-lavender-100 text-lavender-500 text-[10px] font-body">Current</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── XP Actions ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-soft p-6"
        >
          <h2 className="text-xs font-bold text-warm-500 mb-2 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>✦ Earn XP</h2>
          <p className="font-body text-warm-300 text-sm mb-4">Ways to grow your Mellow universe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { action: 'Generate a mood',        xp: 10,  emoji: '🎐' },
              { action: 'Save a mood card',        xp: 5,   emoji: '🎴' },
              { action: 'Unlock a garden plant',   xp: 8,   emoji: '🌸' },
              { action: 'Maintain a daily streak', xp: '3×streak', emoji: '🔥' },
              { action: 'Reach a new level',       xp: 'Bonus!',   emoji: '⭐' },
            ].map(({ action, xp, emoji }) => (
              <div key={action} className="flex items-center gap-3 p-3 rounded-xl bg-cream-50">
                <span className="text-xl">{emoji}</span>
                <div className="flex-1">
                  <p className="font-body text-sm text-warm-500">{action}</p>
                </div>
                <span className="font-body text-sm font-semibold text-lavender-500">+{xp} XP</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
