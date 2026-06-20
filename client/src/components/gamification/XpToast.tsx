import { AnimatePresence, motion } from 'framer-motion'
import { useMellowStore } from '@/store/mellowStore'

export default function XpToast() {
  const notifications = useMellowStore(s => s.notifications)

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 3).map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white shadow-deep border border-cream-200"
          >
            <span className="text-sm">{n.message}</span>
            {n.xp !== undefined && (
              <span className="font-body font-semibold text-sm text-lavender-500">+{n.xp} XP</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
