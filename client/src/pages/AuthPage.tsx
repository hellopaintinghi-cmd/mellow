import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import ParticleField from '@/components/mood/ParticleField'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'

export default function AuthPage() {
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
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#1E1A2E] via-[#2A2240] to-[#1A2238] px-4">
      <ParticleField count={40} />

      <motion.div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #C9A0DC, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #7FAE7A, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2">
            <span className="text-4xl">🎐</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace" }} className="text-xl text-white/90 leading-loose">Mellow</span>
          </button>
          <p className="text-white/45 font-body mt-2 text-sm">
            {tab === 'login' ? 'Welcome back. What are you feeling today?' : 'Start building your mood universe.'}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-deep overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-cream-200">
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-4 font-body font-medium text-sm capitalize transition-colors',
                  tab === t ? 'text-lavender-500 border-b-2 border-lavender-400' : 'text-warm-300 hover:text-warm-400'
                )}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {tab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
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
                  placeholder={tab === 'register' ? 'Password (min. 6 characters)' : 'Password'}
                  value={password}
                  onChange={setPassword}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-400">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {displayedError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-lavender-300 to-dusty-300 text-white font-body font-semibold text-base shadow-soft hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="loading-dots flex gap-1.5">
                    {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-white/80 rounded-full inline-block"/>)}
                  </span>
                ) : (
                  <>
                    {tab === 'login' ? 'Sign in' : 'Create account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <p className="text-center text-warm-300 text-xs font-body mt-5">
              {tab === 'login'
                ? <>No account yet?{' '}
                    <button onClick={() => setTab('register')} className="text-lavender-500 hover:underline font-medium">
                      Create one free
                    </button>
                  </>
                : <>Already have an account?{' '}
                    <button onClick={() => setTab('login')} className="text-lavender-500 hover:underline font-medium">
                      Sign in
                    </button>
                  </>
              }
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  )
}

function InputField({ icon, type, placeholder, value, onChange }: {
  icon: React.ReactNode; type: string; placeholder: string
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-cream-50 border border-cream-200 focus-within:border-lavender-300 transition-colors">
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
