// src/components/Admin/AdminRoute.jsx
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { isAdmin } from '../../lib/admin.js'
import theme from '../../lib/theme.js'

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthorized(isAdmin(user))
      setLoading(false)
    }
    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: theme.bg,
        color: theme.text 
      }}>
        <div style={{ animation: 'spin 1s linear infinite' }}>⚡</div>
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/admin" replace />
  }

  return children
}