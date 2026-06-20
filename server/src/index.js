import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import moodRouter  from './routes/mood.js'
import userRouter  from './routes/user.js'
import cardsRouter from './routes/cards.js'
import authRouter  from './routes/auth.js'
import { connectDb } from './db/mongo.js'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
app.use('/api/', limiter)

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30,
  message: { error: 'Too many requests, slow down a little.' } })

app.use('/api/auth',  authRouter)
app.use('/api/mood',  aiLimiter, moodRouter)
app.use('/api/user',  userRouter)
app.use('/api/cards', cardsRouter)

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', gemini: !!process.env.GEMINI_API_KEY, spotify: !!process.env.SPOTIFY_CLIENT_ID, mongo: !!process.env.MONGO_URI, ts: new Date().toISOString() }))

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

async function start() {
  try {
    if (process.env.MONGO_URI) await connectDb()
    else console.log('ℹ️  No MONGO_URI — running without persistent DB')
  } catch (e) {
    console.warn('⚠️  MongoDB unavailable:', e.message)
  }
  app.listen(PORT, () => {
    console.log(`🎐 Mellow API → http://localhost:${PORT}`)
    console.log(`   Gemini:  ${process.env.GEMINI_API_KEY ? '✅' : '❌ (using keyword fallback)'}`)
    console.log(`   Spotify: ${process.env.SPOTIFY_CLIENT_ID ? '✅' : '❌ (using static songs)'}`)
    console.log(`   MongoDB: ${process.env.MONGO_URI ? '✅' : '❌ (using in-memory)'}`)
  })
}
start()
