import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileDown, ChevronLeft, ChevronRight, Filter, History,
  LayoutDashboard, User, Moon, Sun, LogOut, Copy, Check,
  Menu, X, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosInstance'
import StatusBadge from '../../components/StatusBadge'
import { TableRowSkeleton } from '../../components/LoadingSkeleton'
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

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, dark, setDark, collapsed }) {
  const { logout } = useAuth()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const patientId = user?.profile?.patient_id || '—'
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HealthHistory() {
  const { user } = useAuth()
  const [dark, setDark] = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [records, setRecords]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const perPage = 20

  const fetchRecords = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, page_size: perPage })
      if (dateFrom)      params.set('date_from', dateFrom)
      if (dateTo)        params.set('date_to', dateTo)
      if (statusFilter)  params.set('status', statusFilter)
      const { data } = await api.get(`/api/patients/history/?${params}`)
      // API returns {total, page, total_pages, records:[...]} OR {count, results:[...]}
      const list = data?.records || data?.results || data || []
      setRecords(list)
      setTotal(data?.total || data?.count || list.length)
    } catch {
      toast.error('Failed to load health history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecords(page) }, [page])

  const applyFilters = () => { setPage(1); fetchRecords(1) }
  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setStatusFilter('')
    setPage(1)
    setTimeout(() => fetchRecords(1), 50)
  }

  const downloadPDF = async () => {
    setGeneratingPdf(true)
    try {
      // Fetch ALL records for the PDF (no pagination)
      const params = new URLSearchParams({ page_size: 9999 })
      if (dateFrom)     params.set('date_from', dateFrom)
      if (dateTo)       params.set('date_to', dateTo)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await api.get(`/api/patients/history/?${params}`)
      const allRecords = data?.records || data?.results || data || []

      const doc = new jsPDF()
      const profile = user?.profile || {}

      // ── Header banner ──────────────────────────────────────────────────────
      doc.setFillColor(15, 118, 110)
      doc.rect(0, 0, 210, 32, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('iHealth', 14, 14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Rural Healthcare Platform — Health Report', 14, 21)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 27)

      // ── Patient info ───────────────────────────────────────────────────────
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(`Patient: ${user?.name || '—'}`, 14, 44)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const infoLine = [
        `ID: ${profile.patient_id || '—'}`,
        `Village: ${profile.village || '—'}`,
        `District: ${profile.district || '—'}`,
        `Blood Group: ${profile.blood_group || '—'}`,
        `Age: ${profile.age || '—'}`,
      ].join('   |   ')
      doc.text(infoLine, 14, 51)

      if (profile.known_conditions) {
        doc.setTextColor(100)
        doc.text(`Conditions: ${profile.known_conditions}`, 14, 57)
      }

      // ── Records table ──────────────────────────────────────────────────────
      autoTable(doc, {
        startY: profile.known_conditions ? 63 : 58,
        head: [['#', 'Date & Time', 'Pulse (BPM)', 'SpO₂ (%)', 'Temp (°F)', 'Status']],
        body: allRecords.map((r, i) => [
          i + 1,
          formatTimestamp(r.timestamp || r.recorded_at),
          r.pulse_rate || r.heart_rate || '—',
          r.spo2 != null ? `${r.spo2}%` : '—',
          r.temperature || '—',
          r.status === 'green' ? 'Healthy' : r.status === 'yellow' ? 'Warning' : 'Emergency',
        ]),
        headStyles: {
          fillColor: [15, 118, 110],
          fontSize: 8,
          fontStyle: 'bold',
          textColor: 255,
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        didParseCell(data) {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw
            if (val === 'Emergency') data.cell.styles.textColor = [220, 38, 38]
            else if (val === 'Warning') data.cell.styles.textColor = [217, 119, 6]
            else data.cell.styles.textColor = [22, 163, 74]
          }
        },
      })

      // ── Recommendations (from latest record) ───────────────────────────────
      const latest = allRecords[0]
      if (latest?.recommendations) {
        const finalY = doc.lastAutoTable.finalY + 12
        if (finalY < 260) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 118, 110)
          doc.text('Recommendations (from latest record):', 14, finalY)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(60, 60, 60)
          doc.setFontSize(8.5)
          const recs = latest.recommendations
          let y = finalY + 7
          if (recs.diet?.length) {
            doc.setFont('helvetica', 'bold')
            doc.text('Diet:', 14, y)
            doc.setFont('helvetica', 'normal')
            doc.text(recs.diet.join(', '), 28, y)
            y += 6
          }
          if (recs.precautions?.length) {
            doc.setFont('helvetica', 'bold')
            doc.text('Precautions:', 14, y)
            doc.setFont('helvetica', 'normal')
            doc.text(recs.precautions.join(', '), 38, y)
            y += 6
          }
          if (recs.home_remedies?.length) {
            doc.setFont('helvetica', 'bold')
            doc.text('Home Remedies:', 14, y)
            doc.setFont('helvetica', 'normal')
            doc.text(recs.home_remedies.join(', '), 46, y)
          }
        }
      }

      // ── Footer on every page ───────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(
          `Generated by iHealth on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} — Page ${i} of ${pageCount}`,
          14, 290
        )
        doc.text('Confidential — For medical use only', 140, 290)
      }

      doc.save(`iHealth_Report_${user?.name?.replace(/\s+/g, '_') || 'patient'}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success(`PDF downloaded! (${allRecords.length} records)`)
    } catch {
      toast.error('Failed to generate PDF.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const hasFilters = dateFrom || dateTo || statusFilter

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex">
      {/* Sidebar */}
      <Sidebar user={user} dark={dark} setDark={setDark} collapsed={!sidebarOpen} />

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="p-2 rounded-xl hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
              >
                {sidebarOpen ? <X size={18} className="text-primary" /> : <Menu size={18} className="text-primary" />}
              </button>
              <div>
                <h1 className="text-xl font-bold font-heading text-gray-800 dark:text-white flex items-center gap-2">
                  <History size={20} className="text-primary" /> Health History
                </h1>
                <p className="text-xs text-gray-400">
                  {total > 0 ? `${total} total records` : 'Your complete health log'}
                </p>
              </div>
            </div>
            <button
              onClick={downloadPDF}
              disabled={generatingPdf || records.length === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {generatingPdf
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FileDown size={15} />}
              📄 Download PDF Report
            </button>
          </div>

          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div className="card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1 flex items-center gap-1">
                <Calendar size={11} /> From
              </label>
              <input
                type="date" value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="input-field text-sm w-36"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1 flex items-center gap-1">
                <Calendar size={11} /> To
              </label>
              <input
                type="date" value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="input-field text-sm w-36"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field text-sm w-36"
              >
                <option value="">All Statuses</option>
                <option value="green">🟢 Healthy</option>
                <option value="yellow">🟡 Warning</option>
                <option value="red">🔴 Emergency</option>
              </select>
            </div>
            <button onClick={applyFilters}
              className="btn-primary flex items-center gap-1.5 text-sm">
              <Filter size={13} /> Apply
            </button>
            {hasFilters && (
              <button onClick={clearFilters}
                className="btn-secondary flex items-center gap-1 text-sm">
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-light dark:bg-bg-dark text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    {['#', 'Date & Time', 'Pulse (BPM)', 'SpO₂ (%)', 'Temp (°F)', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {loading
                    ? <TableRowSkeleton rows={10} />
                    : records.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-14 text-center">
                            <History size={36} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-400 text-sm">No records found.</p>
                            {hasFilters && (
                              <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
                                Clear filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                      : records.map((r, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                              {(page - 1) * perPage + i + 1}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {formatTimestamp(r.timestamp || r.recorded_at)}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.pulse_rate || r.heart_rate || '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.spo2 != null ? `${r.spo2}%` : '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.temperature || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={r.status || 'green'} />
                            </td>
                          </motion.tr>
                        ))
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border-light dark:border-border-dark">
                <p className="text-xs text-gray-400">
                  Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                  {' — '}{total} total records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                          p === page ? 'bg-primary text-white' : 'bg-bg-light dark:bg-bg-dark text-gray-500 hover:bg-primary-light dark:hover:bg-primary/20'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-4">
            iHealth © 2026 — Rural Healthcare Platform
          </p>
        </div>
      </main>
    </div>
  )
}
