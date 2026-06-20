import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Flower2, Grid3x3, User, Wand2, Home, LogOut, LogIn } from 'lucide-react'
import { useProfile } from '@/store/mellowStore'
import { useAuth } from '@/store/authStore'
import { getLevelName, xpForLevel } from '@/types'
import { cn } from '@/lib/utils'
import PetCompanion from '@/components/gamification/PetCompanion'

const NAV = [
  { to: '/generate',   Icon: Wand2,    label: 'Generate'   },
  { to: '/collection', Icon: Grid3x3,  label: 'Collection' },
  { to: '/garden',     Icon: Flower2,  label: 'Garden'     },
  { to: '/profile',    Icon: User,     label: 'Profile'    },
]

export default function Layout() {
  const profile  = useProfile()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const levelXp          = xpForLevel(profile.level)
  const prevXp           = [...Array(profile.level - 1)].reduce((acc, _, i) => acc + xpForLevel(i + 1), 0)
  const currentXpInLevel = profile.xp - prevXp
  const progress         = Math.min(1, currentXpInLevel / levelXp)

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/70 backdrop-blur border-r border-cream-200 py-6 px-4 gap-2">
        {/* Logo */}
        <button onClick={() => navigate('/generate')} className="flex items-center gap-2 px-3 mb-6">
          <span className="text-2xl">🎐</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace" }} className="text-base text-[#7c3f8e] leading-none">Mellow</span>
        </button>

        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl font-body font-medium transition-all',
              isActive ? 'bg-lavender-100 text-lavender-500 shadow-soft' : 'text-warm-400 hover:bg-cream-200 hover:text-warm-500'
            )}
          >
            <Icon size={18} />{label}
          </NavLink>
        ))}

        <div className="flex-1" />

        {/* Auth section */}
        {user ? (
          <div className="rounded-2xl bg-cream-100 p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-lavender-200 flex items-center justify-center text-lavender-500 font-bold text-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-warm-500 text-sm truncate">{user.displayName}</p>
                <p className="font-body text-xs text-warm-300 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/') }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-warm-300 text-xs font-body hover:text-red-400 transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-lavender-100 to-dusty-100 text-lavender-500 font-body font-medium text-sm hover:from-lavender-200 hover:to-dusty-200 transition-all mb-2">
            <LogIn size={16} /> Sign in / Register
          </button>
        )}

        {/* Pet */}
        <div className="flex justify-center mb-3">
          <PetCompanion size="md" />
        </div>

        {/* XP bar */}
        <div className="rounded-2xl bg-gradient-to-br from-lavender-100 to-cream-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[8px] text-warm-400">Lv.{profile.level}</span>
            <span className="font-pixel text-[8px] text-lavender-500">{getLevelName(profile.level)}</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-lavender-300 to-dusty-300 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-body text-xs text-warm-300">{currentXpInLevel} / {levelXp} XP</span>
            <span className="font-body text-xs text-warm-300">🔥 {profile.streakDays}d</span>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-y-auto pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-cream-200 flex justify-around py-2 z-40">
        <button onClick={() => navigate('/generate')} className="flex flex-col items-center gap-0.5 text-warm-300 text-xs py-1">
          <Home size={20} /><span>Home</span>
        </button>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => cn('flex flex-col items-center gap-0.5 text-xs py-1',
              isActive ? 'text-lavender-500' : 'text-warm-300')}>
            <Icon size={20} /><span>{label}</span>
          </NavLink>
        ))}
        {!user && (
          <button onClick={() => navigate('/auth')} className="flex flex-col items-center gap-0.5 text-xs py-1 text-warm-300">
            <LogIn size={20} /><span>Login</span>
          </button>
        )}
      </nav>
    </div>
  )
}
