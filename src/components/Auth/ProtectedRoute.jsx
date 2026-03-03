// src/components/Auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useState, useEffect } from 'react'
import theme from '../../lib/theme.js'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}