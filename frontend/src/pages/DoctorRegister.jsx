/**
 * Doctor Registration — iHealth
 * POST /api/auth/register/doctor/
 * Fields: email, password, confirm_password, first_name, last_name,
 *         phone_number, specialization, hospital_name, city, license_number
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Mail, Lock, Eye, EyeOff, Phone, Stethoscope,
  Building2, MapPin, FileText, Activity, Moon, Sun
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'
import { useAuth } from '../auth/AuthContext'

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

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Pulmonologist', 'Neurologist',
  'Orthopedic', 'Pediatrician', 'Gynecologist', 'Dermatologist',
  'ENT Specialist', 'Ophthalmologist', 'Psychiatrist', 'Emergency Medicine', 'Other',
]

function Field({ label, error, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />}
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function DoctorRegister() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [showPw, setShowPw] = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '',
    specialization: '', hospital_name: '', city: '', license_number: '',
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/doctor/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(er => ({ ...er, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim())  e.first_name  = 'Required'
    if (!form.last_name.trim())   e.last_name   = 'Required'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.phone_number || form.phone_number.length < 10) e.phone_number = 'Valid phone required'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    if (!form.specialization)     e.specialization  = 'Required'
    if (!form.hospital_name.trim()) e.hospital_name = 'Required'
    if (!form.city.trim())        e.city          = 'Required'
    if (!form.license_number.trim()) e.license_number = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register/doctor/', form)
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      toast.success(`🎉 Welcome, Dr. ${data.name}! Your ID: ${data.doctor_id}`)
      setTimeout(() => navigate('/doctor/dashboard'), 1200)
    } catch (err) {
      const respData = err.response?.data || {}
      const serverErrors = {}
      Object.keys(respData).forEach(k => {
        serverErrors[k] = Array.isArray(respData[k]) ? respData[k][0] : respData[k]
      })
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error(respData?.detail || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (key) =>
    `input-field text-sm ${key && errors[key] ? 'border-red-400 focus:ring-red-300' : ''}`

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4 py-10 relative">
      {/* Dark mode toggle */}
      <button
        onClick={() => setDark(d => !d)}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm"
      >
        {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-gray-500" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold font-heading text-primary">iHealth</span>
        </div>

        <h1 className="text-2xl font-bold font-heading text-gray-800 dark:text-white mb-1">
          Doctor Registration
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>

        <form onSubmit={submit} noValidate>
          <div className="card p-6 space-y-5">

            {/* ── Personal Info ─────────────────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <User size={12} /> Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" error={errors.first_name} icon={User}>
                    <input className={`${inputCls('first_name')} pl-9`} placeholder="Ramesh" value={form.first_name} onChange={set('first_name')} />
                  </Field>
                  <Field label="Last Name" error={errors.last_name}>
                    <input className={inputCls('last_name')} placeholder="Sharma" value={form.last_name} onChange={set('last_name')} />
                  </Field>
                </div>
                <Field label="Email Address" error={errors.email} icon={Mail}>
                  <input type="email" className={`${inputCls('email')} pl-9`} placeholder="doctor@hospital.com" value={form.email} onChange={set('email')} autoComplete="email" />
                </Field>
                <Field label="Phone Number" error={errors.phone_number} icon={Phone}>
                  <input type="tel" className={`${inputCls('phone_number')} pl-9`} placeholder="9876543210" value={form.phone_number} onChange={set('phone_number')} />
                </Field>
                <Field label="Password" error={errors.password} icon={Lock}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`${inputCls('password')} pl-9 pr-9`}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </Field>
                <Field label="Confirm Password" error={errors.confirm_password} icon={Lock}>
                  <input
                    type={showConfPw ? 'text' : 'password'}
                    className={`${inputCls('confirm_password')} pl-9 pr-9`}
                    placeholder="Repeat password"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
                    {showConfPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </Field>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border-light dark:bg-border-dark" />

            {/* ── Professional Info ──────────────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Stethoscope size={12} /> Professional Details
              </h2>
              <div className="space-y-4">
                <Field label="Specialization" error={errors.specialization} icon={Stethoscope}>
                  <select className={`${inputCls('specialization')} pl-9 appearance-none`} value={form.specialization} onChange={set('specialization')}>
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Hospital / Clinic Name" error={errors.hospital_name} icon={Building2}>
                  <input className={`${inputCls('hospital_name')} pl-9`} placeholder="District Hospital, Lucknow" value={form.hospital_name} onChange={set('hospital_name')} />
                </Field>
                <Field label="City" error={errors.city} icon={MapPin}>
                  <input className={`${inputCls('city')} pl-9`} placeholder="Lucknow" value={form.city} onChange={set('city')} />
                </Field>
                <Field label="Medical License Number" error={errors.license_number} icon={FileText}>
                  <input className={`${inputCls('license_number')} pl-9`} placeholder="MCI-2024-XXXXX" value={form.license_number} onChange={set('license_number')} />
                </Field>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="doctor-register-submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : '🩺 Create Doctor Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Registering as a patient instead?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">Patient Sign Up</Link>
        </p>
      </motion.div>
    </div>
  )
}
