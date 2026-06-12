import { Stethoscope, Calendar, Pill } from 'lucide-react'
import { formatTimestamp } from '../utils/healthUtils'

/**
 * PrescriptionCard — displays a single prescription from a doctor.
 */
export default function PrescriptionCard({ prescription }) {
  return (
    <div className="card p-5 space-y-4">
      {/* Doctor + Date */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary-light dark:bg-primary/20">
            <Stethoscope size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm font-heading">
              Dr. {prescription.doctor_name}
            </p>
            {prescription.doctor_specialization && (
              <p className="text-xs text-gray-400">{prescription.doctor_specialization}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">{formatTimestamp(prescription.created_at)}</p>
      </div>

      {/* Medicines */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Pill size={13} className="text-primary" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicines</span>
        </div>
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-body bg-bg-light dark:bg-bg-dark rounded-xl p-3 border border-border-light dark:border-border-dark">
          {prescription.medicines}
        </pre>
      </div>

      {/* Instructions */}
      {prescription.instructions && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Instructions</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-bg-light dark:bg-bg-dark rounded-xl p-3 border border-border-light dark:border-border-dark">
            {prescription.instructions}
          </p>
        </div>
      )}

      {/* Follow-up date */}
      {prescription.follow_up_date && (
        <div className="flex items-center gap-2 text-sm text-primary font-semibold bg-primary-light dark:bg-primary/20 px-3 py-2 rounded-xl">
          <Calendar size={14} />
          Follow-up: {new Date(prescription.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}
