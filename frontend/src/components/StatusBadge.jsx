import { getStatusLabel, getStatusEmoji } from '../utils/healthUtils'

/**
 * StatusBadge — pill badge with colored dot and label.
 * status: 'green' | 'yellow' | 'red'
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const config = {
    green:  { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
    yellow: { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
    red:    { bg: 'bg-red-100   dark:bg-red-900/30',    text: 'text-red-700   dark:text-red-400',    dot: 'bg-red-500 animate-pulse' },
  }[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }

  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.bg} ${config.text} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {getStatusEmoji(status)} {getStatusLabel(status)}
    </span>
  )
}
