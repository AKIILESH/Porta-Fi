import theme from '../../lib/theme.js'

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '20px 22px',
        transition: 'border-color .2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = theme.accent + '60')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = theme.border)}
    >
      {children}
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ color = theme.accent, children, style = {} }) {
  return (
    <span style={{
      background: color + '18',
      color,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontFamily: theme.mono,
      fontWeight: 500,
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
        background: ghost ? 'transparent' : color + '18',
        color: ghost ? theme.muted : color,
        border: `1px solid ${ghost ? theme.border : color + '50'}`,
        borderRadius: 8,
        padding: sm ? '5px 12px' : '9px 18px',
        fontFamily: theme.mono,
        fontSize: sm ? 11 : 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all .18s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = color + '30')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = ghost ? 'transparent' : color + '18')}
    >
      {children}
    </button>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────
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
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        color: theme.text,
        fontFamily: theme.mono,
        fontSize: 13,
        padding: '8px 12px',
        outline: 'none',
        width: '100%',
        ...style,
      }}
      onFocus={e => (e.target.style.borderColor = theme.accent + '80')}
      onBlur={e => (e.target.style.borderColor = theme.border)}
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
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        color: theme.text,
        fontFamily: theme.mono,
        fontSize: 13,
        padding: '8px 12px',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = theme.accent }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${theme.border}`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── SectionHeader ──────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontFamily: theme.head, fontWeight: 700, fontSize: 15, color: theme.text }}>{title}</h2>
      {action}
    </div>
  )
}

// ── KpiCard ────────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, color = theme.accent, delay = 0 }) {
  return (
    <Card style={{ animation: `fadeUp .4s ${delay}s both` }}>
      <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: theme.head, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono }}>{sub}</div>}
    </Card>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '◌', message }) {
  return (
    <div style={{ textAlign: 'center', color: theme.muted, fontFamily: theme.mono, fontSize: 12, padding: '40px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      {message}
    </div>
  )
}

// ── ProgressBar ─────────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = theme.accent, height = 6 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = pct >= 100 ? theme.accent : pct > 80 ? theme.yellow : color
  return (
    <div style={{ background: theme.bg2, borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: barColor,
        borderRadius: height,
        transition: 'width .5s ease',
      }} />
    </div>
  )
}

// ── Label ──────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </div>
  )
}

// ── FormRow ────────────────────────────────────────────────────────────────────
export function FormRow({ children, cols = 'repeat(auto-fit, minmax(140px, 1fr))', gap = 10 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>
      {children}
    </div>
  )
}
