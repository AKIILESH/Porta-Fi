// src/components/Auth/Signup.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import theme from '../../lib/theme.js'
import AnimatedBackground from '../shared/AnimatedBackground.jsx'

// Inject global styles
if (!document.getElementById('portafi-auth-styles')) {
  const s = document.createElement('style')
  s.id = 'portafi-auth-styles'
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@300;400;600;700&family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap');
    
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
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(400%); }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: ${theme.bg}; overflow-x: hidden; }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      input, select, textarea, button {
        font-size: 16px !important;
      }
    }
  `
  document.head.appendChild(s)
}

// Input field component
function InputField({ label, type, value, onChange, placeholder, autoComplete, error }) {
  const [focused, setFocused] = useState(false)
  
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: theme.mono,
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: error ? theme.red : theme.muted,
        marginBottom: 6,
        transition: 'color 0.2s',
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
          background: focused ? theme.bg4 : theme.bg3,
          border: `1px solid ${error ? theme.red : focused ? theme.accent : theme.border}`,
          color: theme.text,
          fontFamily: theme.mono,
          fontSize: '0.8rem',
          outline: 'none',
          transition: 'all 0.2s',
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          WebkitAppearance: 'none',
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
        background: hovered ? theme.accentLt : theme.accent,
        color: theme.ink,
        border: `1px solid ${theme.accent}`,
        boxShadow: hovered ? theme.glow : 'none',
      }
    }
    return {
      background: 'transparent',
      color: hovered ? theme.accent : theme.muted,
      border: `1px solid ${hovered ? theme.accent : theme.border}`,
      backdropFilter: 'blur(10px)',
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
        fontFamily: theme.mono,
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
        borderRadius: 8,
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        navigate('/dashboard', { replace: true })
      }
    }
    checkUser()
  }, [navigate])

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
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      background: theme.bg,
      fontFamily: theme.sans,
    }}>
      {/* Left Panel - Branding */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 50%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(150deg, ${theme.accentDim}, #040812 100%)`,
        borderRight: isMobile ? 'none' : `1px solid ${theme.border}`,
        borderBottom: isMobile ? `1px solid ${theme.border}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '40px 24px' : '60px 52px',
        minHeight: isMobile ? 'auto' : '100vh',
      }}>
        <AnimatedBackground />

        {/* Scanline effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${theme.accent}04 0%, transparent 100%)`,
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
            marginBottom: isMobile ? 40 : 60,
            animation: 'fadeUp 0.4s ease both',
          }}>
            <div style={{
              width: 40,
              height: 40,
              background: `${theme.accent}1a`,
              border: `1px solid ${theme.accent}45`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: theme.accent,
              borderRadius: 8,
            }}>
              ◈
            </div>
            <span style={{
              fontFamily: theme.display,
              fontSize: '1.55rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              color: theme.text,
            }}>
              Porta<span style={{ color: theme.accent }}>Fi</span>
            </span>
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: `${theme.green}12`,
            border: `1px solid ${theme.green}30`,
            padding: '5px 12px',
            marginBottom: 24,
            animation: 'fadeUp 0.4s 0.06s ease both',
            borderRadius: 20,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: theme.green,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              fontFamily: theme.mono,
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: theme.green,
            }}>
              GET STARTED FREE
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: theme.display,
            fontSize: isMobile ? '2rem' : 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            marginBottom: 24,
            animation: 'fadeUp 0.4s 0.1s ease both',
          }}>
            <span style={{ color: theme.text, display: 'block' }}>Start your</span>
            <span style={{ color: theme.accent, fontStyle: 'italic', display: 'block' }}>financial journey</span>
          </h1>

          {/* Description */}
          <p style={{
            fontFamily: theme.mono,
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: theme.muted,
            lineHeight: 1.8,
            maxWidth: 360,
            marginBottom: 48,
            animation: 'fadeUp 0.4s 0.16s ease both',
          }}>
            Set up in minutes. Add your holdings, track every rupee, and let our AI guide your next move.
          </p>

          {/* Stats */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              animation: 'fadeUp 0.4s 0.22s ease both',
            }}>
              {[
                { label: 'Built for India', value: 'INR' },
                { label: '1 Month Free', value: '₹49/mo' },
                { label: 'Asset Classes', value: '15+' },
                { label: 'AI Insights', value: 'Personalized' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bg3,
                  borderRadius: 8,
                  backdropFilter: 'blur(10px)',
                }}>
                  <div style={{
                    fontFamily: theme.mono,
                    fontSize: '0.5rem',
                    letterSpacing: '0.15em',
                    color: theme.muted,
                    marginBottom: 4,
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontFamily: theme.display,
                    fontSize: '1rem',
                    color: theme.green,
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '24px' : '40px',
        minHeight: isMobile ? 'auto' : '100vh',
        background: theme.bg2,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 360,
          animation: 'fadeUp 0.4s ease both',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: theme.display,
              fontSize: isMobile ? '1.8rem' : '2rem',
              fontWeight: 300,
              color: theme.text,
              marginBottom: 8,
            }}>
              Create Account
            </h2>
            <p style={{
              fontFamily: theme.mono,
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
              fontFamily: theme.mono,
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
              fontFamily: theme.mono,
              fontSize: '0.7rem',
              borderRadius: 8,
              backdropFilter: 'blur(10px)',
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
              fontFamily: theme.mono,
              fontSize: '0.7rem',
              borderRadius: 8,
              backdropFilter: 'blur(10px)',
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
              fontFamily: theme.mono,
              fontSize: '0.6rem',
              color: theme.muted,
              lineHeight: 1.6,
            }}>
              By signing up, you agree to our{' '}
              <Link to="/terms" style={{ 
                color: theme.accent, 
                textDecoration: 'none',
                borderBottom: `1px solid ${theme.accent}40`,
                transition: 'border-color 0.2s',
              }}>
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ 
                color: theme.accent, 
                textDecoration: 'none',
                borderBottom: `1px solid ${theme.accent}40`,
                transition: 'border-color 0.2s',
              }}>
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
            marginTop: 40,
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* Decorative line */}
            <div style={{
              position: 'absolute',
              top: -20,
              left: '20%',
              right: '20%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${theme.border}, ${theme.accent}40, ${theme.border}, transparent)`,
            }} />
            
            <p style={{
              fontFamily: theme.mono,
              fontSize: '0.7rem',
              color: theme.muted,
              marginBottom: 12,
            }}>
              Already have an account?
            </p>
            
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: theme.display,
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.accent,
                textDecoration: 'none',
                padding: '8px 24px',
                borderRadius: 40,
                background: `${theme.accent}08`,
                border: `1px solid ${theme.accent}20`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${theme.accent}15`
                e.currentTarget.style.borderColor = `${theme.accent}60`
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = theme.glow
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${theme.accent}08`
                e.currentTarget.style.borderColor = `${theme.accent}20`
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>→</span>
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}