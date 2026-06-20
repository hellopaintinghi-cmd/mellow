import { Router } from 'express'

const router = Router()
const memCards = new Map()   // cardId → card

/**
 * POST /api/cards
 * Save a mood card (body = full MoodCard object)
 */
router.post('/', async (req, res) => {
  const card = req.body
  if (!card?.id) return res.status(400).json({ error: 'card.id required' })
  try {
    const { MoodCard } = await import('../db/mongo.js')
    await MoodCard.findOneAndUpdate({ id: card.id }, card, { upsert: true, new: true })
    return res.json({ ok: true })
  } catch {
    memCards.set(card.id, card)
    return res.json({ ok: true })
  }
})

/**
 * GET /api/cards/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { MoodCard } = await import('../db/mongo.js')
    const c = await MoodCard.findOne({ id: req.params.id })
    if (c) return res.json(c.toObject())
  } catch { /* fall through */ }
  const mem = memCards.get(req.params.id)
  if (mem) return res.json(mem)
  return res.status(404).json({ error: 'Card not found' })
})

/**
 * GET /api/cards?userId=xxx
 */
router.get('/', async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId required' })
  try {
    const { MoodCard } = await import('../db/mongo.js')
    const cards = await MoodCard.find({ userId }).sort({ createdAt: -1 }).limit(50)
    return res.json(cards.map(c => c.toObject()))
  } catch {
    const cards = [...memCards.values()].filter(c => c.userId === userId)
    return res.json(cards)
  }
})

export default router
