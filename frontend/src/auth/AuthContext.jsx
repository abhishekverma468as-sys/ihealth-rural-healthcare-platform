/**
 * Global Authentication Context for iHealth.
 *
 * Provides: user, role, isAuthenticated, login(), logout(), loading
 * On app load: restores session from localStorage via /api/auth/me/
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [role, setRole]               = useState(null)       // 'patient' | 'doctor'
  const [profileId, setProfileId]     = useState(null)       // IH-YYYYXXXX or DR-YYYYXXXX
  const [loading, setLoading]         = useState(true)        // true while restoring session
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const navigate = useNavigate()

  // ── Session restoration on page load ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/api/auth/me/')
        // Compute .name from first_name + last_name for convenience
        const enriched = { ...data, name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email }
        setUser(enriched)
        setRole(data.role)
        setProfileId(data.profile?.patient_id || data.profile?.doctor_id || null)
        setIsAuthenticated(true)
      } catch {
        // Token invalid/expired and refresh failed — clear everything
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login/', { email, password })

      // Persist tokens
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('user', JSON.stringify({
        id:         data.user_id,
        name:       data.name,
        email:      data.email,
        role:       data.role,
        profile_id: data.profile_id,
      }))

      setRole(data.role)
      setProfileId(data.profile_id)
      setIsAuthenticated(true)

      // Fetch full profile and compute .name for convenience
      const { data: profile } = await api.get('/api/auth/me/')
      const enriched = { ...profile, name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email }
      setUser(enriched)

      toast.success(`Welcome back, ${data.name}! 👋`)

      // Role-based redirect
      if (data.role === 'patient') {
        navigate('/patient/dashboard')
      } else if (data.role === 'doctor') {
        navigate('/doctor/dashboard')
      }
    } catch (error) {
      const msg = error.response?.data?.non_field_errors?.[0]
        || error.response?.data?.detail
        || 'Login failed. Please check your credentials.'
      toast.error(msg)
      throw error
    }
  }, [navigate])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        await api.post('/api/auth/logout/', { refresh })
      }
    } catch {
      // Ignore logout errors — clear state regardless
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setRole(null)
      setProfileId(null)
      setIsAuthenticated(false)
      toast.success('Logged out successfully.')
      navigate('/login')
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{
      user,
      role,
      profileId,
      isAuthenticated,
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
