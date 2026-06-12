import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart, Activity, Thermometer, Wifi, Bell, Shield,
  ArrowRight, Stethoscope, Users, MapPin, ChevronRight,
  Moon, Sun, Zap, FileText, Smartphone
} from 'lucide-react'

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

const FEATURES = [
  {
    icon: Wifi,
    title: 'Real-Time IoT Monitoring',
    desc: 'Live health readings from bedside sensors — pulse, SpO₂, temperature — streamed instantly via WebSocket.',
    color: 'bg-teal-500',
  },
  {
    icon: Bell,
    title: 'Instant Emergency Alerts',
    desc: 'Critical vitals trigger automatic alerts to doctors and email notifications within seconds.',
    color: 'bg-red-500',
  },
  {
    icon: Stethoscope,
    title: 'Doctor Dashboard',
    desc: 'Doctors manage patient lists, review emergencies, and send digital prescriptions from one place.',
    color: 'bg-primary',
  },
  {
    icon: FileText,
    title: 'PDF Health Reports',
    desc: 'Download complete health history as a formatted PDF with vitals, status, and AI recommendations.',
    color: 'bg-amber-500',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'JWT authentication, role-based access, and encrypted data — your health data stays protected.',
    color: 'bg-purple-500',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    desc: 'Fully responsive design works on mobile, tablet, and desktop — even on low-end devices.',
    color: 'bg-blue-500',
  },
]

const STATS = [
  { value: '< 2s', label: 'Alert response time' },
  { value: '3',    label: 'Vitals tracked live' },
  { value: '24/7', label: 'Real-time monitoring' },
  { value: '100%', label: 'Secure & private' },
]

const VITALS = [
  { icon: Heart,       label: 'Heart Rate',   value: '78 BPM',  color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  { icon: Activity,    label: 'SpO₂',         value: '98%',     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { icon: Thermometer, label: 'Temperature',  value: '98.6°F',  color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
]

export default function Landing() {
  const [dark, setDark] = useDarkMode()
  const [pulse, setPulse] = useState(78)

  // Simulate live pulse fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(v => Math.max(65, Math.min(95, v + Math.floor(Math.random() * 7) - 3)))
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Heart size={15} className="text-white" />
          </div>
          <span className="font-bold font-heading text-gray-900 dark:text-white text-lg">iHealth</span>
          <span className="hidden sm:block text-xs text-gray-400 ml-1">Rural Healthcare</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setDark(d => !d)} className="p-2 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
          </button>
          <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
            Get Started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        {/* Background gradient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light dark:bg-primary/20 text-primary text-xs font-semibold mb-5">
              <Zap size={11} /> IoT-Powered Rural Healthcare
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 dark:text-white leading-tight mb-5">
              Smart Health Monitoring{' '}
              <span className="text-primary">for Every Village</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
              iHealth connects patients and doctors through real-time IoT sensors. Monitor pulse, SpO₂, and temperature live — with instant emergency alerts sent to doctors the moment vitals go critical.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary flex items-center gap-2 text-sm">
                Register as Patient <ArrowRight size={14} />
              </Link>
              <Link to="/doctor/register" className="btn-secondary flex items-center gap-2 text-sm">
                <Stethoscope size={14} /> Doctor Portal
              </Link>
            </div>
            <p className="mt-5 text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in here →</Link>
            </p>
          </motion.div>

          {/* Right: Live vitals demo card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="card p-6 space-y-4 shadow-xl relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Patient: Ravi Kumar</p>
                  <p className="text-[10px] font-mono text-gray-300">IH-2026-0001 · Banjarpur Village</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
                </span>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-3 gap-3">
                {VITALS.map(({ icon: Icon, label, value, color, bg, border }) => (
                  <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
                    <p className={`text-sm font-bold font-heading ${color}`}>
                      {label === 'Heart Rate' ? `${pulse} BPM` : value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">✅ All vitals normal — Patient is healthy</p>
              </div>

              {/* Mini chart bars */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Last 8 readings</p>
                <div className="flex items-end gap-1 h-10">
                  {[65, 72, 68, 78, 82, 75, 79, pulse].map((v, i) => (
                    <div key={i}
                      className="flex-1 rounded-sm bg-primary/20 dark:bg-primary/30 transition-all duration-500"
                      style={{ height: `${((v - 55) / 40) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating emergency toast */}
            <motion.div
              initial={{ opacity: 0, y: 10, x: 10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -bottom-4 -right-4 bg-red-600 text-white rounded-2xl p-3 shadow-xl text-xs z-20 max-w-[180px]"
            >
              <p className="font-bold flex items-center gap-1"><Bell size={10} /> Alert Sent</p>
              <p className="text-red-200 text-[10px] mt-0.5">Dr. Sharma notified instantly</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="bg-primary py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl font-bold font-heading text-white">{value}</p>
              <p className="text-primary-light text-sm mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-3">
              Everything you need for rural healthcare
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Built specifically for primary health centres with low connectivity, limited resources, and high patient load.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="card p-5 hover:shadow-md transition-shadow group"
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-bold font-heading text-gray-800 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-card-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Users, title: 'Patient Registers', desc: 'Patient signs up with basic info. Gets a unique ID like IH-2026-0001.', color: 'bg-teal-500' },
              { step: '02', icon: Wifi, title: 'IoT Sensor Streams', desc: 'Bedside sensor continuously sends pulse, SpO₂, and temperature via API.', color: 'bg-primary' },
              { step: '03', icon: Bell, title: 'Doctor Gets Alerted', desc: 'If vitals go critical, doctor receives real-time WebSocket alert + email.', color: 'bg-red-500' },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                className="text-center relative"
              >
                {i < 2 && (
                  <ChevronRight size={20} className="hidden md:block absolute top-6 -right-4 text-gray-300 dark:text-gray-600" />
                )}
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-xs font-bold text-gray-300 dark:text-gray-600 mb-1 block">STEP {step}</span>
                <h3 className="font-bold font-heading text-gray-800 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card p-10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Heart size={22} className="text-white animate-heartbeat" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 dark:text-white mb-3">
              Start monitoring health today
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Free for rural health centres. No hardware subscription. Just connect your IoT sensor and go.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Register as Patient <ArrowRight size={14} />
              </Link>
              <Link to="/doctor/register" className="btn-secondary flex items-center gap-2">
                <Stethoscope size={14} /> Register as Doctor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-light dark:border-border-dark px-6 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Heart size={11} className="text-white" />
          </div>
          <span className="font-bold font-heading text-primary text-sm">iHealth</span>
        </div>
        <p className="text-xs text-gray-400">
          © 2026 iHealth — IoT Rural Healthcare Monitoring Platform
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link to="/login" className="text-xs text-gray-400 hover:text-primary transition-colors">Login</Link>
          <Link to="/register" className="text-xs text-gray-400 hover:text-primary transition-colors">Patient Register</Link>
          <Link to="/doctor/register" className="text-xs text-gray-400 hover:text-primary transition-colors">Doctor Register</Link>
        </div>
      </footer>
    </div>
  )
}
