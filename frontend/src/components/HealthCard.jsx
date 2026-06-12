import { motion, AnimatePresence } from 'framer-motion'
import { getCardBorder } from '../utils/healthUtils'

/**
 * HealthCard — animated vital reading card.
 * Bounces value on change. Border color reflects status.
 */
export default function HealthCard({ title, icon: Icon, value, unit, status, subtitle, children }) {
  const borderClass = getCardBorder(status)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`card border-2 p-5 flex flex-col gap-3 ${borderClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-body">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${status === 'red' ? 'bg-red-100 dark:bg-red-900/30' : status === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-light dark:bg-primary/20'}`}>
            <Icon size={18} className={status === 'red' ? 'text-emergency' : status === 'yellow' ? 'text-warning' : 'text-primary'} />
          </div>
        )}
      </div>

      {/* Animated value */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.05, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-end gap-1"
        >
          <span className={`text-4xl font-bold font-heading ${
            status === 'red' ? 'text-emergency' : status === 'yellow' ? 'text-warning' : 'text-gray-800 dark:text-white'
          }`}>
            {value ?? '—'}
          </span>
          {unit && <span className="text-sm text-gray-400 mb-1">{unit}</span>}
        </motion.div>
      </AnimatePresence>

      {subtitle && <p className="text-xs text-gray-400 font-body">{subtitle}</p>}
      {children}
    </motion.div>
  )
}
