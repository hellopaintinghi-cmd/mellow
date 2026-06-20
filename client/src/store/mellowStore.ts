import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MoodCard, UserProfile, Board, PetSpecies, GardenSlot } from '@/types'
import { levelFromXp, xpForLevel } from '@/types'
import { v4 as uuid } from 'uuid'

const DEFAULT_PROFILE: UserProfile = {
  id: uuid(),
  displayName: 'Wanderer',
  pet: 'cat',
  petLevel: 1,
  xp: 0,
  level: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  savedCards: [],
  garden: [],
  boards: [],
  moodsGenerated: 0,
  joinedAt: Date.now(),
}

interface MellowState {
  // ── User ──────────────────────────────────────────────────────────────
  profile: UserProfile

  // ── Cards ─────────────────────────────────────────────────────────────
  cards: MoodCard[]          // all generated cards (history)
  currentCard: MoodCard | null

  // ── UI ────────────────────────────────────────────────────────────────
  ambientActive: boolean
  ambientVolumes: Record<string, number>   // soundKey → 0–1

  // ── Notifications (XP toasts, etc.) ───────────────────────────────────
  notifications: { id: string; message: string; xp?: number }[]

  // Actions
  setCurrentCard:  (card: MoodCard) => void
  saveCard:        (card: MoodCard) => void
  removeCard:      (cardId: string) => void
  addBoard:        (title: string, description: string) => void
  addCardToBoard:  (boardId: string, cardId: string) => void
  removeBoard:     (boardId: string) => void

  earnXp:          (amount: number, reason: string) => void
  updateStreak:    () => void
  setPet:          (species: PetSpecies) => void
  setDisplayName:  (name: string) => void
  addGardenPlant:  (plant: GardenSlot) => void

  toggleAmbient:   () => void
  setAmbientVolume:(key: string, vol: number) => void

  dismissNotification: (id: string) => void
}

export const useMellowStore = create<MellowState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      cards: [],
      currentCard: null,
      ambientActive: false,
      ambientVolumes: {},
      notifications: [],

      setCurrentCard: (card) => {
        set({ currentCard: card })
        // Add to history if not already there
        const existing = get().cards.find(c => c.id === card.id)
        if (!existing) {
          set(s => ({ cards: [card, ...s.cards].slice(0, 50) }))
          get().earnXp(10, '✨ Mood generated!')
          set(s => ({
            profile: { ...s.profile, moodsGenerated: s.profile.moodsGenerated + 1 }
          }))
        }
        get().updateStreak()
      },

      saveCard: (card) => {
        const already = get().profile.savedCards.includes(card.id)
        if (already) return
        set(s => ({
          profile: {
            ...s.profile,
            savedCards: [...s.profile.savedCards, card.id],
          },
        }))
        // Ensure card is in history too
        if (!get().cards.find(c => c.id === card.id)) {
          set(s => ({ cards: [card, ...s.cards].slice(0, 50) }))
        }
        get().earnXp(5, '🎴 Card saved!')
        // Plant in garden
        const plant = card.world.gardenPlant
        const garden = get().profile.garden
        if (!garden.find(g => g.plant === plant)) {
          get().addGardenPlant({
            slotId: garden.length,
            plant,
            level: 1,
            unlockedAt: Date.now(),
          })
        }
      },

      removeCard: (cardId) => {
        set(s => ({
          profile: {
            ...s.profile,
            savedCards: s.profile.savedCards.filter(id => id !== cardId),
          },
        }))
      },

      addBoard: (title, description) => {
        const board: Board = {
          id: uuid(), title, description, cardIds: [], createdAt: Date.now()
        }
        set(s => ({
          profile: { ...s.profile, boards: [...s.profile.boards, board] }
        }))
      },

      addCardToBoard: (boardId, cardId) => {
        set(s => ({
          profile: {
            ...s.profile,
            boards: s.profile.boards.map(b =>
              b.id === boardId && !b.cardIds.includes(cardId)
                ? { ...b, cardIds: [...b.cardIds, cardId] }
                : b
            ),
          },
        }))
      },

      removeBoard: (boardId) => {
        set(s => ({
          profile: {
            ...s.profile,
            boards: s.profile.boards.filter(b => b.id !== boardId),
          },
        }))
      },

      earnXp: (amount, reason) => {
        const prev = get().profile.xp
        const newXp = prev + amount
        const prevLevel = levelFromXp(prev)
        const newLevel  = levelFromXp(newXp)
        const notifId = uuid()
        set(s => ({
          profile: { ...s.profile, xp: newXp, level: newLevel },
          notifications: [
            { id: notifId, message: reason, xp: amount },
            ...s.notifications,
          ].slice(0, 5),
        }))
        // Level-up bonus notification
        if (newLevel > prevLevel) {
          const lvlNotifId = uuid()
          setTimeout(() =>
            set(s => ({
              notifications: [
                { id: lvlNotifId, message: `🎉 Level ${newLevel} unlocked!` },
                ...s.notifications,
              ].slice(0, 5),
            })), 800)
        }
        setTimeout(() => get().dismissNotification(notifId), 3500)
      },

      updateStreak: () => {
        const today = new Date().toISOString().slice(0, 10)
        const last  = get().profile.lastActiveDate
        if (last === today) return
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const newStreak  = last === yesterday ? get().profile.streakDays + 1 : 1
        set(s => ({
          profile: { ...s.profile, lastActiveDate: today, streakDays: newStreak }
        }))
        if (newStreak > 1) get().earnXp(newStreak * 3, `🔥 ${newStreak}-day streak!`)
      },

      setPet: (species) => {
        set(s => ({ profile: { ...s.profile, pet: species } }))
      },

      setDisplayName: (name) => {
        set(s => ({ profile: { ...s.profile, displayName: name } }))
      },

      addGardenPlant: (plant) => {
        set(s => ({
          profile: {
            ...s.profile,
            garden: [...s.profile.garden, plant],
          },
        }))
        get().earnXp(8, `🌸 Garden plant unlocked!`)
      },

      toggleAmbient: () => set(s => ({ ambientActive: !s.ambientActive })),

      setAmbientVolume: (key, vol) =>
        set(s => ({ ambientVolumes: { ...s.ambientVolumes, [key]: vol } })),

      dismissNotification: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
    }),
    {
      name: 'mellow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        cards:   s.cards,
        ambientVolumes: s.ambientVolumes,
      }),
    }
  )
)

export function useProfile()     { return useMellowStore(s => s.profile) }
export function useSavedCards()  {
  const { cards, profile } = useMellowStore()
  return cards.filter(c => profile.savedCards.includes(c.id))
}
export function useCardHistory() { return useMellowStore(s => s.cards) }
