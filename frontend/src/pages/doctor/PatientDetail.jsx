import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Heart, Activity, Thermometer, Send,
  Stethoscope, Moon, Sun, LogOut, Phone, MapPin,
  Droplets, Calendar, ChevronDown, AlertTriangle,
  CheckCircle2, Clock
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import HealthCard from '../../components/HealthCard'
import AlertCard from '../../components/AlertCard'
import PrescriptionCard from '../../components/PrescriptionCard'
import StatusBadge from '../../components/StatusBadge'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import { getPulseStatus, getSpo2Status, getTempStatus, formatTimestamp, timeAgo } from '../../utils/healthUtils'

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

// ── Info Pill ────────────────────────────────────────────────────────────────
function InfoPill({ icon: Icon, label, value, color = 'text-gray-500' }) {
  return (
    <div className="bg-bg-light dark:bg-bg-dark rounded-xl px-3 py-2.5 flex items-center gap-2">
      {Icon && <Icon size={13} className={color} />}
      <div>
        <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm leading-tight">{value || '—'}</p>
      </div>
    </div>
  )
}

// ── Custom Chart Tooltip ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-3 shadow-lg text-xs space-y-1">
      <p className="text-gray-400 font-medium mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dark, setDark] = useDarkMode()
  const [patient, setPatient]           = useState(null)
  const [records, setRecords]           = useState([])
  const [alerts, setAlerts]             = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [form, setForm]                 = useState({ medicines: '', instructions: '', follow_up_date: '' })
  const [sending, setSending]           = useState(false)
  const [activeTab, setActiveTab]       = useState('overview')

  useEffect(() => {
    Promise.all([
      api.get(`/api/doctors/patients/${id}/`),
      api.get(`/api/doctors/patients/${id}/records/`),
      api.get(`/api/doctors/patients/${id}/alerts/`),
      api.get(`/api/doctors/patients/${id}/prescriptions/`),
    ]).then(([p, r, a, rx]) => {
      // Patient detail — flat object
      const patientData = p.data
      // Normalise phone: some serializers use phone_number, some use phone
      if (!patientData.phone && patientData.phone_number) patientData.phone = patientData.phone_number
      // Normalise emergency contact from nested object
      if (patientData.emergency_contact && typeof patientData.emergency_contact === 'object') {
        patientData.emergency_contact_name  = patientData.emergency_contact.name
        patientData.emergency_contact_phone = patientData.emergency_contact.phone
      }
      setPatient(patientData)
      // Records: {count, results:[...]} or flat array
      setRecords(r.data?.results || r.data || [])
      // Alerts: {count, results:[...]} or flat array
      setAlerts(a.data?.results || a.data || [])
      // Prescriptions: flat array
      setPrescriptions(rx.data?.results || rx.data || [])
    }).catch(() => toast.error('Failed to load patient data.')).finally(() => setLoading(false))
  }, [id])

  const sendPrescription = async (e) => {
    e.preventDefault()
    if (!form.medicines.trim()) return toast.error('Medicines field is required.')
    setSending(true)
    try {
      const { data } = await api.post('/api/doctors/prescriptions/', {
        patient_id: id, ...form,
        follow_up_date: form.follow_up_date || null,
      })
      setPrescriptions(prev => [data, ...prev])
      setForm({ medicines: '', instructions: '', follow_up_date: '' })
      toast.success('Prescription sent! 💊')
    } catch {
      toast.error('Failed to send prescription.')
    } finally {
      setSending(false)
    }
  }

  const latest = records[0] || {}
  const chartData = records.slice(0, 20).reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    pulse: r.pulse_rate || r.heart_rate,
    spo2: r.spo2,
    temp: parseFloat(r.temperature),
  }))

  const tabs = [
    { key: 'overview',      label: '📊 Overview' },
    { key: 'alerts',        label: `🚨 Alerts${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
    { key: 'prescriptions', label: `💊 Prescriptions${prescriptions.length > 0 ? ` (${prescriptions.length})` : ''}` },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark p-6 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    )
  }

  const initials = (patient?.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const lastStatus = patient?.last_status || 'green'

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="w-px h-4 bg-border-light dark:bg-border-dark" />
          <div>
            <p className="font-bold text-sm font-heading text-gray-800 dark:text-white">
              {patient?.name || 'Patient Detail'}
            </p>
            <p className="text-[10px] text-gray-400">{id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={lastStatus} />
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

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Patient Profile Card ──────────────────────────────────────────── */}
        {patient && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-heading flex-shrink-0 ${
                lastStatus === 'red' ? 'bg-red-500' : lastStatus === 'yellow' ? 'bg-amber-500' : 'bg-teal-500'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold font-heading text-gray-800 dark:text-white">
                    {patient.name}
                  </h1>
                  <StatusBadge status={lastStatus} size="lg" />
                </div>
                <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{patient.patient_id}</span>
                  <span>·</span>
                  <MapPin size={11} className="inline" />
                  {patient.village}, {patient.district}
                </p>
                {patient.last_updated && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> Last seen: {timeAgo(patient.last_updated)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <InfoPill icon={Calendar}  label="Age"            value={patient.age ? `${patient.age} yrs` : '—'} />
              <InfoPill icon={Droplets}  label="Blood Group"    value={patient.blood_group} color="text-red-500" />
              <InfoPill icon={User}      label="Gender"         value={patient.gender} />
              <InfoPill icon={Phone}     label="Phone"          value={patient.phone} color="text-primary" />
              {patient.state && (
                <InfoPill icon={MapPin} label="State" value={patient.state} />
              )}
              {patient.pincode && (
                <InfoPill icon={MapPin} label="Pincode" value={patient.pincode} />
              )}
              {patient.emergency_contact_name && (
                <InfoPill icon={Phone} label="Emergency Contact" value={`${patient.emergency_contact_name} · ${patient.emergency_contact_phone || '—'}`} color="text-orange-500" />
              )}
              {patient.known_conditions && (
                <div className="sm:col-span-2 bg-bg-light dark:bg-bg-dark rounded-xl px-3 py-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Known Conditions</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{patient.known_conditions}</p>
                </div>
              )}
              {patient.allergies && (
                <div className="sm:col-span-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-700">
                  <p className="text-[9px] text-amber-600 uppercase tracking-wide font-semibold flex items-center gap-1">
                    <AlertTriangle size={9} /> Allergies
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{patient.allergies}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Live Vitals ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard
            title="Heart Rate" icon={Heart}
            value={latest.pulse_rate || latest.heart_rate || '—'} unit="BPM"
            status={latest.pulse_rate ? getPulseStatus(latest.pulse_rate) : 'green'}
            subtitle="Normal: 60–100 BPM"
          />
          <HealthCard
            title="Blood Oxygen (SpO₂)" icon={Activity}
            value={latest.spo2 || '—'} unit="%"
            status={latest.spo2 ? getSpo2Status(latest.spo2) : 'green'}
            subtitle="Normal: ≥95%"
          />
          <HealthCard
            title="Body Temperature" icon={Thermometer}
            value={latest.temperature || '—'} unit="°F"
            status={latest.temperature ? getTempStatus(parseFloat(latest.temperature)) : 'green'}
            subtitle="Normal: 97–99°F"
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-card-dark text-gray-500 hover:text-primary border border-border-light dark:border-border-dark'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Overview tab ────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Chart */}
                {chartData.length > 0 ? (
                  <div className="card p-5">
                    <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                      📈 Health Records Chart ({Math.min(records.length, 20)} readings)
                    </h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f015" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="pulse" stroke="#ef4444" strokeWidth={2} dot={false} name="Pulse (BPM)" />
                        <Line type="monotone" dataKey="spo2"  stroke="#3b82f6" strokeWidth={2} dot={false} name="SpO₂ (%)" />
                        <Line type="monotone" dataKey="temp"  stroke="#f97316" strokeWidth={2} dot={false} name="Temp (°F)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="card p-8 text-center text-gray-400">
                    <Activity size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No health records yet for this patient.</p>
                  </div>
                )}

                {/* Recent records table */}
                {records.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="px-5 py-3 border-b border-border-light dark:border-border-dark">
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
                          {records.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
                              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatTimestamp(r.timestamp)}</td>
                              <td className="px-4 py-3 font-medium">{r.pulse_rate || r.heart_rate || '—'}</td>
                              <td className="px-4 py-3 font-medium">{r.spo2 ? `${r.spo2}%` : '—'}</td>
                              <td className="px-4 py-3 font-medium">{r.temperature ? `${r.temperature}°F` : '—'}</td>
                              <td className="px-4 py-3"><StatusBadge status={r.status || 'green'} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Alerts tab ──────────────────────────────────────────────── */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="card p-10 text-center text-gray-400">
                    <CheckCircle2 size={36} className="mx-auto mb-3 text-green-400" />
                    <p className="text-sm">No alerts for this patient.</p>
                  </div>
                ) : (
                  alerts.map((a, i) => <AlertCard key={i} alert={a} />)
                )}
              </div>
            )}

            {/* ── Prescriptions tab ───────────────────────────────────────── */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-6">
                {/* Send form */}
                <div className="card p-5 space-y-4">
                  <h2 className="font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
                    <Stethoscope size={16} className="text-primary" /> Add Prescription
                  </h2>
                  <form onSubmit={sendPrescription} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        Medicines & Dosage <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={3} value={form.medicines}
                        onChange={e => setForm(f => ({ ...f, medicines: e.target.value }))}
                        placeholder="e.g. Paracetamol 500mg — twice daily after meals"
                        className="input-field text-sm resize-none" required
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
                      <input type="date" value={form.follow_up_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                        className="input-field text-sm" />
                    </div>
                    <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
                      {sending
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send size={14} />}
                      Send Prescription
                    </button>
                  </form>
                </div>

                {/* Previous */}
                {prescriptions.length > 0 ? (
                  <div>
                    <h2 className="text-sm font-bold font-heading text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                      📋 Previous Prescriptions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescriptions.map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                          <PrescriptionCard prescription={p} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center text-gray-400">
                    <p className="text-sm">No previous prescriptions.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
          iHealth © 2026 — Doctor Portal
        </p>
      </div>
    </div>
  )
}
