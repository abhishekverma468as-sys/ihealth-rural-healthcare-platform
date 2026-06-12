import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Eye, Moon, Sun, LogOut, Users, ArrowLeft,
  Stethoscope, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import StatusBadge from '../../components/StatusBadge'
import { TableRowSkeleton, CardSkeleton } from '../../components/LoadingSkeleton'
import { timeAgo } from '../../utils/healthUtils'

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

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        {loading
          ? <div className="skeleton h-6 w-10 mt-0.5" />
          : <p className="text-xl font-bold font-heading text-gray-800 dark:text-white">{value}</p>
        }
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PatientList() {
  const navigate  = useNavigate()
  const { user, logout } = useAuth()
  const [dark, setDark]       = useDarkMode()
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    api.get('/api/doctors/patients/')
      .then(({ data }) => setPatients(data?.results || data || []))
      .catch(() => toast.error('Failed to load patients.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p => {
    const matchSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.patient_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.village || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (p.last_status || 'green') === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all:    patients.length,
    green:  patients.filter(p => (p.last_status || 'green') === 'green').length,
    yellow: patients.filter(p => p.last_status === 'yellow').length,
    red:    patients.filter(p => p.last_status === 'red').length,
  }

  const tabs = [
    { key: 'all',    label: 'All',          emoji: '' },
    { key: 'green',  label: 'Healthy',      emoji: '🟢' },
    { key: 'yellow', label: 'Warning',      emoji: '🟡' },
    { key: 'red',    label: 'Emergency',    emoji: '🔴' },
  ]

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
              <Users size={13} className="text-white" />
            </div>
            <p className="font-bold text-sm font-heading text-gray-800 dark:text-white">
              All Patients
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
          >
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-xl transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Patients"  value={counts.all}    color="bg-primary"    loading={loading} />
          <StatCard icon={CheckCircle2}  label="Healthy"         value={counts.green}  color="bg-green-500"  loading={loading} />
          <StatCard icon={Clock}         label="Warning"         value={counts.yellow} color="bg-amber-500"  loading={loading} />
          <StatCard icon={AlertTriangle} label="Emergency"       value={counts.red}    color="bg-red-500"    loading={loading} />
        </div>

        {/* ── Filter row ────────────────────────────────────────────────── */}
        <div className="card p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, or village…"
              className="input-field pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {tabs.map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1 ${
                  filter === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg-light dark:bg-bg-dark text-gray-500 hover:bg-primary-light dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                {emoji && <span>{emoji}</span>}
                {label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === key ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-light dark:bg-bg-dark text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['Patient ID', 'Name', 'Age', 'Village', 'Blood Group', 'Last Status', 'Last Updated', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {loading
                  ? <TableRowSkeleton rows={8} />
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center">
                          <Users size={36} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-400 text-sm">No patients found.</p>
                        </td>
                      </tr>
                    )
                    : filtered.map((p, i) => (
                        <motion.tr
                          key={p.patient_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-bg-light dark:hover:bg-bg-dark transition-colors cursor-pointer"
                          onClick={() => navigate(`/doctor/patients/${p.patient_id}`)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.patient_id}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{p.age || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.village || '—'}</td>
                          <td className="px-4 py-3">
                            {p.blood_group
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600">
                                  🩸 {p.blood_group}
                                </span>
                              : <span className="text-gray-400">—</span>
                            }
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={p.last_status || 'green'} /></td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {p.last_updated ? timeAgo(p.last_updated) : '—'}
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/doctor/patients/${p.patient_id}`)}
                              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </motion.tr>
                      ))
                }
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{patients.length}</span> patients
            </p>
            {search && filtered.length !== patients.length && (
              <button onClick={() => setSearch('')} className="text-xs text-primary hover:underline">
                Clear search
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
          iHealth © 2026 — Doctor Portal
        </p>
      </div>
    </div>
  )
}
