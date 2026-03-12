import { useTheme } from '../../context/ThemeContext.jsx'

// ── Theme-aware glass helper ──────────────────────────────────────────────────
const makeGlass = (isDark, opacity = 0.04, blur = 20) => ({
  background:           isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
  backdropFilter:       `blur(${blur}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
})

const makeInset = (isDark) => isDark
  ? `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12)`
  : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.06)`

const makeShine = (isDark) => isDark
  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)'
  : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, className }) {
  const { theme, isDark } = useTheme()
  const gi = makeInset(isDark)

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        ...makeGlass(isDark, 0.04, 24),
        border:       `1px solid ${theme.border}`,
        borderRadius: 16,
        padding:      '20px 22px',
        boxShadow:    `${gi}, ${theme.shadow}`,
        transition:   'border-color .25s, box-shadow .25s, background .25s',
        cursor:       onClick ? 'pointer' : 'default',
        position:     'relative',
        overflow:     'hidden',
        ...style,
      }}
      onMouseEnter={e => {
        if (!onClick) return
        e.currentTarget.style.borderColor = theme.borderHi
        e.currentTarget.style.background  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        if (!onClick) return
        e.currentTarget.style.borderColor = theme.border
        e.currentTarget.style.background  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: makeShine(isDark),
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color, children, style = {} }) {
  const { theme, isDark } = useTheme()
  const c = color || theme.accent
  return (
    <span style={{
      ...makeGlass(isDark, 0.06, 12),
      color,
      border:      `1px solid ${c}35`,
      borderRadius: 8,
      padding:     '2px 9px',
      fontSize:    11,
      fontFamily:  theme.mono,
      fontWeight:  500,
      display:     'inline-block',
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, color, ghost = false, style = {}, disabled = false, sm = false, type = 'button' }) {
  const { theme, isDark } = useTheme()
  const c = color || theme.accent

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...makeGlass(isDark, ghost ? 0.02 : 0.07, 16),
        color:        ghost ? theme.muted : c,
        border:       `1px solid ${ghost ? theme.border : c + '40'}`,
        borderRadius: 10,
        padding:      sm ? '5px 13px' : '9px 20px',
        fontFamily:   theme.mono,
        fontSize:     sm ? 10 : 13,
        fontWeight:   500,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.4 : 1,
        transition:   'all .2s',
        whiteSpace:   'nowrap',
        position:     'relative',
        overflow:     'hidden',
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background   = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)'
        e.currentTarget.style.borderColor  = ghost ? theme.borderHi : c + '70'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'
        e.currentTarget.style.borderColor  = ghost ? theme.border : c + '40'
      }}
    >
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', style = {}, name, min, step, required }) {
  const { theme, isDark } = useTheme()

  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      name={name}
      min={min}
      step={step}
      required={required}
      style={{
        ...makeGlass(isDark, 0.05, 16),
        border:      `1px solid ${theme.border}`,
        borderRadius: 10,
        color:        theme.text,
        fontFamily:   theme.mono,
        fontSize:     13,
        padding:      '9px 13px',
        outline:      'none',
        width:        '100%',
        boxSizing:    'border-box',
        boxShadow:    isDark
          ? 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)',
        transition:   'border-color .2s, box-shadow .2s',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = theme.borderHi
        e.target.style.boxShadow   = isDark
          ? `inset 0 2px 4px rgba(0,0,0,0.25), 0 0 0 3px rgba(255,255,255,0.06)`
          : `inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,0,0,0.06)`
      }}
      onBlur={e => {
        e.target.style.borderColor = theme.border
        e.target.style.boxShadow   = isDark
          ? 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)'
      }}
    />
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, children, style = {} }) {
  const { theme, isDark } = useTheme()
  const arrowColor = encodeURIComponent(isDark ? '#999' : '#555')

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...makeGlass(isDark, 0.05, 16),
        border:           `1px solid ${theme.border}`,
        borderRadius:     10,
        color:            theme.text,
        fontFamily:       theme.mono,
        fontSize:         13,
        padding:          '9px 32px 9px 13px',
        outline:          'none',
        width:            '100%',
        cursor:           'pointer',
        boxShadow:        isDark
          ? 'inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 2px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)',
        transition:       'border-color .2s, box-shadow .2s',
        appearance:       'none',
        backgroundImage:  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${arrowColor}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'right 12px center',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = theme.borderHi
      }}
      onBlur={e => {
        e.target.style.borderColor = theme.border
      }}
    >
      {children}
    </select>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color }) {
  const { theme, isDark } = useTheme()
  const c = color || theme.accent
  return (
    <div style={{
      width:        size,
      height:       size,
      border:       `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      borderTopColor:   c,
      borderRightColor: c + '60',
      borderRadius: '50%',
      animation:    'spin 0.8s linear infinite',
      flexShrink:   0,
    }} />
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  const { theme } = useTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{
        fontFamily:    theme.display,
        fontWeight:    700,
        fontSize:      15,
        color:         theme.text,
        letterSpacing: '0.02em',
        margin:        0,
      }}>
        {title}
      </h2>
      {action}
    </div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, color, delay = 0 }) {
  const { theme } = useTheme()
  const c = color || theme.accent
  return (
    <Card style={{ animation: `fadeUp .4s ${delay}s both` }}>
      <div style={{
        fontSize:      10,
        color:         theme.muted,
        fontFamily:    theme.mono,
        marginBottom:  8,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   22,
        fontFamily: theme.display,
        fontWeight: 700,
        color:      c,
        marginBottom: 4,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono }}>
          {sub}
        </div>
      )}
    </Card>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '◌', message }) {
  const { theme } = useTheme()
  return (
    <div style={{
      textAlign:  'center',
      color:      theme.muted,
      fontFamily: theme.mono,
      fontSize:   12,
      padding:    '40px 0',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>
        {icon}
      </div>
      {message}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, height = 6 }) {
  const { theme, isDark } = useTheme()
  const c   = color || theme.accent
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = pct >= 100 ? theme.green : pct > 80 ? theme.yellow : c

  return (
    <div style={{
      ...makeGlass(isDark, 0.04, 8),
      border:       `1px solid ${theme.border}`,
      borderRadius: height,
      height,
      overflow:     'hidden',
    }}>
      <div style={{
        width:      `${pct}%`,
        height:     '100%',
        background: `linear-gradient(90deg, ${barColor}bb, ${barColor})`,
        borderRadius: height,
        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
        position:   'relative',
        overflow:   'hidden',
      }}>
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)',
          animation:  'shimmer 2s infinite',
        }} />
      </div>
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  const { theme } = useTheme()
  return (
    <div style={{
      fontSize:      11,
      color:         theme.muted,
      fontFamily:    theme.mono,
      marginBottom:  4,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {children}
    </div>
  )
}

// ── FormRow ───────────────────────────────────────────────────────────────────
export function FormRow({ children, cols = 'repeat(auto-fit, minmax(140px, 1fr))', gap = 10 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
      {children}
    </div>
  )
}