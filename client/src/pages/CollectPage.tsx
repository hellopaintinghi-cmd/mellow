import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3x3, FolderOpen, Plus, X, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSavedCards, useMellowStore, useCardHistory } from '@/store/mellowStore'
import MoodCardComponent from '@/components/mood/MoodCardComponent'
import { cn } from '@/lib/utils'

type Tab = 'cards' | 'boards' | 'history'

export default function CollectPage() {
  const navigate     = useNavigate()
  const savedCards   = useSavedCards()
  const history      = useCardHistory()
  const { profile, addBoard, setCurrentCard }  = useMellowStore()
  const [tab, setTab]           = useState<Tab>('cards')
  const [showBoardForm, setShowBoardForm] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDesc,  setNewBoardDesc]  = useState('')

  const createBoard = () => {
    if (!newBoardTitle.trim()) return
    addBoard(newBoardTitle.trim(), newBoardDesc.trim())
    setNewBoardTitle(''); setNewBoardDesc(''); setShowBoardForm(false)
  }

  const openCard = (cardId: string) => {
    const card = history.find(c => c.id === cardId)
    if (card) { setCurrentCard(card); navigate(`/mood/${card.worldId}?cardId=${card.id}`) }
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="pixel-heading-shimmer pixel-shadow text-xl md:text-2xl">🎴 Collection</h1>
          <p className="font-body text-warm-300 mt-1">Your saved moods, boards, and history.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-cream-200 rounded-2xl w-fit">
          {(['cards', 'boards', 'history'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-xl font-body font-medium text-sm capitalize transition-all',
                tab === t ? 'bg-white text-warm-500 shadow-soft' : 'text-warm-300 hover:text-warm-400'
              )}
            >
              {t} {t === 'cards' && `(${savedCards.length})`}
                  {t === 'history' && `(${history.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Saved Cards */}
          {tab === 'cards' && (
            <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {savedCards.length === 0 ? (
                <EmptyState
                  icon="🎴"
                  title="No saved cards yet"
                  body="Generate a mood and save the card to start your collection."
                  action={{ label: 'Generate a mood', onClick: () => navigate('/generate') }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedCards.map((card, i) => (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <MoodCardComponent card={card} compact onClick={() => openCard(card.id)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Boards */}
          {tab === 'boards' && (
            <motion.div key="boards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-warm-300 text-sm">{profile.boards.length} boards</p>
                <button
                  onClick={() => setShowBoardForm(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-lavender-100 text-lavender-500 font-body text-sm font-medium hover:bg-lavender-200 transition-colors"
                >
                  <Plus size={14} /> New board
                </button>
              </div>

              {/* New board form */}
              <AnimatePresence>
                {showBoardForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="bg-white rounded-2xl p-5 shadow-soft">
                      <input
                        value={newBoardTitle}
                        onChange={e => setNewBoardTitle(e.target.value)}
                        placeholder="Board name"
                        className="w-full font-body text-warm-500 placeholder-warm-200 focus:outline-none text-base mb-2 border-b border-cream-200 pb-2"
                      />
                      <textarea
                        value={newBoardDesc}
                        onChange={e => setNewBoardDesc(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full font-body text-warm-400 placeholder-warm-200 focus:outline-none text-sm resize-none"
                      />
                      <div className="flex gap-2 mt-3 justify-end">
                        <button onClick={() => setShowBoardForm(false)} className="px-4 py-2 rounded-full text-warm-300 font-body text-sm hover:bg-cream-100">Cancel</button>
                        <button onClick={createBoard} className="px-4 py-2 rounded-full bg-lavender-300 text-white font-body text-sm font-medium">Create</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {profile.boards.length === 0 ? (
                <EmptyState icon="📌" title="No boards yet" body="Create a board to organise your favourite mood cards." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.boards.map((board, i) => (
                    <motion.div
                      key={board.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-card transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FolderOpen size={16} className="text-warm-300" />
                            <h3 className="text-xs font-bold text-warm-500 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>{board.title}</h3>
                          </div>
                          {board.description && (
                            <p className="font-body text-warm-300 text-sm">{board.description}</p>
                          )}
                          <p className="font-body text-warm-200 text-xs mt-2">{board.cardIds.length} cards</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* History */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {history.length === 0 ? (
                <EmptyState icon="⏳" title="No history yet" body="Every mood you generate is saved here." action={{ label: 'Generate a mood', onClick: () => navigate('/generate') }} />
              ) : (
                <div className="space-y-3">
                  {history.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => openCard(card.id)}
                      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-soft hover:shadow-card transition-all cursor-pointer group"
                    >
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xl"
                        style={{ background: `linear-gradient(135deg, ${card.world.palette.bg}, ${card.world.palette.secondary})` }}
                      >🎐</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-warm-500 truncate">{card.title}</p>
                        <p className="font-body text-warm-300 text-sm truncate italic">"{card.userPrompt}"</p>
                      </div>
                      <p className="font-body text-warm-200 text-xs shrink-0">
                        {new Date(card.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, body, action }: {
  icon: string; title: string; body: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-sm font-bold text-warm-500 mb-2 leading-loose" style={{ fontFamily: "'Press Start 2P', monospace" }}>{title}</h3>
      <p className="font-body text-warm-300 max-w-sm">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-lavender-300 to-dusty-300 text-white font-body font-medium"
        >
          <Wand2 size={15} /> {action.label}
        </button>
      )}
    </motion.div>
  )
}
