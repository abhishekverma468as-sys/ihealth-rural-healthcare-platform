import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pill, Search, Send, ChevronLeft, ChevronRight,
  Calendar, User, FileText, Stethoscope, ArrowLeft,
  Moon, Sun, LogOut, Clock, CheckCircle2, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import { formatTimestamp } from '../../utils/healthUtils'

// ── Dark mode ────────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

// ── Status badge for prescription ────────────────────────────────────────────
function RxStatusBadge({ followUpDate }) {
  if (!followUpDate) return null
  const isPast = new Date(followUpDate) < new Date()
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      isPast ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
    }`}>
      <Calendar size={9} />
      {isPast ? 'Follow-up due' : 'Upcoming'}
    </span>
  )
}

// ── Prescription Card ─────────────────────────────────────────────────────────
function PrescriptionItem({ rx, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Pill size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm font-heading">
              {rx.patient_name || rx.patient_id}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 font-mono">{rx.patient_id}</span>
              {rx.follow_up_date && <RxStatusBadge followUpDate={rx.follow_up_date} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {formatTimestamp(rx.created_at)}
          </span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border-light dark:border-border-dark pt-3 space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">
                  💊 Medicines & Dosage
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-bg-light dark:bg-bg-dark rounded-xl px-3 py-2 whitespace-pre-wrap">
                  {rx.medicines || '—'}
                </p>
              </div>
              {rx.instructions && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">
                    📋 Instructions
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-bg-light dark:bg-bg-dark rounded-xl px-3 py-2 whitespace-pre-wrap">
                    {rx.instructions}
                  </p>
                </div>
              )}
              {rx.follow_up_date && (
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Calendar size={13} />
                  Follow-up: {new Date(rx.follow_up_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              )}
              {rx.is_resolved && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                  <CheckCircle2 size={12} /> Resolved
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Quick Prescription Form ───────────────────────────────────────────────────
function SendPrescriptionForm({ patients, onSent }) {
  const [form, setForm] = useState({ patient: '', medicines: '', instructions: '', follow_up_date: '' })
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.patient_id || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.patient) return toast.error('Select a patient first.')
    if (!form.medicines.trim()) return toast.error('Medicines field is required.')
    setLoading(true)
    try {
      const { data } = await api.post('/api/doctors/prescriptions/', {
        patient_id: form.patient,
        medicines: form.medicines,
        instructions: form.instructions,
        follow_up_date: form.follow_up_date || null,
      })
      toast.success('Prescription sent! 💊')
      setForm({ patient: '', medicines: '', instructions: '', follow_up_date: '' })
      setQuery('')
      onSent(data)
    } catch {
      toast.error('Failed to send prescription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
        <Stethoscope size={16} className="text-primary" /> New Prescription
      </h2>
      <form onSubmit={submit} className="space-y-3">
        {/* Patient search */}
        <div className="relative">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Patient
          </label>
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Search patient by name or ID…"
              className="input-field pl-9 text-sm"
            />
          </div>
          <AnimatePresence>
            {open && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute left-0 right-0 mt-1 card shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto"
              >
                {filtered.map(p => (
                  <button key={p.patient_id} type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, patient: p.patient_id }))
                      setQuery(`${p.name} (${p.patient_id})`)
                      setOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-light dark:hover:bg-bg-dark transition-colors border-b border-border-light dark:border-border-dark last:border-0"
                  >
                    <span className="font-medium text-gray-800 dark:text-white">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs font-mono">{p.patient_id}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Medicines & Dosage <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4} value={form.medicines}
            onChange={e => setForm(f => ({ ...f, medicines: e.target.value }))}
            placeholder="e.g. Paracetamol 500mg — twice daily after meals&#10;Amoxicillin 250mg — thrice daily"
            className="input-field text-sm resize-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Instructions (optional)
          </label>
          <textarea
            rows={2} value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder="Rest well, drink plenty of fluids…"
            className="input-field text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Follow-up Date (optional)
          </label>
          <input
            type="date" value={form.follow_up_date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
            className="input-field text-sm"
          />
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send size={14} />}
          Send Prescription
        </button>
      </form>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Prescriptions() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [total, setTotal]                 = useState(0)
  const perPage = 15

  const fetchPrescriptions = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, page_size: perPage })
      const { data } = await api.get(`/api/doctors/prescriptions/?${params}`)
      setPrescriptions(data?.results || data || [])
      setTotal(data?.count || (data?.results || data || []).length)
    } catch {
      toast.error('Failed to load prescriptions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrescriptions(page)
    api.get('/api/doctors/patients/').then(({ data }) => setPatients(data?.results || data || []))
  }, [page, fetchPrescriptions])

  const handleNewPrescription = (rx) => {
    setPrescriptions(prev => [rx, ...prev])
    setTotal(t => t + 1)
  }

  // Client-side search filter
  const filtered = prescriptions.filter(rx =>
    (rx.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (rx.patient_id || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="w-px h-4 bg-border-light dark:bg-border-dark" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Pill size={13} className="text-white" />
            </div>
            <p className="font-bold text-sm font-heading text-gray-800 dark:text-white">Prescriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setDark(d => !d)} className="p-2 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-xl transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Sent', value: total, icon: FileText, color: 'bg-primary' },
            { label: 'Patients Covered', value: [...new Set(prescriptions.map(r => r.patient_id))].length, icon: User, color: 'bg-teal-500' },
            { label: 'With Follow-up', value: prescriptions.filter(r => r.follow_up_date).length, icon: Calendar, color: 'bg-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-xl font-bold font-heading text-gray-800 dark:text-white">
                  {loading ? <span className="skeleton inline-block h-5 w-8" /> : value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Prescription list ───────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by patient name or ID…"
                className="input-field pl-9 text-sm"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">
                <Pill size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No prescriptions found.</p>
                <p className="text-xs mt-1 text-gray-300">Use the form on the right to send one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((rx, i) => (
                  <PrescriptionItem key={rx.id || i} rx={rx} index={i} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400">Page {page} of {totalPages} — {total} prescriptions</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40">
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40">
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Send form ──────────────────────────────────────────── */}
          <div className="xl:sticky xl:top-20 xl:self-start">
            <SendPrescriptionForm patients={patients} onSent={handleNewPrescription} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 py-6">
          iHealth © 2026 — Doctor Portal
        </p>
      </div>
    </div>
  )
}
