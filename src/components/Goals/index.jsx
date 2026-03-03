import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal } from '../../hooks/useGoals.js'
import { Spinner } from '../shared/ui.jsx'
import { inr, inrCompact } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import {
  Target, Home, Plane, GraduationCap, Car, Heart, Laptop, Shield,
  TrendingUp, Umbrella, Dumbbell, Music, Globe, Coins, Gift,
  Plus, X, CheckCircle,
} from 'lucide-react'

// ── Gold Tokens ───────────────────────────────────────────────────────────────
const G = {
  ink:       '#09090e',
  surface:   '#0f0e0a',
  card:      '#131109',
  cardHover: '#181610',
  border:    'rgba(201,168,76,0.16)',
  borderHi:  'rgba(201,168,76,0.36)',
  gold:      '#c9a84c',
  goldLight: '#e8c96b',
  goldDim:   'rgba(201,168,76,0.10)',
  goldGlow:  'rgba(201,168,76,0.05)',
  text:      '#f0ebe0',
  muted:     '#6e6558',
  green:     '#5cb87a',
  red:       '#d96b6b',
  blue:      '#4f8eff',
  amber:     '#d4a842',
  mono:      "'DM Mono','Courier New',monospace",
  display:   "'Cormorant Garamond',Georgia,serif",
  sans:      "'DM Sans',system-ui,sans-serif",
}

const ICONS = [
  { name: 'Target',        icon: Target,        emoji: '🎯' },
  { name: 'Home',          icon: Home,          emoji: '🏠' },
  { name: 'Plane',         icon: Plane,         emoji: '✈️' },
  { name: 'GraduationCap', icon: GraduationCap, emoji: '🎓' },
  { name: 'Car',           icon: Car,           emoji: '🚗' },
  { name: 'Heart',         icon: Heart,         emoji: '💍' },
  { name: 'Laptop',        icon: Laptop,        emoji: '💻' },
  { name: 'Shield',        icon: Shield,        emoji: '🛡️' },
  { name: 'TrendingUp',    icon: TrendingUp,    emoji: '📈' },
  { name: 'Umbrella',      icon: Umbrella,      emoji: '🏖️' },
  { name: 'Dumbbell',      icon: Dumbbell,      emoji: '🏋️' },
  { name: 'Music',         icon: Music,         emoji: '🎸' },
  { name: 'Globe',         icon: Globe,         emoji: '🌏' },
  { name: 'Coins',         icon: Coins,         emoji: '💰' },
  { name: 'Gift',          icon: Gift,          emoji: '🎁' },
]

// ── Primitives ────────────────────────────────────────────────────────────────
const FL = ({ children, required }) => (
  <div style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: G.muted, marginBottom: 5 }}>
    {children}{required && <span style={{ color: G.red, marginLeft: 3 }}>*</span>}
  </div>
)

const SL = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{ width: 18, height: 1, background: G.gold, display: 'inline-block' }} />
    <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.gold }}>{children}</span>
  </div>
)

const fieldBase = {
  background: G.surface, border: `1px solid ${G.border}`,
  color: G.text, fontFamily: G.mono, fontSize: '0.73rem',
  padding: '9px 12px', outline: 'none', width: '100%',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}

const GInput = ({ value, onChange, type = 'text', placeholder, min, step, disabled, style: s = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} type={type}
    placeholder={placeholder} min={min} step={step} disabled={disabled}
    style={{ ...fieldBase, ...s, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
    onFocus={e => !disabled && (e.target.style.borderColor = G.gold)}
    onBlur={e => (e.target.style.borderColor = G.border)}
  />
)

const GSelect = ({ value, onChange, children, style: s = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...fieldBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', ...s }}>
    {children}
  </select>
)

function GBar({ value, max, color = G.gold, height = 3 }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height, background: G.border, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${p}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function KpiTile({ label, value, accent, sub }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.55 }} />
      <div style={{ position: 'absolute', top: -40, right: -40, width: 110, height: 110, background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <FL>{label}</FL>
      <div style={{ fontFamily: G.display, fontSize: '1.9rem', fontWeight: 300, color: G.text, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontFamily: G.mono, fontSize: '0.58rem', color: accent }}>{sub}</div>}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <style>{`@keyframes shimmer{0%{opacity:0.4}50%{opacity:0.7}100%{opacity:0.4}}`}</style>
      <div style={{ height: 200, background: G.card, border: `1px solid ${G.border}`, animation: 'shimmer 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 90, background: G.card, border: `1px solid ${G.border}`, animation: 'shimmer 1.5s infinite' }} />)}
      </div>
    </div>
  )
}

// ── Emergency Fund Card ───────────────────────────────────────────────────────
function EmergencyFundCard({ emergencyFund, onUpdate, isPending }) {
  const { monthlyExpenses, cashBalance } = useFinance()
  const [editing, setEditing]   = useState(false)
  const [targetMonths, setTM]   = useState(6)

  const current  = cashBalance || 0
  const target   = monthlyExpenses * targetMonths
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const remaining = Math.max(0, target - current)
  const achieved  = current >= target
  const coverage  = monthlyExpenses > 0 ? (current / monthlyExpenses).toFixed(1) : '0'
  const accent    = achieved ? G.green : G.amber

  const handleSave = async () => {
    if (emergencyFund) await onUpdate({ target, saved: current })
    setEditing(false)
  }

  return (
    <div style={{ background: G.card, border: `1px solid ${achieved ? `${G.green}40` : G.border}`, borderLeft: `2px solid ${accent}`, padding: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${accent}50, transparent)` }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: `${accent}14`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
            <Shield size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ width: 14, height: 1, background: accent, display: 'inline-block' }} />
              <span style={{ fontFamily: G.mono, fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>Emergency Fund</span>
            </div>
            <div style={{ fontFamily: G.display, fontSize: '1.45rem', fontWeight: 300, color: G.text, lineHeight: 1 }}>
              {achieved ? `Fully funded · ${coverage} months` : `${inr(remaining)} to reach ${targetMonths} months`}
            </div>
          </div>
        </div>
        {!editing && !isPending && (
          <button onClick={() => setEditing(true)} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '7px 16px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
          >Update Target</button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <FL>Target Months</FL>
            <GSelect value={targetMonths} onChange={v => setTM(Number(v))}>
              <option value={3}>3 months — Minimum</option>
              <option value={6}>6 months — Recommended</option>
              <option value={9}>9 months — Conservative</option>
              <option value={12}>12 months — Very Safe</option>
            </GSelect>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={isPending} style={{ background: G.gold, color: G.ink, border: 'none', padding: '9px 22px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPending ? <Spinner size={12} /> : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '9px 20px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
            >Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontFamily: G.display, fontSize: '2.2rem', fontWeight: 300, color: G.text, lineHeight: 1 }}>{inr(current)}</div>
              <div style={{ fontFamily: G.mono, fontSize: '0.65rem', color: G.muted }}>of <span style={{ color: G.text }}>{inr(target)}</span></div>
            </div>
            <GBar value={current} max={target} color={accent} height={4} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: G.mono, fontSize: '0.57rem', color: accent }}>{progress.toFixed(1)}% funded</span>
              <span style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.muted }}>{targetMonths}-month target</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: G.border }}>
            {[
              { label: 'Status',       value: achieved ? 'Funded' : `${progress.toFixed(0)}%`, color: accent },
              { label: 'Monthly Need', value: inr(monthlyExpenses),                            color: G.text },
              { label: 'Coverage',     value: `${coverage} months`,                            color: G.text },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: G.surface, padding: '14px 16px' }}>
                <FL>{label}</FL>
                <div style={{ fontFamily: G.display, fontSize: '1.1rem', color }}>{value}</div>
              </div>
            ))}
          </div>

          {!achieved && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              {[['Add from Cash','/cash'],['Adjust Budget','/budget']].map(([label, href]) => (
                <button key={label} onClick={() => window.location.href = href} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '7px 16px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.gold }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
                >{label}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Add Goal Form ─────────────────────────────────────────────────────────────
function AddGoalForm({ onDone, userId }) {
  const addGoal = useAddGoal(userId)
  const [form, setForm] = useState({ name: '', icon: '🎯', target: '', saved: '', deadline: '' })
  const [err, setErr]   = useState('')
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.target) { setErr('Name and target are required'); return }
    setErr('')
    try {
      await addGoal.mutateAsync({ name: form.name, icon: form.icon, target: +form.target, saved: +form.saved || 0, deadline: form.deadline || null })
      onDone()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.gold}`, padding: 24, marginBottom: 4, position: 'relative', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${G.gold}50, transparent)` }} />
      <SL>New Goal</SL>

      <div style={{ marginBottom: 16 }}>
        <FL>Choose Icon</FL>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ICONS.map(ic => {
            const active = form.icon === ic.emoji
            const Icon   = ic.icon
            return (
              <button key={ic.name} onClick={() => set('icon')(ic.emoji)} style={{ width: 38, height: 38, background: active ? G.goldDim : 'transparent', border: `1px solid ${active ? G.gold : G.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? G.gold : G.muted, transition: 'all 0.18s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = G.borderHi; e.currentTarget.style.color = G.text } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted } }}
              >
                <Icon size={15} strokeWidth={1.4} />
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div><FL required>Goal Name</FL><GInput value={form.name} onChange={set('name')} placeholder="e.g. House Down Payment" /></div>
        <div><FL required>Target (₹)</FL><GInput value={form.target} onChange={set('target')} type="number" min="0" placeholder="500000" /></div>
        <div><FL>Already Saved (₹)</FL><GInput value={form.saved} onChange={set('saved')} type="number" min="0" placeholder="0" /></div>
        <div><FL>Deadline</FL><GInput value={form.deadline} onChange={set('deadline')} type="date" /></div>
      </div>

      {err && <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: G.red, padding: '8px 12px', background: `${G.red}12`, border: `1px solid ${G.red}28`, marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={submit} disabled={addGoal.isPending} style={{ background: G.gold, color: G.ink, border: 'none', padding: '10px 24px', cursor: addGoal.isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: addGoal.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          {addGoal.isPending ? <Spinner size={12} /> : <><Plus size={13} /> Add Goal</>}
        </button>
        <button onClick={onDone} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '10px 20px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
        >Cancel</button>
      </div>
    </div>
  )
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal }) {
  const { userId }      = useFinance()
  const updateGoal      = useUpdateGoal(userId)
  const deleteGoal      = useDeleteGoal(userId)
  const [depositing, setDepositing] = useState(false)
  const [customAmt, setCustomAmt]   = useState('')
  const [hov, setHov]               = useState(false)

  const progress   = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0
  const remaining  = goal.target - goal.saved
  const done       = progress >= 100
  const daysLeft   = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null
  const accent     = done ? G.green : G.gold
  const barColor   = done ? G.green : progress > 80 ? G.goldLight : G.gold
  const isPending  = updateGoal.isPending || deleteGoal.isPending

  const deposit = async amt => {
    await updateGoal.mutateAsync({ id: goal.id, updates: { saved: Math.min(goal.saved + amt, goal.target) } })
  }
  const handleCustom = async () => {
    if (!customAmt || isNaN(customAmt)) return
    await deposit(Number(customAmt)); setCustomAmt(''); setDepositing(false)
  }
  const handleDelete = async () => {
    if (window.confirm('Delete this goal?')) await deleteGoal.mutateAsync(goal.id)
  }

  const IconComp = ICONS.find(i => i.emoji === goal.icon)?.icon || Target

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? G.cardHover : G.card, border: `1px solid ${done ? `${G.green}40` : hov ? G.borderHi : G.border}`, padding: 24, position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: 'fadeUp 0.4s ease both' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: hov ? 0.7 : 0.35, transition: 'opacity 0.3s' }} />
      <div style={{ position: 'absolute', top: -50, right: -50, width: 140, height: 140, background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: `${accent}14`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
            <IconComp size={16} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: G.sans, fontWeight: 500, fontSize: '0.88rem', color: G.text, marginBottom: 3 }}>{goal.name}</div>
            {daysLeft !== null && (
              <div style={{ fontFamily: G.mono, fontSize: '0.57rem', letterSpacing: '0.08em', color: daysLeft < 30 ? G.amber : G.muted }}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
              </div>
            )}
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleteGoal.isPending} style={{ background: 'transparent', border: `1px solid transparent`, padding: '5px 7px', cursor: 'pointer', color: G.muted, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = G.red; e.currentTarget.style.borderColor = `${G.red}40`; e.currentTarget.style.background = `${G.red}10` }}
          onMouseLeave={e => { e.currentTarget.style.color = G.muted; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
        >
          {deleteGoal.isPending ? <Spinner size={12} /> : <X size={13} />}
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: G.display, fontSize: '1.5rem', fontWeight: 300, color: done ? G.green : G.text }}>{inrCompact(goal.saved)}</div>
          <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: G.muted }}>{inrCompact(goal.target)}</div>
        </div>
        <GBar value={goal.saved} max={goal.target} color={barColor} height={3} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: barColor }}>{progress.toFixed(1)}%</span>
          <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
            {done
              ? <><CheckCircle size={11} color={G.green} /><span style={{ color: G.green }}>Goal reached!</span></>
              : `${inrCompact(remaining)} to go`
            }
          </span>
        </div>
      </div>

      {/* Deposit actions */}
      {!done && (
        depositing ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <GInput value={customAmt} onChange={setCustomAmt} type="number" min="0" placeholder="Enter amount" disabled={isPending} style={{ flex: 1 }} />
            <button onClick={handleCustom} disabled={isPending} style={{ background: G.gold, color: G.ink, border: 'none', padding: '9px 14px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.62rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isPending ? <Spinner size={11} /> : <Plus size={12} />}
            </button>
            <button onClick={() => setDepositing(false)} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '9px 12px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1000, 5000, 10000].map(a => (
              <button key={a} onClick={() => deposit(a)} disabled={isPending} style={{ background: `${G.gold}14`, border: `1px solid ${G.gold}30`, color: G.gold, padding: '6px 12px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.1em', transition: 'all 0.2s', opacity: isPending ? 0.5 : 1 }}
                onMouseEnter={e => { if (!isPending) { e.currentTarget.style.background = G.goldDim; e.currentTarget.style.borderColor = G.gold } }}
                onMouseLeave={e => { e.currentTarget.style.background = `${G.gold}14`; e.currentTarget.style.borderColor = `${G.gold}30` }}
              >+{inrCompact(a)}</button>
            ))}
            <button onClick={() => setDepositing(true)} disabled={isPending} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '6px 12px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.1em', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
            >Custom</button>
          </div>
        )
      )}
    </div>
  )
}

// ── Goals Page ────────────────────────────────────────────────────────────────
export default function Goals() {
  const { userId, monthlyExpenses, cashBalance } = useFinance()
  const { data: goals = [], isLoading, error, refetch } = useGoals(userId)
  const addGoal    = useAddGoal(userId)
  const updateGoal = useUpdateGoal(userId)
  const [adding, setAdding] = useState(false)

  const emergencyFund = goals.find(g => g.name === 'Emergency Fund')
  const otherGoals    = goals.filter(g => g.name !== 'Emergency Fund')
  const totalSaved    = otherGoals.reduce((s, g) => s + Number(g.saved), 0)
  const totalTarget   = otherGoals.reduce((s, g) => s + Number(g.target), 0)
  const doneCount     = otherGoals.filter(g => g.saved >= g.target).length

  const handleEmUpdate = async updates => {
    if (emergencyFund) await updateGoal.mutateAsync({ id: emergencyFund.id, updates })
    else await addGoal.mutateAsync({ name: 'Emergency Fund', icon: '🛡️', target: updates.target || monthlyExpenses * 6, saved: cashBalance || 0, deadline: null })
  }

  if (isLoading) return <Skeleton />

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', background: G.card, border: `1px solid ${G.border}`, fontFamily: G.mono, fontSize: '0.7rem', color: G.red }}>
      Error loading goals: {error.message}
      <button onClick={() => refetch()} style={{ display: 'block', margin: '20px auto 0', background: G.gold, border: 'none', color: G.ink, padding: '8px 20px', fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.15em', cursor: 'pointer' }}>Retry</button>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: G.sans }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ paddingBottom: 20, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ width: 20, height: 1, background: G.gold, display: 'inline-block' }} />
          <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.gold }}>PortaFi</span>
        </div>
        <h1 style={{ fontFamily: G.display, fontSize: '2rem', fontWeight: 300, color: G.text, margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>Goals & Milestones</h1>
        <p style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted, marginTop: 6, letterSpacing: '0.1em' }}>Emergency fund · Savings targets · Life milestones</p>
      </div>

      {/* Emergency Fund */}
      <EmergencyFundCard
        emergencyFund={emergencyFund || { saved: 0, target: monthlyExpenses * 6 }}
        onUpdate={handleEmUpdate}
        isPending={updateGoal.isPending || addGoal.isPending}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <KpiTile label="Active Goals"  value={otherGoals.length}       accent={G.gold}  sub={`${doneCount} completed`} />
        <KpiTile label="Total Saved"   value={inrCompact(totalSaved)}  accent={G.green} sub="Across all goals" />
        <KpiTile label="Total Target"  value={inrCompact(totalTarget)} accent={G.blue}  sub={totalTarget > 0 ? `${((totalSaved / totalTarget) * 100).toFixed(0)}% funded` : 'Set your targets'} />
      </div>

      {/* Add button / form */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: adding ? 16 : 0 }}>
          <button onClick={() => setAdding(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: adding ? 'transparent' : G.gold, color: adding ? G.muted : G.ink, border: `1px solid ${adding ? G.border : G.gold}`, padding: '10px 22px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
            {adding ? <><X size={13} /> Cancel</> : <><Plus size={13} /> New Goal</>}
          </button>
        </div>
        {adding && <AddGoalForm onDone={() => setAdding(false)} userId={userId} />}
      </div>

      {/* Empty state */}
      {otherGoals.length === 0 && !adding ? (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted, border: `1px dashed ${G.border}`, background: G.goldGlow }}>
          <Target size={22} color={G.muted} strokeWidth={1} style={{ display: 'block', margin: '0 auto 12px' }} />
          No goals yet. Create your first savings goal above.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
          {otherGoals.map(g => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  )
}