import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, AlertTriangle, Clock, CheckCircle2, Search,
  Eye, Check, Moon, Sun, LogOut, Stethoscope, Send,
  ChevronDown, Bell
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import useWebSocket from '../../hooks/useWebSocket'
import StatusBadge from '../../components/StatusBadge'
import { CardSkeleton, TableRowSkeleton } from '../../components/LoadingSkeleton'
import { formatTimestamp, timeAgo } from '../../utils/healthUtils'

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

// ── Chime ────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    osc.connect(ctx.destination)
    osc.frequency.value = 440
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, 400)
  } catch {}
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {loading
          ? <div className="skeleton h-7 w-12 mt-1" />
          : <p className="text-2xl font-bold font-heading text-gray-800 dark:text-white">{value ?? '—'}</p>}
      </div>
    </div>
  )
}

// ── Emergency Alert Card ─────────────────────────────────────────────────────
function EmergencyCard({ alert, onResolve }) {
  const [resolving, setResolving] = useState(false)
  const navigate = useNavigate()

  const resolve = async () => {
    setResolving(true)
    try {
      await api.put(`/api/doctors/alerts/${alert.id}/resolve/`)
      onResolve(alert.id)
      toast.success('Alert resolved.')
    } catch {
      toast.error('Failed to resolve alert.')
    } finally {
      setResolving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="card border-l-4 border-red-500 emergency-border p-4 space-y-3"
    >
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="font-bold text-gray-800 dark:text-white font-heading">{alert.patient_name}</p>
          <p className="text-xs text-gray-400">{alert.patient_id} · {alert.village}, {alert.district}</p>
        </div>
        <span className="text-xs text-red-500 font-semibold animate-pulse">
          🔴 {timeAgo(alert.created_at)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { label: 'Pulse', value: `${alert.pulse_rate || '—'} BPM`, color: 'text-red-500' },
          { label: 'SpO₂',  value: `${alert.spo2 || '—'}%`,         color: alert.spo2 < 90 ? 'text-red-500' : 'text-amber-500' },
          { label: 'Temp',  value: `${alert.temperature || '—'}°F`,  color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-light dark:bg-bg-dark rounded-xl py-2">
            <p className="text-gray-400">{label}</p>
            <p className={`font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={resolve} disabled={resolving}
          className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3">
          {resolving
            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Check size={13} />}
          Resolve
        </button>
        <button onClick={() => navigate(`/doctor/patients/${alert.patient_id}`)}
          className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3">
          <Eye size={13} /> View Patient
        </button>
      </div>
    </motion.div>
  )
}

// ── Quick Prescription Form ──────────────────────────────────────────────────
function QuickPrescriptionForm({ patients }) {
  const [form, setForm] = useState({ patient: '', medicines: '', instructions: '', follow_up_date: '' })
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.patient_id || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.patient) return toast.error('Select a patient first.')
    setLoading(true)
    try {
      await api.post('/api/doctors/prescriptions/', {
        patient_id: form.patient,
        medicines: form.medicines,
        instructions: form.instructions,
        follow_up_date: form.follow_up_date || null,
      })
      toast.success('Prescription sent successfully! 💊')
      setForm({ patient: '', medicines: '', instructions: '', follow_up_date: '' })
      setQuery('')
    } catch {
      toast.error('Failed to send prescription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
        <Stethoscope size={16} className="text-primary" /> Quick Prescription
      </h3>
      <form onSubmit={submit} className="space-y-3">
        {/* Patient search */}
        <div className="relative">
          <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search patient by name or ID…"
            className="input-field text-sm" />
          <AnimatePresence>
            {open && filtered.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 mt-1 card shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                {filtered.map(p => (
                  <button key={p.patient_id} type="button"
                    onClick={() => { setForm(f => ({ ...f, patient: p.patient_id })); setQuery(`${p.name} (${p.patient_id})`); setOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.patient_id}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <textarea rows={3} value={form.medicines}
          onChange={e => setForm(f => ({ ...f, medicines: e.target.value }))}
          placeholder="Medicines & dosage (e.g. Paracetamol 500mg — twice daily)"
          className="input-field text-sm resize-none" required />

        <textarea rows={2} value={form.instructions}
          onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
          placeholder="Instructions (optional)"
          className="input-field text-sm resize-none" />

        <input type="date" value={form.follow_up_date}
          onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
          className="input-field text-sm" />

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
          Send Prescription
        </button>
      </form>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user, profileId, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [stats, setStats]           = useState(null)
  const [alerts, setAlerts]         = useState([])
  const [patients, setPatients]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [pLoading, setPLoading]     = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const prevAlertIds = useRef(new Set())

  const doctorId = profileId || user?.profile?.doctor_id
  const wsUrl = doctorId ? `ws://localhost:8000/ws/doctor/${doctorId}/` : null
  const { data: wsData, isConnected } = useWebSocket(wsUrl)

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/api/doctors/dashboard/'),
      api.get('/api/doctors/alerts/emergency/'),
    ]).then(([dash, emerg]) => {
      setStats(dash.data)
      const list = emerg.data?.results || emerg.data || []
      setAlerts(list)
      list.forEach(a => prevAlertIds.current.add(a.id))
    }).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false))

    api.get('/api/doctors/patients/').then(({ data }) => {
      setPatients(data?.results || data || [])
    }).catch(() => {}).finally(() => setPLoading(false))
  }, [])

  // ── WebSocket new alerts ───────────────────────────────────────────────────
  // Backend DoctorConsumer broadcasts {type:'new_alert', alert_type, patient_id,
  //   patient_name, village, district, pulse_rate, spo2, temperature, alert_id, ...}
  useEffect(() => {
    if (!wsData) return
    // Only handle red emergency alerts; skip connection_established etc.
    if (wsData.type !== 'new_alert' || wsData.alert_type !== 'emergency') return
    const alertId = wsData.alert_id
    if (!alertId || prevAlertIds.current.has(alertId)) return
    prevAlertIds.current.add(alertId)
    // Shape the WS payload into the same structure as REST API alert objects
    const newAlert = {
      id: alertId,
      patient_id: wsData.patient_id,
      patient_name: wsData.patient_name,
      village: wsData.village,
      district: wsData.district,
      pulse_rate: wsData.pulse_rate,
      spo2: wsData.spo2,
      temperature: wsData.temperature,
      created_at: wsData.timestamp,
      alert_type: 'emergency',
      is_resolved: false,
    }
    setAlerts(prev => [newAlert, ...prev])
    playChime()
    toast.error(`🚨 New emergency: ${wsData.patient_name} from ${wsData.village}`, { duration: 8000 })
    if (stats) setStats(s => ({ ...s, active_emergencies: (s.active_emergencies || 0) + 1 }))
  }, [wsData])

  const resolveAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setStats(s => s ? { ...s, active_emergencies: Math.max(0, (s.active_emergencies || 1) - 1), resolved_today: (s.resolved_today || 0) + 1 } : s)
  }, [])

  // ── Filtered patients ──────────────────────────────────────────────────────
  const filtered = patients.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.patient_id || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (p.last_status || 'green') === filter
    return matchSearch && matchFilter
  })

  const filterTabs = [
    { key: 'all',    label: 'All' },
    { key: 'green',  label: '🟢 Healthy' },
    { key: 'yellow', label: '🟡 Warning' },
    { key: 'red',    label: '🔴 Emergency' },
  ]

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm font-heading text-gray-800 dark:text-white">Dr. {user?.name}</p>
            <p className="text-[10px] text-gray-400">{doctorId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isConnected ? 'Live' : 'Reconnecting…'}
          </span>
          <button onClick={() => setDark(d => !d)} className="p-2 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-xl transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Patients"      value={stats?.total_patients}    color="bg-primary"        loading={loading} />
          <StatCard icon={AlertTriangle} label="Active Emergencies"  value={stats?.active_emergencies} color="bg-red-500"        loading={loading} />
          <StatCard icon={Clock}         label="Pending Reviews"     value={stats?.pending_reviews}   color="bg-amber-500"      loading={loading} />
          <StatCard icon={CheckCircle2}  label="Resolved Today"      value={stats?.resolved_today}    color="bg-green-600"      loading={loading} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Emergency queue + Patient table ────────────────────── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Emergency Queue */}
            <section>
              <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Bell size={14} className="text-red-500" /> Emergency Queue
                {alerts.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alerts.length}</span>
                )}
              </h2>
              <AnimatePresence>
                {alerts.length > 0
                  ? <div className="space-y-3">
                      {alerts.map(a => <EmergencyCard key={a.id} alert={a} onResolve={resolveAlert} />)}
                    </div>
                  : <div className="card p-8 text-center text-gray-400">
                      <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400" />
                      <p className="text-sm">✅ No active emergencies right now</p>
                    </div>
                }
              </AnimatePresence>
            </section>

            {/* Patient Table */}
            <section className="card overflow-hidden">
              <div className="p-4 border-b border-border-light dark:border-border-dark space-y-3">
                <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  👥 Patient List
                </h2>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or ID…"
                    className="input-field pl-9 text-sm" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {filterTabs.map(({ key, label }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        filter === key ? 'bg-primary text-white' : 'bg-bg-light dark:bg-bg-dark text-gray-500 hover:bg-primary-light dark:hover:bg-primary/20'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-light dark:bg-bg-dark text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      {['Patient ID', 'Name', 'Village', 'Last Status', 'Last Updated', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {pLoading ? <TableRowSkeleton rows={5} />
                      : filtered.length === 0
                        ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
                        : filtered.map(p => (
                            <tr key={p.patient_id} className="hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.patient_id}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{p.name}</td>
                              <td className="px-4 py-3 text-gray-500">{p.village}</td>
                              <td className="px-4 py-3"><StatusBadge status={p.last_status || 'green'} /></td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{p.last_updated ? timeAgo(p.last_updated) : '—'}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => navigate(`/doctor/patients/${p.patient_id}`)}
                                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                                  <Eye size={12} /> View
                                </button>
                              </td>
                            </tr>
                          ))
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ── Right: Quick Prescription ─────────────────────────────────── */}
          <div>
            <QuickPrescriptionForm patients={patients} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
          iHealth © 2026 — Doctor Portal
        </p>
      </div>
    </div>
  )
}
