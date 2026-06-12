import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Activity, Thermometer, LayoutDashboard, History,
  User, LogOut, Copy, Check, Menu, X, ChevronDown,
  Moon, Sun, Bell, Pill, Home, AlertTriangle, Salad,
  Microscope, Wifi, WifiOff
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import useWebSocket from '../../hooks/useWebSocket'
import HealthCard from '../../components/HealthCard'
import StatusBadge from '../../components/StatusBadge'
import PrescriptionCard from '../../components/PrescriptionCard'
import { CardSkeleton, TableRowSkeleton } from '../../components/LoadingSkeleton'
import {
  getPulseStatus, getSpo2Status, getTempStatus,
  formatTimestamp, timeAgo
} from '../../utils/healthUtils'

// ── Dark mode hook ────────────────────────────────────────────────────────────
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

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name} 👋`
}

// ── Emergency audio ───────────────────────────────────────────────────────────
function playEmergencyBeep() {
  let count = 0
  const beep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    osc.connect(ctx.destination)
    osc.frequency.value = 880
    osc.start()
    setTimeout(() => { osc.stop(); ctx.close() }, 800)
    count++
    if (count < 3) setTimeout(beep, 1000)
  }
  beep()
}

// ── SpO₂ radial chart ─────────────────────────────────────────────────────────
function Spo2Chart({ value }) {
  const color = value >= 95 ? '#16a34a' : value >= 90 ? '#d97706' : '#dc2626'
  const data = [{ name: 'SpO₂', value, fill: color }]
  return (
    <div className="relative flex items-center justify-center h-28">
      <RadialBarChart width={112} height={112} innerRadius="60%" outerRadius="80%"
        data={data} startAngle={90} endAngle={90 - 3.6 * value}>
        <RadialBar dataKey="value" cornerRadius={6} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold font-heading" style={{ color }}>{value}%</span>
      </div>
    </div>
  )
}

// ── SVG Thermometer ───────────────────────────────────────────────────────────
function ThermometerViz({ value }) {
  const min = 95, max = 105
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const color = value > 101 || value < 97 ? '#dc2626' : value > 99 || value < 97.5 ? '#d97706' : '#16a34a'
  return (
    <div className="flex justify-center items-end gap-2 h-28">
      <svg width="28" height="90" viewBox="0 0 28 90">
        <rect x="10" y="4" width="8" height="68" rx="4" fill="#e2e8f0" />
        <rect x="10" y={4 + 68 * (1 - pct / 100)} width="8"
          height={68 * (pct / 100)} rx="4" fill={color} />
        <circle cx="14" cy="78" r="10" fill={color} />
      </svg>
      <div className="pb-1">
        <p className="text-xl font-bold font-heading" style={{ color }}>{value}°F</p>
      </div>
    </div>
  )
}

// ── Status Banner ─────────────────────────────────────────────────────────────
function StatusBanner({ status }) {
  const cfg = {
    green:  { cls: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700', msg: '✅ You are Healthy! All vitals are normal.' },
    yellow: { cls: 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600 animate-pulse', msg: '⚠️ Mild concern detected. See recommendations below.' },
    red:    { cls: 'bg-red-50 dark:bg-red-900/30 border-2 border-red-400 glow-red', msg: '🚨 EMERGENCY! Please call for help immediately.' },
  }
  const { cls, msg } = cfg[status] || cfg.green
  return (
    <motion.div key={status} initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }} className={`rounded-2xl p-4 text-center font-semibold text-sm ${cls}`}>
      {msg}
    </motion.div>
  )
}

// ── Recommend Panel ───────────────────────────────────────────────────────────
function RecommendPanel({ recommendations }) {
  const cols = [
    { key: 'diet',        label: 'Diet',         icon: Salad,        color: 'text-green-600' },
    { key: 'precautions', label: 'Precautions',  icon: AlertTriangle, color: 'text-amber-600' },
    { key: 'home_remedies', label: 'Home Remedies', icon: Home,       color: 'text-teal-600' },
  ]
  if (!recommendations) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cols.map(({ key, label, icon: Icon, color }, ci) => (
        <motion.div key={key} initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}
          className="card p-4 space-y-3">
          <div className={`flex items-center gap-2 font-semibold text-sm ${color}`}>
            <Icon size={15} /> {label}
          </div>
          {(recommendations[key] || []).map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="mt-0.5 text-xs">•</span> {item}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// ── Emergency overlay ─────────────────────────────────────────────────────────
function EmergencyOverlay({ onDismiss }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center emergency-overlay"
        onClick={onDismiss}>
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          className="bg-red-600 text-white rounded-2xl p-10 text-center shadow-2xl max-w-sm mx-4">
          <p className="text-5xl mb-4">🚨</p>
          <h2 className="text-2xl font-bold font-heading mb-2">Emergency!</h2>
          <p className="text-lg">Help is on the way.</p>
          <button onClick={onDismiss}
            className="mt-6 px-6 py-2 bg-white text-red-600 rounded-xl font-semibold text-sm">
            Dismiss
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, dark, setDark, collapsed, setCollapsed }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const patientId = user?.profile?.patient_id || 'IH-—'
  const initials = (user?.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const copyId = () => {
    navigator.clipboard.writeText(patientId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const links = [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/history',   icon: History,          label: 'Health History' },
    { to: '/patient/profile',   icon: User,             label: 'My Profile' },
  ]

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col
      bg-white dark:bg-card-dark border-r border-border-light dark:border-border-dark
      transition-all duration-300 ${collapsed ? 'w-0 overflow-hidden' : 'w-64'}`}>
      <div className="flex flex-col flex-1 p-4 gap-4 min-w-[256px]">
        {/* Avatar */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center
            text-white font-bold text-lg font-heading flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-400 truncate">{patientId}</p>
              <button onClick={copyId} className="text-gray-400 hover:text-primary transition-colors">
                {copied ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>

        {/* Patient info pills */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { label: 'Blood', value: user?.profile?.blood_group || '—' },
            { label: 'Age',   value: user?.profile?.age ? `${user.profile.age}y` : '—' },
            { label: 'Village', value: user?.profile?.village || '—' },
            { label: 'District', value: user?.profile?.district || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bg-light dark:bg-bg-dark rounded-lg px-2 py-1.5">
              <p className="text-gray-400 text-[10px]">{label}</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        {/* Dark mode + Logout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-2 rounded-xl
            bg-bg-light dark:bg-bg-dark text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              {dark ? <Moon size={14} /> : <Sun size={14} />}
              <span className="text-xs font-medium">Dark Mode</span>
            </div>
            <button onClick={() => setDark(d => !d)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${dark ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${dark ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <button onClick={logout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { user, profileId } = useAuth()
  const [dark, setDark] = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEmergency, setShowEmergency] = useState(false)
  const [simLoading, setSimLoading] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const simRef = useRef(null)
  const prevStatus = useRef(null)

  const patientId = profileId || user?.profile?.patient_id
  const wsUrl = patientId ? `ws://localhost:8000/ws/patient/${patientId}/` : null
  const { data: wsData, isConnected } = useWebSocket(wsUrl)

  // Derived vitals: prefer live WebSocket, fall back to dashboard data
  const vitals = wsData?.vitals || dashData?.latest_record || {}
  const pulse = vitals.pulse_rate ?? vitals.heart_rate ?? null
  const spo2  = vitals.spo2 ?? null
  const temp  = vitals.temperature ?? null
  const overallStatus = wsData?.status || dashData?.overall_status || 'green'
  const history = dashData?.recent_records || []
  const prescriptions = dashData?.prescriptions || []
  const recommendations = dashData?.recommendations || wsData?.recommendations

  // ── Load dashboard data ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/patients/dashboard/')
      .then(({ data }) => setDashData(data))
      .catch(() => toast.error('Could not load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  // ── WebSocket emergency handler ─────────────────────────────────────────────
  useEffect(() => {
    if (!wsData) return
    const st = wsData.status
    if (st === 'red' && prevStatus.current !== 'red') {
      setShowEmergency(true)
      playEmergencyBeep()
      toast.error('🚨 Emergency alert sent to doctor via email', { duration: 6000 })
      if ('Notification' in window) {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            new Notification('iHealth Emergency', {
              body: 'Critical vitals detected. Help has been alerted.',
              icon: '/favicon.ico'
            })
          }
        })
      }
    }
    prevStatus.current = st
  }, [wsData])

  // ── Close sim dropdown on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = e => { if (simRef.current && !simRef.current.contains(e.target)) setSimOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Simulate health reading ─────────────────────────────────────────────────
  const simulate = useCallback(async (scenario) => {
    setSimOpen(false)
    setSimLoading(true)
    try {
      await api.post('/api/health/simulate/', { patient_id: patientId, scenario })
      toast.success(`Simulating: ${scenario}... results will appear live.`)
    } catch {
      toast.error('Simulation failed.')
    } finally {
      setSimLoading(false)
    }
  }, [patientId])

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = history.slice(-10).map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    pulse: r.pulse_rate || r.heart_rate,
    spo2: r.spo2,
    temp: parseFloat(r.temperature),
  }))

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex">
      {/* Sidebar */}
      <Sidebar user={user} dark={dark} setDark={setDark}
        collapsed={!sidebarOpen} setCollapsed={setSidebarOpen} />

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* ── Header bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(o => !o)}
                className="p-2 rounded-xl hover:bg-primary-light dark:hover:bg-primary/20 transition-colors">
                <Menu size={18} className="text-primary" />
              </button>
              <div>
                <h1 className="text-xl font-bold font-heading text-gray-800 dark:text-white">
                  {getGreeting(user?.name?.split(' ')[0] || 'there')}
                </h1>
                <p className="text-xs text-gray-400">
                  Last updated: {dashData?.latest_record?.recorded_at
                    ? timeAgo(dashData.latest_record.recorded_at) : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              {isConnected
                ? <span className="flex items-center gap-1.5 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span>
                : <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-400" />Reconnecting…</span>}
            </div>
          </div>

          {/* ── Live Vitals ─────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Heart Rate */}
              <HealthCard title="Heart Rate" icon={Heart} value={pulse ?? '—'} unit="BPM"
                status={pulse ? getPulseStatus(pulse) : 'green'}
                subtitle="Normal: 60–100 BPM">
                <div className="flex justify-center py-1">
                  <Heart size={36} className="text-red-500 animate-heartbeat" />
                </div>
              </HealthCard>

              {/* SpO₂ */}
              <HealthCard title="Blood Oxygen (SpO₂)" value={spo2 ?? '—'} unit="%"
                status={spo2 ? getSpo2Status(spo2) : 'green'}
                subtitle={spo2 >= 95 ? 'Normal range' : spo2 >= 90 ? 'Mild concern' : 'Critical'}>
                {spo2 && <Spo2Chart value={spo2} />}
              </HealthCard>

              {/* Temperature */}
              <HealthCard title="Body Temperature" value={temp ?? '—'} unit="°F"
                status={temp ? getTempStatus(temp) : 'green'}
                subtitle="Normal: 97–99°F">
                {temp && <ThermometerViz value={temp} />}
              </HealthCard>
            </div>
          )}

          {/* ── Status banner ───────────────────────────────────────────────── */}
          <StatusBanner status={overallStatus} />

          {/* ── Simulate button ─────────────────────────────────────────────── */}
          <div className="flex justify-center" ref={simRef}>
            <div className="relative">
              <button onClick={() => setSimOpen(o => !o)} disabled={simLoading}
                className="btn-primary flex items-center gap-2">
                {simLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Microscope size={15} />}
                🔬 Simulate Health Reading
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {simOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute left-0 mt-2 w-56 card shadow-xl z-30 overflow-hidden">
                    {[
                      { label: '✅ Simulate Healthy',   scenario: 'healthy',   cls: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700' },
                      { label: '⚠️ Simulate Warning',   scenario: 'warning',   cls: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700' },
                      { label: '🚨 Simulate Emergency', scenario: 'emergency', cls: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700' },
                    ].map(({ label, scenario, cls }) => (
                      <button key={scenario} onClick={() => simulate(scenario)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${cls}`}>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Recommendations ─────────────────────────────────────────────── */}
          {recommendations && (
            <section>
              <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                🩺 Recommendations
              </h2>
              <RecommendPanel recommendations={recommendations} />
            </section>
          )}

          {/* ── Health History Chart ─────────────────────────────────────────── */}
          {chartData.length > 0 && (
            <section className="card p-5">
              <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                📈 Health History (Last 10 Records)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f020" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="pulse" stroke="#ef4444" strokeWidth={2} dot={false} name="Pulse (BPM)" />
                  <Line type="monotone" dataKey="spo2"  stroke="#3b82f6" strokeWidth={2} dot={false} name="SpO₂ (%)" />
                  <Line type="monotone" dataKey="temp"  stroke="#f97316" strokeWidth={2} dot={false} name="Temp (°F)" />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* ── Recent Records Table ─────────────────────────────────────────── */}
          <section className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                🗂 Recent Records
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-light dark:bg-bg-dark text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    {['Time', 'Pulse', 'SpO₂', 'Temp', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {loading ? <TableRowSkeleton rows={5} /> : history.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatTimestamp(r.recorded_at)}</td>
                      <td className="px-4 py-3 font-medium">{r.pulse_rate || r.heart_rate || '—'}</td>
                      <td className="px-4 py-3 font-medium">{r.spo2 ? `${r.spo2}%` : '—'}</td>
                      <td className="px-4 py-3 font-medium">{r.temperature ? `${r.temperature}°F` : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status || 'green'} /></td>
                    </tr>
                  ))}
                  {!loading && history.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Prescriptions ───────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              💊 My Prescriptions
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>
            ) : prescriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <PrescriptionCard prescription={p} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-400">
                <Pill size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No prescriptions yet — your doctor will send them here.</p>
              </div>
            )}
          </section>

          <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
            iHealth © 2026 — Rural Healthcare Platform
          </p>
        </div>
      </main>

      {/* Emergency overlay */}
      {showEmergency && <EmergencyOverlay onDismiss={() => setShowEmergency(false)} />}
    </div>
  )
}
