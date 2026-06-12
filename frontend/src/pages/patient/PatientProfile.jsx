import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit2, Save, X, User, Moon, Sun, LogOut, Copy, Check,
  Menu, LayoutDashboard, History, Phone, MapPin,
  Droplets, Calendar, AlertTriangle, ShieldCheck,
  Stethoscope
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import { CardSkeleton } from '../../components/LoadingSkeleton'

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

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, dark, setDark, collapsed }) {
  const { logout } = useAuth()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const patientId = user?.profile?.patient_id || '—'
  const initials = `${user?.first_name || ''}${user?.last_name || ''}`.split('').filter(c => c === c.toUpperCase() && c !== ' ').join('').slice(0, 2) || 'P'

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
        {/* Logo */}
        <div className="flex items-center gap-2 pt-2 pb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">iH</span>
          </div>
          <span className="font-bold font-heading text-primary text-sm">iHealth</span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center
            text-white font-bold text-lg font-heading flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-400 truncate font-mono">{patientId}</p>
              <button onClick={copyId} className="text-gray-400 hover:text-primary transition-colors">
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>

        {/* Info pills */}
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

// ── Field groups ─────────────────────────────────────────────────────────────
const FIELD_GROUPS = [
  {
    title: 'Personal Information',
    icon: User,
    color: 'text-primary',
    fields: [
      { key: 'first_name',   label: 'First Name',  type: 'text',   icon: User },
      { key: 'last_name',    label: 'Last Name',   type: 'text',   icon: User },
      { key: 'age',         label: 'Age',         type: 'number', icon: Calendar },
      { key: 'gender',      label: 'Gender',      type: 'select', icon: User,
        options: ['Male', 'Female', 'Other'] },
      { key: 'blood_group', label: 'Blood Group', type: 'select', icon: Droplets,
        options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { key: 'phone',       label: 'Phone',       type: 'tel',    icon: Phone },
    ],
  },
  {
    title: 'Location',
    icon: MapPin,
    color: 'text-teal-600',
    fields: [
      { key: 'village',  label: 'Village',  type: 'text', icon: MapPin },
      { key: 'district', label: 'District', type: 'text', icon: MapPin },
      { key: 'state',    label: 'State',    type: 'text', icon: MapPin },
      { key: 'pincode',  label: 'Pincode',  type: 'text', icon: MapPin },
    ],
  },
  {
    title: 'Emergency Contact',
    icon: Phone,
    color: 'text-orange-600',
    fields: [
      { key: 'emergency_contact_name',  label: 'Contact Name',  type: 'text', icon: User },
      { key: 'emergency_contact_phone', label: 'Contact Phone', type: 'tel',  icon: Phone },
    ],
  },
  {
    title: 'Medical History',
    icon: Stethoscope,
    color: 'text-red-500',
    fields: [
      { key: 'known_conditions', label: 'Known Conditions', type: 'textarea', icon: Stethoscope },
      { key: 'allergies',        label: 'Allergies',        type: 'textarea', icon: AlertTriangle },
    ],
  },
]

// ── Field renderer ────────────────────────────────────────────────────────────
function ProfileField({ field, value, editing, onChange }) {
  const { key, label, type, icon: Icon, options } = field
  const isFullWidth = type === 'textarea'

  return (
    <div className={isFullWidth ? 'sm:col-span-2' : ''}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
        {Icon && <Icon size={10} />} {label}
      </label>
      {!editing ? (
        <p className={`text-sm font-medium px-3 py-2.5 rounded-xl min-h-[40px] ${
          value
            ? 'text-gray-800 dark:text-gray-200 bg-bg-light dark:bg-bg-dark'
            : 'text-gray-300 dark:text-gray-600 bg-bg-light dark:bg-bg-dark italic'
        }`}>
          {value || 'Not provided'}
        </p>
      ) : type === 'select' ? (
        <select
          value={value || ''}
          onChange={e => onChange(key, e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          rows={2} value={value || ''}
          onChange={e => onChange(key, e.target.value)}
          className="input-field text-sm resize-none"
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      ) : (
        <input
          type={type} value={value || ''}
          onChange={e => onChange(key, e.target.value)}
          className="input-field text-sm"
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const { user } = useAuth()
  const [dark, setDark] = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [profile, setProfile]   = useState(null)
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/api/patients/profile/')
      .then(({ data }) => { setProfile(data); setForm(data) })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/api/patients/profile/update/', form)
      setProfile(data)
      setForm(data)
      setEditing(false)
      toast.success('Profile updated successfully! ✅')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => { setForm(profile); setEditing(false) }

  const initials = `${form.first_name || ''}${form.last_name || ''}`.split('').filter(c => c === c.toUpperCase() && c !== ' ').join('').slice(0, 2) || 'P'
  const completedFields = Object.keys(form).filter(k => form[k] && form[k] !== '').length
  const totalFields = FIELD_GROUPS.flatMap(g => g.fields).length
  const completeness = Math.round((completedFields / totalFields) * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark p-6 space-y-4">
        <div className="skeleton h-8 w-40" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex">
      {/* Sidebar */}
      <Sidebar user={user} dark={dark} setDark={setDark} collapsed={!sidebarOpen} />

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="p-2 rounded-xl hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
              >
                <Menu size={18} className="text-primary" />
              </button>
              <div>
                <h1 className="text-xl font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
                  <User size={20} className="text-primary" /> My Profile
                </h1>
                <p className="text-xs text-gray-400">
                  Profile {completeness}% complete
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {!editing ? (
                <motion.button
                  key="edit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Edit2 size={14} /> Edit Profile
                </motion.button>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-2"
                >
                  <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                    {saving
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Save size={14} />}
                    Save Changes
                  </button>
                  <button onClick={cancel} className="btn-secondary flex items-center gap-2 text-sm">
                    <X size={14} /> Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Avatar + ID card ─────────────────────────────────────────── */}
          <div className="card p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-primary
              flex items-center justify-center text-white text-2xl font-bold font-heading flex-shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold font-heading text-gray-800 dark:text-white">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-sm text-gray-400 font-mono">{profile?.patient_id}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            {/* Profile completeness bar */}
            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-400 mb-1">Profile completeness</p>
              <div className="w-32 h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-primary mt-0.5">{completeness}%</p>
            </div>
          </div>

          {/* ── Verification badge (if complete) ─────────────────────────── */}
          {completeness >= 80 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-sm text-green-700 dark:text-green-400"
            >
              <ShieldCheck size={15} />
              <span className="font-medium">Profile verified — Your doctor has all the information needed.</span>
            </motion.div>
          )}

          {/* ── Field groups ──────────────────────────────────────────────── */}
          {FIELD_GROUPS.map(({ title, icon: GroupIcon, color, fields }) => (
            <motion.div key={title} layout className="card p-5 space-y-4">
              <h2 className={`text-sm font-bold font-heading flex items-center gap-2 ${color}`}>
                <GroupIcon size={15} /> {title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(field => (
                  <ProfileField
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    editing={editing}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* ── Save floating bar (mobile) ─────────────────────────────────── */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white dark:bg-card-dark
                  shadow-2xl border border-border-light dark:border-border-dark rounded-2xl px-5 py-3 z-50"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300 self-center">
                  Unsaved changes
                </span>
                <button onClick={cancel} className="btn-secondary text-sm py-2 px-4">
                  <X size={13} /> Cancel
                </button>
                <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  {saving
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Save size={13} />}
                  Save
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
            iHealth © 2026 — Rural Healthcare Platform
          </p>
        </div>
      </main>
    </div>
  )
}
