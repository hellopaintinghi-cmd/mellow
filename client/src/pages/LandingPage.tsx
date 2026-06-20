import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import ParticleField from '@/components/mood/ParticleField'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'

const EXAMPLES = [
  'Kyoto café during winter ❄️',
  'Midnight coding while it rains 💻',
  'Main character Tokyo night walk 🌃',
  'Soft girl Sunday morning ☀️',
  'Locked-in exam prep mode 📚',
  'Campfire stargazing 🔥',
]

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }),
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { login, register, loading, error, clearError, user } = useAuthStore()

  const [tab,         setTab]         = useState<Tab>('login')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [localError,  setLocalError]  = useState('')

  useEffect(() => { if (user) navigate('/generate', { replace: true }) }, [user, navigate])
  useEffect(() => { clearError(); setLocalError('') }, [tab]) // eslint-disable-line

  const validate = () => {
    if (!email.trim())                    { setLocalError('Email is required');                        return false }
    if (!/\S+@\S+\.\S+/.test(email))     { setLocalError('Enter a valid email address');              return false }
    if (!password)                        { setLocalError('Password is required');                     return false }
    if (password.length < 6)             { setLocalError('Password must be at least 6 characters');   return false }
    if (tab === 'register' && !displayName.trim()) { setLocalError('Display name is required');       return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!validate()) return
    try {
      if (tab === 'login') await login(email.trim(), password)
      else                  await register(email.trim(), password, displayName.trim())
      navigate('/generate')
    } catch { /* error shown from store */ }
  }

  const displayedError = localError || error

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fce4ec] via-[#f3e5f5] to-[#e8eaf6] overflow-hidden flex flex-col md:flex-row">
      <ParticleField count={55} dark={false} />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f48fb1, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], x: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #b39ddb, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], x: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-56 h-56 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #80deea, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], y: [0, 18, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* ── LEFT: Hero ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 py-12 md:py-0">
        {/* Logo */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-2 mb-10"
        >
          <span className="text-3xl">🎐</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace" }} className="text-xl text-[#7c3f8e] leading-none">Mellow</span>
        </motion.div>

        {/* Badge */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-2 mb-6 w-fit px-4 py-2 rounded-full bg-white/60 border border-[#ce93d8]/40 text-[#7c3f8e] text-sm font-body"
        >
          <Sparkles size={14} className="text-[#ab47bc]" />
          AI-powered mood generation
        </motion.div>

        <motion.h1
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="pixel-heading-shimmer pixel-shadow text-2xl md:text-3xl leading-loose max-w-xl"
        >
          You don't choose{' '}
          <span className="shimmer-text">songs.</span>
          <br />
          You choose{' '}
          <em className="not-italic shimmer-text">feelings.</em>
        </motion.h1>

        <motion.p
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-6 text-[#7b5ea7]/80 text-lg font-body max-w-md leading-relaxed"
        >
          Type a mood, a place, a vibe. Mellow builds an entire aesthetic world
          around it — music, visuals, ambience, and a card to keep.
        </motion.p>

        {/* Example chips */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-8 flex flex-wrap gap-2 max-w-lg"
        >
          {EXAMPLES.map((ex) => (
            <div
              key={ex}
              className="px-3 py-1.5 rounded-full bg-white/70 border border-[#ce93d8]/30 text-[#7b5ea7] text-xs font-body"
            >
              {ex}
            </div>
          ))}
        </motion.div>

        {/* Feature row */}
        <motion.div
          custom={5} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-10 flex flex-wrap gap-4"
        >
          {[
            { icon: '🌍', label: '30 Mood Worlds' },
            { icon: '🎵', label: 'Smart Playlists' },
            { icon: '🌸', label: 'Mood Garden' },
            { icon: '🐾', label: 'Pixel Pet' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[#9575cd]/70 text-xs font-body">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT: Auth Card ───────────────────────────────────────── */}
<div className="relative z-10 flex items-center justify-center px-8 py-12 md:px-12 md:w-[42%] shrink-0 md:-translate-x-20">
  <motion.div
    initial={{ opacity: 0, y: 32, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.5,
      delay: 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    }}
    className="w-full max-w-md"
  >
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-deep overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-cream-200">
        {(['login', 'register'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-4 font-body font-medium text-sm capitalize transition-colors',
              tab === t
                ? 'text-lavender-500 border-b-2 border-lavender-400'
                : 'text-warm-300 hover:text-warm-400'
            )}
          >
            {t === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <div className="p-8">
        {/* Subtitle */}
        <p className="text-warm-300 font-body text-sm mb-6">
          {tab === 'login'
            ? 'Welcome back. What are you feeling today?'
            : 'Start building your mood universe.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {tab === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <InputField
                  icon={<User size={16} />}
                  type="text"
                  placeholder="Display name (e.g. Luna)"
                  value={displayName}
                  onChange={setDisplayName}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            icon={<Mail size={16} />}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={setEmail}
          />

          <div className="relative">
            <InputField
              icon={<Lock size={16} />}
              type={showPass ? 'text' : 'password'}
              placeholder={
                tab === 'register'
                  ? 'Password (min. 6 characters)'
                  : 'Password'
              }
              value={password}
              onChange={setPassword}
            />

            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-400"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {displayedError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-sm font-body"
              >
                <AlertCircle size={15} className="shrink-0" />
                {displayedError}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-lavender-300 to-dusty-300 text-white font-body font-semibold text-base shadow-soft hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="loading-dots flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-white/80 rounded-full inline-block"
                  />
                ))}
              </span>
            ) : (
              <>
                {tab === 'login' ? 'Sign in' : 'Create account'}
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center text-warm-300 text-xs font-body mt-6">
          {tab === 'login' ? (
            <>
              No account yet?{' '}
              <button
                onClick={() => setTab('register')}
                className="text-lavender-500 hover:underline font-medium"
              >
                Create one free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setTab('login')}
                className="text-lavender-500 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  </motion.div>
</div>
    </div>
  )
}

function InputField({ icon, type, placeholder, value, onChange }: {
  icon: React.ReactNode; type: string; placeholder: string
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-cream-50 border border-cream-200 focus-within:border-lavender-300 transition-colors">
      <span className="text-warm-300 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent font-body text-warm-500 placeholder-warm-200 focus:outline-none text-sm"
      />
    </div>
  )
}
