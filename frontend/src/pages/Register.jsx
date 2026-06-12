/**
 * Patient Registration — iHealth
 * POST /api/auth/register/patient/
 * Fields: email, password, confirm_password, first_name, last_name,
 *         phone_number, age, gender, blood_group, village, address,
 *         district, state, pincode, emergency_contact
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Lock, Eye, EyeOff, Phone, MapPin, Heart,
  Droplets, Calendar, Activity, ChevronRight, ChevronLeft,
  Moon, Sun, Check
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

const INITIAL = {
  // Step 1 — Account
  first_name: '', last_name: '', email: '', phone_number: '',
  password: '', confirm_password: '',
  // Step 2 — Medical
  age: '', gender: '', blood_group: '',
  // Step 3 — Location + Emergency
  village: '', address: '', district: '', state: '', pincode: '',
  emergency_contact: '',
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other']

// Small reusable labelled input
function Field({ label, error, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/patient/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(er => ({ ...er, [key]: '' }))
  }

  // ── Validate per-step ───────────────────────────────────────────────────────
  const validateStep = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.first_name.trim()) e.first_name = 'Required'
      if (!form.last_name.trim())  e.last_name  = 'Required'
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
      if (!form.phone_number || form.phone_number.length < 10) e.phone_number = 'Valid phone required'
      if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
      if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    }
    if (s === 2) {
      if (!form.age || +form.age <= 0) e.age = 'Valid age required'
      if (!form.gender) e.gender = 'Select gender'
      if (!form.blood_group) e.blood_group = 'Select blood group'
    }
    if (s === 3) {
      if (!form.village.trim())   e.village   = 'Required'
      if (!form.address.trim())   e.address   = 'Required'
      if (!form.district.trim())  e.district  = 'Required'
      if (!form.state.trim())     e.state     = 'Required'
      if (!form.pincode || form.pincode.length !== 6) e.pincode = '6-digit pincode'
      if (!form.emergency_contact || form.emergency_contact.length < 10) e.emergency_contact = 'Valid emergency phone'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    if (!validateStep(3)) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register/patient/', {
        ...form,
        age: parseInt(form.age),
      })
      // Persist tokens
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      toast.success(`🎉 Welcome to iHealth! Your ID: ${data.patient_id}`)
      // Small delay so toast is readable
      setTimeout(() => navigate('/patient/dashboard'), 1200)
    } catch (err) {
      const data = err.response?.data || {}
      // Surface server field errors
      const serverErrors = {}
      Object.keys(data).forEach(k => {
        serverErrors[k] = Array.isArray(data[k]) ? data[k][0] : data[k]
      })
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        // Go back to step 1 if email/password error
        if (serverErrors.email || serverErrors.password) setStep(1)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error(data?.detail || data?.message || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, label: 'Account' },
    { num: 2, label: 'Medical' },
    { num: 3, label: 'Location' },
  ]

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
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold font-heading text-primary">iHealth</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-gray-800 dark:text-white mb-1">
          Create Patient Account
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-7">
          {steps.map(({ num, label }, i) => (
            <div key={num} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > num
                  ? 'bg-primary text-white'
                  : step === num
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-border-light dark:bg-border-dark text-gray-400'
              }`}>
                {step > num ? <Check size={12} /> : num}
              </div>
              <span className={`text-xs font-semibold ${step === num ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${step > num ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-6">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Account ───────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" error={errors.first_name} icon={User}>
                    <input className={`${inputCls('first_name')} pl-9`} placeholder="Ravi" value={form.first_name} onChange={set('first_name')} />
                  </Field>
                  <Field label="Last Name" error={errors.last_name}>
                    <input className={inputCls('last_name')} placeholder="Kumar" value={form.last_name} onChange={set('last_name')} />
                  </Field>
                </div>
                <Field label="Email Address" error={errors.email} icon={Mail}>
                  <input type="email" className={`${inputCls('email')} pl-9`} placeholder="you@email.com" value={form.email} onChange={set('email')} autoComplete="email" />
                </Field>
                <Field label="Phone Number" error={errors.phone_number} icon={Phone}>
                  <input type="tel" className={`${inputCls('phone_number')} pl-9`} placeholder="9876543210" value={form.phone_number} onChange={set('phone_number')} />
                </Field>
                <Field label="Password" error={errors.password} icon={Lock}>
                  <input type={showPw ? 'text' : 'password'} className={`${inputCls('password')} pl-9 pr-9`} placeholder="Min 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </Field>
                <Field label="Confirm Password" error={errors.confirm_password} icon={Lock}>
                  <input type={showConfPw ? 'text' : 'password'} className={`${inputCls('confirm_password')} pl-9 pr-9`} placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </Field>
              </motion.div>
            )}

            {/* ── STEP 2: Medical ───────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <Field label="Age" error={errors.age} icon={Calendar}>
                  <input type="number" min="0" max="120" className={`${inputCls('age')} pl-9`} placeholder="25" value={form.age} onChange={set('age')} />
                </Field>
                <Field label="Gender" error={errors.gender} icon={User}>
                  <select className={`${inputCls('gender')} pl-9 appearance-none`} value={form.gender} onChange={set('gender')}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Blood Group" error={errors.blood_group} icon={Droplets}>
                  <select className={`${inputCls('blood_group')} pl-9 appearance-none`} value={form.blood_group} onChange={set('blood_group')}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>

                <div className="bg-primary-light dark:bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary dark:text-teal-300 flex items-start gap-2">
                  <Heart size={13} className="mt-0.5 flex-shrink-0" />
                  <span>Your medical information helps doctors provide better care and is kept strictly confidential.</span>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Location + Emergency ──────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <Field label="Village / Area" error={errors.village} icon={MapPin}>
                  <input className={`${inputCls('village')} pl-9`} placeholder="Rampur" value={form.village} onChange={set('village')} />
                </Field>
                <Field label="Full Address" error={errors.address}>
                  <textarea className={`${inputCls('address')} resize-none`} rows={2} placeholder="House no., street..." value={form.address} onChange={set('address')} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="District" error={errors.district}>
                    <input className={inputCls('district')} placeholder="Lucknow" value={form.district} onChange={set('district')} />
                  </Field>
                  <Field label="State" error={errors.state}>
                    <input className={inputCls('state')} placeholder="Uttar Pradesh" value={form.state} onChange={set('state')} />
                  </Field>
                </div>
                <Field label="Pincode" error={errors.pincode}>
                  <input type="text" maxLength={6} className={inputCls('pincode')} placeholder="226001" value={form.pincode} onChange={set('pincode')} />
                </Field>
                <Field label="Emergency Contact Phone" error={errors.emergency_contact} icon={Phone}>
                  <input type="tel" className={`${inputCls('emergency_contact')} pl-9`} placeholder="Emergency phone number" value={form.emergency_contact} onChange={set('emergency_contact')} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className={`flex mt-6 gap-3 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
            {step > 1 && (
              <button onClick={back} className="btn-secondary flex items-center gap-1.5 text-sm">
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next} className="btn-primary flex items-center gap-1.5 text-sm">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-1.5 text-sm px-6">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '🎉 Create Account'}
              </button>
            )}
          </div>
        </div>

        {/* Doctor link */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Are you a doctor?{' '}
          <Link to="/doctor/register" className="text-primary font-semibold hover:underline">Register as Doctor</Link>
        </p>
      </motion.div>
    </div>
  )
}
