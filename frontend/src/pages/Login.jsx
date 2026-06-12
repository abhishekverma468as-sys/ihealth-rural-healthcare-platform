/**
 * Login page — iHealth
 * POST /api/auth/login/ → { access, refresh, role, name, profile_id }
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Activity, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
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

export default function Login() {
  const { login, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard', { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.email, form.password)
      // Navigation handled inside AuthContext after login
    } catch {
      // Error toast shown inside AuthContext
    } finally {
      setLoading(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(err => ({ ...err, [key]: '' })) },
  })

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex">
      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-teal-400 items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/3 right-8 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10 text-white text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Activity size={28} className="text-white" />
            </div>
            <span className="text-4xl font-bold font-heading">iHealth</span>
          </div>
          <h2 className="text-2xl font-bold font-heading mb-4 leading-snug">
            Rural Healthcare,<br />Reimagined.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
            Real-time IoT health monitoring for patients and doctors across India's rural communities.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-col gap-3 items-center">
            {[
              '🔴 Live Emergency Alerts',
              '💊 Digital Prescriptions',
              '📈 Health History Reports',
              '🩺 Doctor Dashboard',
            ].map(f => (
              <div key={f} className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white/90">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all"
        >
          {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-primary">iHealth</span>
          </div>

          <h1 className="text-3xl font-bold font-heading text-gray-800 dark:text-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Sign in to your iHealth account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="login-email"
                  {...field('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  id="login-password"
                  {...field('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
          </div>

          {/* Register links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/register"
              className="btn-secondary text-center text-sm py-2.5"
            >
              Patient Sign Up
            </Link>
            <Link
              to="/doctor/register"
              className="btn-secondary text-center text-sm py-2.5"
            >
              Doctor Sign Up
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            iHealth © 2026 — Rural Healthcare Platform
          </p>
        </motion.div>
      </div>
    </div>
  )
}
