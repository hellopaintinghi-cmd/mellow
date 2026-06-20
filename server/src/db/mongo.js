import mongoose from 'mongoose'

let connected = false

export async function connectDb() {
  if (connected) return
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'mellow' })
  connected = true
  console.log('✅ MongoDB connected')
}

// ── AuthUser (email/password + Google OAuth) ──────────────────────────────────
const AuthUserSchema = new mongoose.Schema({
  id:             { type: String, required: true, unique: true, index: true },
  email:          { type: String, required: true, unique: true, index: true },
  displayName:    { type: String, default: 'Wanderer' },
  passwordHash:   { type: String, default: null },
  provider:       { type: String, enum: ['email', 'google'], default: 'email' },
  googleId:       { type: String, default: null },
  avatar:         { type: String, default: null },
  xp:             { type: Number, default: 0 },
  level:          { type: Number, default: 1 },
  pet:            { type: String, default: 'cat' },
  petLevel:       { type: Number, default: 1 },
  streakDays:     { type: Number, default: 1 },
  lastActiveDate: { type: String },
  savedCards:     [String],
  garden:         [{ slotId: Number, plant: String, level: Number, unlockedAt: Number }],
  boards:         [{ id: String, title: String, description: String, cardIds: [String], createdAt: Number }],
  moodsGenerated: { type: Number, default: 0 },
  joinedAt:       { type: Number, default: Date.now },
}, { timestamps: true })

// ── MoodCard ──────────────────────────────────────────────────────────────────
const MoodCardSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      { type: String, index: true },
  title:       String,
  tagline:     String,
  userPrompt:  String,
  worldId:     String,
  world:       mongoose.Schema.Types.Mixed,
  playlist:    mongoose.Schema.Types.Mixed,
  quote:       String,
  energyLevel: Number,
  focusLevel:  Number,
  calmLevel:   Number,
  matchScore:  Number,
  createdAt:   Number,
  savedAt:     Number,
}, { timestamps: true })

export const AuthUser = mongoose.models.AuthUser || mongoose.model('AuthUser', AuthUserSchema)
export const MoodCard = mongoose.models.MoodCard || mongoose.model('MoodCard', MoodCardSchema)
