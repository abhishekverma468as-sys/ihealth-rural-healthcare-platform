import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'

// Public pages
import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import DoctorRegister from './pages/DoctorRegister'

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard'
import HealthHistory    from './pages/patient/HealthHistory'
import PatientProfile   from './pages/patient/PatientProfile'

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientList     from './pages/doctor/PatientList'
import PatientDetail   from './pages/doctor/PatientDetail'
import Prescriptions   from './pages/doctor/Prescriptions'

/**
 * ProtectedRoute — guards a route by authentication and optional role check.
 * Redirects to /login if not authenticated.
 * Redirects to appropriate dashboard if wrong role.
 */
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-body">Loading iHealth...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"                 element={<Landing />} />
      <Route path="/login"            element={<Login />} />
      <Route path="/register"         element={<Register />} />
      <Route path="/doctor/register"  element={<DoctorRegister />} />

      {/* Patient protected routes */}
      <Route path="/patient/dashboard" element={
        <ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>
      } />
      <Route path="/patient/history" element={
        <ProtectedRoute requiredRole="patient"><HealthHistory /></ProtectedRoute>
      } />
      <Route path="/patient/profile" element={
        <ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>
      } />

      {/* Doctor protected routes */}
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>
      } />
      <Route path="/doctor/patients" element={
        <ProtectedRoute requiredRole="doctor"><PatientList /></ProtectedRoute>
      } />
      <Route path="/doctor/patients/:id" element={
        <ProtectedRoute requiredRole="doctor"><PatientDetail /></ProtectedRoute>
      } />
      <Route path="/doctor/prescriptions" element={
        <ProtectedRoute requiredRole="doctor"><Prescriptions /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
