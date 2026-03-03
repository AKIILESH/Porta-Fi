// src/components/Auth/Signup.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

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

// Inject global styles (same as login)
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

// Particles animation component (same as login)
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

// Input field component (same as login)
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

// Button component (same as login)
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

// Main Signup Component
export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        navigate('/dashboard', { replace: true })
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      })

      if (error) throw error
      
      setSuccess('Account created! Please check your email to confirm your account.')
      
      // Clear form
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
      
    } catch (err) {
      setError(err.message || 'Failed to create account')
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
          redirectTo: window.location.origin + '/dashboard',
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
        background: `linear-gradient(150deg,${theme.border}, #040812 100%)`,
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
              background: theme.green,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              fontFamily: theme.fontMono,
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: theme.green,
            }}>
              GET STARTED FREE
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
            <span style={{ color: theme.parchment, display: 'block' }}>Start your</span>
            <span style={{ color: theme.gold, fontStyle: 'italic', display: 'block' }}>financial journey</span>
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
            Set up in minutes. Add your holdings, track every rupee, and let our AI guide your next move.
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            animation: 'fadeUp 0.4s 0.22s ease both',
          }}>
            {[
              { label: 'Built for India', value: 'INR' },
              { label: '1 Month Free', value: '₹49/mo' },
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
                  color: theme.green,
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
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
              Create Account
            </h2>
            <p style={{
              fontFamily: theme.fontMono,
              fontSize: '0.65rem',
              color: theme.muted,
              letterSpacing: '0.05em',
            }}>
              Start tracking your wealth today
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
              OR SIGN UP WITH EMAIL
            </span>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
          </div>

          {/* Success Message */}
          {success && (
            <div style={{
              padding: '12px',
              marginBottom: 20,
              background: `${theme.green}10`,
              border: `1px solid ${theme.green}30`,
              color: theme.green,
              fontFamily: theme.fontMono,
              fontSize: '0.7rem',
            }}>
              ✓ {success}
            </div>
          )}

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
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              error={error}
            />

            <InputField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              error={error}
            />

            <div style={{
              marginBottom: 24,
              fontFamily: theme.fontMono,
              fontSize: '0.6rem',
              color: theme.muted,
              lineHeight: 1.6,
            }}>
              By signing up, you agree to our{' '}
              <Link to="/terms" style={{ color: theme.gold, textDecoration: 'none' }}>
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: theme.gold, textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <div style={{
            marginTop: 32,
            textAlign: 'center',
            fontFamily: theme.fontMono,
            fontSize: '0.65rem',
            color: theme.muted,
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: theme.gold,
                textDecoration: 'none',
                borderBottom: `1px solid ${theme.gold}40`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.borderBottomColor = theme.gold}
              onMouseLeave={(e) => e.target.style.borderBottomColor = `${theme.gold}40`}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}