import theme from '../../lib/theme.js'

// ── Shared glass mixin ────────────────────────────────────────────────────────
const glass = (opacity = 0.04, blur = 20) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
})

const glassInset = `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12)`

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        ...glass(0.04, 24),
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: `${glassInset}, 0 8px 32px rgba(0,0,0,0.4)`,
        transition: 'border-color .25s, box-shadow .25s, background .25s',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={e => {
        if (!onClick) return
        e.currentTarget.style.borderColor = 'rgba(0,212,255,0.30)'
        e.currentTarget.style.boxShadow = `${glassInset}, 0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(0,212,255,0.08)`
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={e => {
        if (!onClick) return
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.boxShadow = `${glassInset}, 0 8px 32px rgba(0,0,0,0.4)`
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      {/* Top shine streak */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = theme.accent, children, style = {} }) {
  return (
    <span style={{
      ...glass(0.06, 12),
      color,
      border: `1px solid ${color}35`,
      borderRadius: 8,
      padding: '2px 9px',
      fontSize: 11,
      fontFamily: theme.mono,
      fontWeight: 500,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 8px ${color}18`,
      display: 'inline-block',
      ...style,
    }}>
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, color = theme.accent, ghost = false, style = {}, disabled = false, sm = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...glass(ghost ? 0.02 : 0.08, 16),
        color: ghost ? theme.muted : color,
        border: `1px solid ${ghost ? 'rgba(255,255,255,0.08)' : color + '40'}`,
        borderRadius: 10,
        padding: sm ? '5px 13px' : '9px 20px',
        fontFamily: theme.mono,
        fontSize: sm ? 11 : 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all .2s',
        whiteSpace: 'nowrap',
        boxShadow: ghost ? 'none' : `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 16px ${color}14`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = ghost ? 'rgba(255,255,255,0.05)' : `rgba(255,255,255,0.13)`
        e.currentTarget.style.borderColor = ghost ? 'rgba(255,255,255,0.15)' : color + '70'
        e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 20px ${color}28`
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = ghost ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = ghost ? 'rgba(255,255,255,0.08)' : color + '40'
        e.currentTarget.style.boxShadow = ghost ? 'none' : `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 16px ${color}14`
      }}
    >
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', style = {}, name, min, step, required }) {
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
        ...glass(0.05, 16),
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: 10,
        color: theme.text,
        fontFamily: theme.mono,
        fontSize: 13,
        padding: '9px 13px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition: 'border-color .2s, box-shadow .2s',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(0,212,255,0.45)'
        e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.25), 0 0 0 3px rgba(0,212,255,0.08), 0 0 16px rgba(0,212,255,0.10)`
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.09)'
        e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
      }}
    />
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...glass(0.05, 16),
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: 10,
        color: theme.text,
        fontFamily: theme.mono,
        fontSize: 13,
        padding: '9px 13px',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition: 'border-color .2s, box-shadow .2s',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7fa5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(0,212,255,0.45)'
        e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.25), 0 0 0 3px rgba(0,212,255,0.08)`
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.09)'
        e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)`
      }}
    >
      {children}
    </select>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = theme.accent }) {
  return (
    <div style={{
      width: size, height: size,
      border: `1.5px solid rgba(255,255,255,0.08)`,
      borderTopColor: color,
      borderRightColor: color + '60',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
      boxShadow: `0 0 8px ${color}40`,
    }} />
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{
        fontFamily: theme.head,
        fontWeight: 700,
        fontSize: 15,
        color: theme.text,
        letterSpacing: '0.02em',
      }}>
        {title}
      </h2>
      {action}
    </div>
  )
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, color = theme.accent, delay = 0 }) {
  return (
    <Card style={{ animation: `fadeUp .4s ${delay}s both` }}>
      <div style={{
        fontSize: 10, color: theme.muted, fontFamily: theme.mono,
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontFamily: theme.head, fontWeight: 700, color,
        marginBottom: 4, textShadow: `0 0 20px ${color}50`,
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
  return (
    <div style={{
      textAlign: 'center', color: theme.muted,
      fontFamily: theme.mono, fontSize: 12, padding: '40px 0',
    }}>
      <div style={{
        fontSize: 32, marginBottom: 12, opacity: 0.25,
        filter: 'blur(0.5px)',
      }}>
        {icon}
      </div>
      {message}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = theme.accent, height = 6 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = pct >= 100 ? theme.accent : pct > 80 ? theme.yellow : color
  return (
    <div style={{
      ...glass(0.04, 8),
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: height,
      height,
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${barColor}bb, ${barColor})`,
        borderRadius: height,
        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
        boxShadow: `0 0 10px ${barColor}60`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Shimmer */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
          animation: 'shimmer 2s infinite',
        }} />
      </div>
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, color: theme.muted, fontFamily: theme.mono,
      marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
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