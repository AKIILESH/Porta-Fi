// src/components/Auth/Login.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { isAdmin } from '../../lib/admin.js'

// Theme constants (matching your landing page)
const theme = {
  ink: "#0a0a0f",
  parchment: "#f0ebe0",
  gold: "#c9a84c",
  goldLight: "#e8c96b",
  goldDim: "rgba(201,168,76,0.12)",
  cream: "#faf7f2",
  muted: "#6e6558",
  border: "rgba(201,168,76,0.18)",
  borderHi: "rgba(201,168,76,0.36)",
  green: "#5cb87a",
  red: "#d96b6b",
  
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontMono: "'DM Mono', 'Courier New', monospace",
  fontBody: "'DM Sans', system-ui, sans-serif",
}

// Inject global styles
if (!document.getElementById('portafi-auth-styles')) {
  const s = document.createElement('style')
  s.id = 'portafi-auth-styles'
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');
    
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(400%); }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: ${theme.ink}; }
  `
  document.head.appendChild(s)
}

// Particles animation component
function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const nodes = Array.from({ length: 32 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.2 + 0.4,
      o: Math.random() * 0.3 + 0.1,
    }))

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `${r},${g},${b}`
    }
    const rgb = hexToRgb(theme.gold)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 80) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${rgb}, ${0.08 * (1 - d/80)})`
            ctx.lineWidth = 0.3
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        })
        
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${a.o})`
        ctx.fill()
        
        a.x += a.vx
        a.y += a.vy
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1
      })
      
      raf = requestAnimationFrame(draw)
    }
    
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.4,
        pointerEvents: 'none',
      }}
    />
  )
}

// Input field component
function InputField({ label, type, value, onChange, placeholder, autoComplete, error }) {
  const [focused, setFocused] = useState(false)
  
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: theme.fontMono,
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: error ? theme.red : theme.muted,
        marginBottom: 6,
      }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: focused ? 'rgba(16,14,10,0.6)' : 'rgba(16,14,10,0.3)',
          border: `1px solid ${error ? theme.red : focused ? theme.gold : theme.border}`,
          color: theme.parchment,
          fontFamily: theme.fontMono,
          fontSize: '0.8rem',
          outline: 'none',
          transition: 'all 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// Button component
function Button({ children, onClick, disabled, loading, fullWidth = true, variant = 'primary' }) {
  const [hovered, setHovered] = useState(false)
  
  const isPrimary = variant === 'primary'
  
  const getStyles = () => {
    if (isPrimary) {
      return {
        background: hovered ? theme.goldLight : theme.gold,
        color: theme.ink,
        border: `1px solid ${theme.gold}`,
      }
    }
    return {
      background: 'transparent',
      color: hovered ? theme.gold : theme.muted,
      border: `1px solid ${hovered ? theme.gold : theme.border}`,
    }
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 24px',
        fontFamily: theme.fontMono,
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...getStyles(),
      }}
    >
      {loading ? <span style={{ animation: 'spin 1s linear infinite' }}>◌</span> : children}
    </button>
  )
}

// Main Login Component
export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        redirectBasedOnRole(session.user)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        redirectBasedOnRole(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const redirectBasedOnRole = (user) => {
    if (isAdmin(user)) {
      navigate('/admin', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      redirectBasedOnRole(data.user)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: theme.ink,
      fontFamily: theme.fontBody,
    }}>
      {/* Left Panel - Branding */}
      <div style={{
        flex: '0 0 50%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(150deg, ${theme.goldDim}, #040812 100%)`,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 52px',
      }}>
        <Particles />

        {/* Scanline effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${theme.gold}04 0%, transparent 100%)`,
          animation: 'scanline 8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 60,
            animation: 'fadeUp 0.4s ease both',
          }}>
            <div style={{
              width: 40,
              height: 40,
              background: `${theme.gold}1a`,
              border: `1px solid ${theme.gold}45`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: theme.gold,
            }}>
              ◈
            </div>
            <span style={{
              fontFamily: theme.fontDisplay,
              fontSize: '1.55rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              color: theme.parchment,
            }}>
              Porta<span style={{ color: theme.gold }}>Fi</span>
            </span>
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: `${theme.gold}12`,
            border: `1px solid ${theme.gold}30`,
            padding: '5px 12px',
            marginBottom: 24,
            animation: 'fadeUp 0.4s 0.06s ease both',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: theme.gold,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              fontFamily: theme.fontMono,
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: theme.gold,
            }}>
              SECURE ACCESS
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: theme.fontDisplay,
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            marginBottom: 24,
            animation: 'fadeUp 0.4s 0.1s ease both',
          }}>
            <span style={{ color: theme.parchment, display: 'block' }}>Welcome back</span>
            <span style={{ color: theme.gold, fontStyle: 'italic', display: 'block' }}>to your wealth</span>
          </h1>

          {/* Description */}
          <p style={{
            fontFamily: theme.fontMono,
            fontSize: '0.8rem',
            color: theme.muted,
            lineHeight: 1.8,
            maxWidth: 360,
            marginBottom: 48,
            animation: 'fadeUp 0.4s 0.16s ease both',
          }}>
            Your complete financial dashboard. Stocks, mutual funds, FDs, and cash—all in one place.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            animation: 'fadeUp 0.4s 0.22s ease both',
          }}>
            {[
              { label: 'Live Prices', value: 'NSE/BSE' },
              { label: 'AI Insights', value: 'Personalized' },
              { label: 'Asset Classes', value: '15+' },
              { label: 'Security', value: '256-bit' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '12px',
                border: `1px solid ${theme.border}`,
                background: 'rgba(16,14,10,0.3)',
              }}>
                <div style={{
                  fontFamily: theme.fontMono,
                  fontSize: '0.5rem',
                  letterSpacing: '0.15em',
                  color: theme.muted,
                  marginBottom: 4,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: '1rem',
                  color: theme.gold,
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 360,
          animation: 'fadeUp 0.4s ease both',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: theme.fontDisplay,
              fontSize: '2rem',
              fontWeight: 300,
              color: theme.parchment,
              marginBottom: 8,
            }}>
              Sign In
            </h2>
            <p style={{
              fontFamily: theme.fontMono,
              fontSize: '0.65rem',
              color: theme.muted,
              letterSpacing: '0.05em',
            }}>
              Access your financial dashboard
            </p>
          </div>

          {/* OAuth Buttons */}
          <div style={{
            display: 'grid',
            gap: 12,
            marginBottom: 24,
          }}>
            <Button
              onClick={() => handleOAuth('google')}
              disabled={loading}
              variant="secondary"
            >
              Google
            </Button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
            <span style={{
              fontFamily: theme.fontMono,
              fontSize: '0.55rem',
              color: theme.muted,
            }}>
              OR CONTINUE WITH EMAIL
            </span>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              marginBottom: 20,
              background: `${theme.red}10`,
              border: `1px solid ${theme.red}30`,
              color: theme.red,
              fontFamily: theme.fontMono,
              fontSize: '0.7rem',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              error={error}
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              error={error}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 24,
            }}>
              <Link
                to="/forgot-password"
                style={{
                  fontFamily: theme.fontMono,
                  fontSize: '0.6rem',
                  color: theme.muted,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = theme.gold}
                onMouseLeave={(e) => e.target.style.color = theme.muted}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Sign Up Link */}
          <div style={{
            marginTop: 32,
            textAlign: 'center',
            fontFamily: theme.fontMono,
            fontSize: '0.65rem',
            color: theme.muted,
          }}>
            New to PortaFi?{' '}
            <Link
              to="/signup"
              style={{
                color: theme.gold,
                textDecoration: 'none',
                borderBottom: `1px solid ${theme.gold}40`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.borderBottomColor = theme.gold}
              onMouseLeave={(e) => e.target.style.borderBottomColor = `${theme.gold}40`}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}