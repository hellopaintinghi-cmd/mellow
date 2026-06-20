import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

const memUsers = new Map()  // email → user (fallback when MongoDB unavailable)

const JWT_SECRET  = process.env.JWT_SECRET || 'mellow_dev_secret'
const JWT_EXPIRES = '7d'

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}

function safeUser(u) {
  const { passwordHash, ...rest } = u
  return rest
}

async function findByEmail(email) {
  try {
    const { AuthUser } = await import('../db/mongo.js')
    return await AuthUser.findOne({ email }).lean()
  } catch {
    return memUsers.get(email) ?? null
  }
}

async function findById(id) {
  try {
    const { AuthUser } = await import('../db/mongo.js')
    return await AuthUser.findOne({ id }).lean()
  } catch {
    for (const u of memUsers.values()) if (u.id === id) return u
    return null
  }
}

async function saveUser(user) {
  try {
    const { AuthUser } = await import('../db/mongo.js')
    await AuthUser.findOneAndUpdate({ id: user.id }, user, { upsert: true, new: true })
  } catch {
    memUsers.set(user.email, user)
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body

  if (!email || !password)          return res.status(400).json({ error: 'Email and password are required' })
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Invalid email address' })
  if (password.length < 6)         return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const existing = await findByEmail(email.toLowerCase())
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = {
      id:             uuid(),
      email:          email.toLowerCase(),
      displayName:    displayName?.trim() || email.split('@')[0],
      passwordHash,
      createdAt:      Date.now(),
      xp:             0,
      level:          1,
      pet:            'cat',
      petLevel:       1,
      streakDays:     1,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      savedCards:     [],
      garden:         [],
      boards:         [],
      moodsGenerated: 0,
    }

    await saveUser(user)
    return res.status(201).json({ token: makeToken(user), user: safeUser(user) })
  } catch (err) {
    console.error('[register]', err)
    return res.status(500).json({ error: 'Registration failed, please try again' })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  try {
    const user = await findByEmail(email.toLowerCase())
    if (!user) return res.status(401).json({ error: 'No account found with that email' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Incorrect password' })

    return res.json({ token: makeToken(user), user: safeUser(user) })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ error: 'Login failed, please try again' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(safeUser(user))
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch user' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (_req, res) => res.json({ ok: true }))

export default router
