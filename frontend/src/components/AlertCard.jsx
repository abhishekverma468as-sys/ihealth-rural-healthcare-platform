import { Clock, MapPin, Heart, Wind, Thermometer } from 'lucide-react'
import { motion } from 'framer-motion'
import { timeAgo } from '../utils/healthUtils'
import StatusBadge from './StatusBadge'

/**
 * AlertCard — displays a patient alert with vitals summary and optional resolve action.
 */
export default function AlertCard({ alert, onResolve, showResolve = false }) {
  const isEmergency = alert.alert_type === 'emergency'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`card border-2 p-4 ${isEmergency ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10 glow-red' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white font-heading">{alert.patient_name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {alert.patient_village}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={isEmergency ? 'red' : 'yellow'} />
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {timeAgo(alert.created_at)}
          </span>
        </div>
      </div>

      {/* Vitals row */}
      <div className="flex gap-4 text-sm mb-3">
        <span className="flex items-center gap-1 text-red-600 font-semibold">
          <Heart size={13} /> {alert.pulse_rate} bpm
        </span>
        <span className="flex items-center gap-1 text-blue-600 font-semibold">
          <Wind size={13} /> {alert.spo2}%
        </span>
        <span className="flex items-center gap-1 text-orange-600 font-semibold">
          <Thermometer size={13} /> {alert.temperature}°F
        </span>
      </div>

      {/* Analysis note */}
      <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark rounded-lg p-2 border border-gray-100 dark:border-border-dark mb-3">
        {alert.message}
      </p>

      {/* Actions */}
      {showResolve && !alert.is_resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-all"
        >
          ✅ Mark Resolved
        </button>
      )}
      {alert.is_resolved && (
        <p className="text-xs text-green-600 font-semibold text-center">✅ Resolved</p>
      )}
    </motion.div>
  )
}
