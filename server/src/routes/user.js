import { Router } from 'express'

const router = Router()

// ── In-memory store (falls back if MongoDB not connected) ─────────────────────
const memStore = new Map()

function getStore() {
  try {
    // Lazy import to avoid crash if mongoose isn't connected
    return import('../db/mongo.js').then(({ User }) => User)
  } catch {
    return null
  }
}

/**
 * GET /api/user/:id
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const User = await getStore()
    if (User) {
      const u = await User.findOne({ id })
      if (u) return res.json(u.toObject())
    }
    const mem = memStore.get(id)
    if (mem) return res.json(mem)
    return res.status(404).json({ error: 'User not found' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/user
 * Body: UserProfile (full object)
 */
router.post('/', async (req, res) => {
  const data = req.body
  if (!data?.id) return res.status(400).json({ error: 'id required' })
  try {
    const User = await getStore()
    if (User) {
      const u = await User.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true })
      return res.json(u.toObject())
    }
    memStore.set(data.id, data)
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * PATCH /api/user/:id
 * Body: partial UserProfile fields
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const patch   = req.body
  try {
    const User = await getStore()
    if (User) {
      const u = await User.findOneAndUpdate({ id }, { $set: patch }, { new: true })
      if (!u) return res.status(404).json({ error: 'User not found' })
      return res.json(u.toObject())
    }
    const mem = memStore.get(id)
    if (!mem) return res.status(404).json({ error: 'User not found' })
    const updated = { ...mem, ...patch }
    memStore.set(id, updated)
    return res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
