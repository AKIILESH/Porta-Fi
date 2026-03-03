import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt } from '../../hooks/useDebts.js'
import { Spinner } from '../shared/ui.jsx'
import { inr } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { Plus, X, AlertTriangle } from 'lucide-react'

const G = {
  ink:      '#09090e', surface:  '#0f0e0a', card:     '#131109', cardHover:'#181610',
  border:   'rgba(201,168,76,0.16)', borderHi:'rgba(201,168,76,0.36)',
  gold:     '#c9a84c', goldLight:'#e8c96b', goldDim: 'rgba(201,168,76,0.10)', goldGlow:'rgba(201,168,76,0.05)',
  text:     '#f0ebe0', muted:    '#6e6558', green:   '#5cb87a',
  red:      '#d96b6b', blue:     '#4f8eff', amber:   '#d4a842',
  mono:     "'DM Mono','Courier New',monospace",
  display:  "'Cormorant Garamond',Georgia,serif",
  sans:     "'DM Sans',system-ui,sans-serif",
}

const DEBT_TYPES = [
  { value: 'credit_card',    label: 'Credit Card'    },
  { value: 'home_loan',      label: 'Home Loan'      },
  { value: 'car_loan',       label: 'Car Loan'       },
  { value: 'personal_loan',  label: 'Personal Loan'  },
  { value: 'education_loan', label: 'Education Loan' },
  { value: 'gold_loan',      label: 'Gold Loan'      },
  { value: 'business_loan',  label: 'Business Loan'  },
  { value: 'medical',        label: 'Medical'        },
  { value: 'other',          label: 'Other'          },
]

// ── Primitives ────────────────────────────────────────────────────────────────
const FL = ({ children, required }) => (
  <div style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: G.muted, marginBottom: 5 }}>
    {children}{required && <span style={{ color: G.red, marginLeft: 3 }}>*</span>}
  </div>
)

const fieldBase = {
  background: G.surface, border: `1px solid ${G.border}`,
  color: G.text, fontFamily: G.mono, fontSize: '0.73rem',
  padding: '9px 12px', outline: 'none', width: '100%',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}

const GInput = ({ value, onChange, type='text', placeholder, min, step, disabled, style: s={} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} type={type}
    placeholder={placeholder} min={min} step={step} disabled={disabled}
    style={{ ...fieldBase, ...s, opacity: disabled ? 0.5 : 1 }}
    onFocus={e => !disabled && (e.target.style.borderColor = G.gold)}
    onBlur={e => (e.target.style.borderColor = G.border)}
  />
)

const GSelect = ({ value, onChange, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...fieldBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
    {children}
  </select>
)

const GBar = ({ value, max, color, height=3 }) => {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height, background: G.border, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${p}%`, background: color || G.red, transition: 'width 0.6s ease' }} />
    </div>
  )
}

const KpiTile = ({ label, value, accent, sub }) => (
  <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.55 }} />
    <div style={{ position: 'absolute', top: -40, right: -40, width: 110, height: 110, background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
    <FL>{label}</FL>
    <div style={{ fontFamily: G.display, fontSize: '1.9rem', fontWeight: 300, color: G.text, lineHeight: 1, marginBottom: 6 }}>{value}</div>
    {sub && <div style={{ fontFamily: G.mono, fontSize: '0.58rem', color: accent }}>{sub}</div>}
  </div>
)

const RateBadge = ({ rate }) => {
  const color = rate > 18 ? G.red : rate > 10 ? G.amber : G.green
  return (
    <span style={{ fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.08em', background: `${color}14`, color, padding: '3px 10px', border: `1px solid ${color}30` }}>
      {rate}% p.a.
    </span>
  )
}

const Skeleton = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    <style>{`@keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.7}}`}</style>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: 90, background: G.card, border: `1px solid ${G.border}`, animation: 'shimmer 1.5s infinite' }} />)}
    </div>
    <div style={{ height: 60,  background: G.card, border: `1px solid ${G.border}`, animation: 'shimmer 1.5s infinite' }} />
    <div style={{ height: 200, background: G.card, border: `1px solid ${G.border}`, animation: 'shimmer 1.5s infinite' }} />
  </div>
)

// ── Add Debt Form ─────────────────────────────────────────────────────────────
function AddDebtForm({ onDone }) {
  const { userId } = useFinance()
  const addDebt    = useAddDebt(userId)
  const [form, setForm] = useState({ name:'', type:'personal_loan', balance:'', rate:'', min_payment:'' })
  const [err, setErr]   = useState('')
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.balance || !form.rate) { setErr('Name, balance and rate are required'); return }
    setErr('')
    try {
      await addDebt.mutateAsync({
        name: form.name, type: form.type,
        balance: +form.balance, original_balance: +form.balance,
        rate: +form.rate, min_payment: +form.min_payment || 0,
      })
      onDone()
    } catch(e) { setErr(e.message) }
  }

  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.red}`, padding: 24, marginBottom: 4, position: 'relative', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${G.red}40, transparent)` }} />

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ width: 18, height: 1, background: G.red, display: 'inline-block' }} />
        <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.red }}>Add Debt</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div><FL required>Debt Name</FL><GInput value={form.name} onChange={set('name')} placeholder="e.g. HDFC Home Loan" /></div>
        <div>
          <FL>Type</FL>
          <GSelect value={form.type} onChange={set('type')}>
            {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </GSelect>
        </div>
        <div><FL required>Balance (₹)</FL><GInput value={form.balance} onChange={set('balance')} type="number" min="0" placeholder="500000" /></div>
        <div><FL required>Rate (% p.a.)</FL><GInput value={form.rate} onChange={set('rate')} type="number" step="0.01" min="0" placeholder="8.5" /></div>
        <div><FL>Min EMI (₹)</FL><GInput value={form.min_payment} onChange={set('min_payment')} type="number" min="0" placeholder="5000" /></div>
      </div>

      {/* Live preview */}
      {form.balance && form.rate && (
        <div style={{ padding: '9px 14px', background: G.ink, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.red}`, marginBottom: 14, fontFamily: G.mono, fontSize: '0.62rem', color: G.muted }}>
          Monthly interest:{' '}
          <span style={{ color: G.red, fontFamily: G.display, fontSize: '1rem' }}>
            {inr((+form.balance * +form.rate / 100) / 12)}
          </span>
          {+form.rate > 18 && (
            <span style={{ color: G.red, marginLeft: 16, letterSpacing: '0.08em' }}>⚠ High interest rate</span>
          )}
        </div>
      )}

      {err && <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: G.red, padding: '8px 12px', background: `${G.red}12`, border: `1px solid ${G.red}28`, marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={submit} disabled={addDebt.isPending} style={{ background: G.red, color: '#fff', border: 'none', padding: '10px 24px', cursor: addDebt.isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: addDebt.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.2s' }}>
          {addDebt.isPending ? <Spinner size={12} /> : <><Plus size={13} />Add Debt</>}
        </button>
        <button onClick={onDone} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '10px 20px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
        >Cancel</button>
      </div>
    </div>
  )
}

// ── Debt Card ─────────────────────────────────────────────────────────────────
function DebtCard({ debt, rank }) {
  const { userId }  = useFinance()
  const updateDebt  = useUpdateDebt(userId)
  const deleteDebt  = useDeleteDebt(userId)
  const [paying, setPaying]       = useState(false)
  const [customAmt, setCustomAmt] = useState('')
  const [hov, setHov]             = useState(false)

  const paid          = Math.max(0, debt.original_balance - debt.balance)
  const progress      = debt.original_balance > 0 ? Math.min((paid / debt.original_balance) * 100, 100) : 0
  const monthlyInt    = (Number(debt.balance) * Number(debt.rate) / 100) / 12
  const rateColor     = debt.rate > 18 ? G.red : debt.rate > 10 ? G.amber : G.green
  const isPending     = updateDebt.isPending || deleteDebt.isPending
  const isTopTarget   = rank === 0
  const barColor      = progress > 80 ? G.green : G.gold

  const makePayment = async amt => {
    await updateDebt.mutateAsync({ id: debt.id, updates: { balance: Math.max(0, debt.balance - amt) } })
    setCustomAmt(''); setPaying(false)
  }
  const handleDelete = async () => {
    if (window.confirm('Delete this debt?')) await deleteDebt.mutateAsync(debt.id)
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? G.cardHover : G.card,
        border: `1px solid ${isTopTarget ? `${G.red}40` : hov ? G.borderHi : G.border}`,
        borderLeft: `2px solid ${isTopTarget ? G.red : 'transparent'}`,
        padding: 24, position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s ease', animation: 'fadeUp 0.35s ease both',
      }}
    >
      {/* Top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${rateColor}40, transparent)` }} />
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 140, height: 140, background: `radial-gradient(circle, ${rateColor}06 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Avalanche badge */}
      {isTopTarget && (
        <div style={{ position: 'absolute', top: 14, right: 54, fontFamily: G.mono, fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', background: `${G.red}18`, color: G.red, padding: '2px 8px', border: `1px solid ${G.red}30` }}>
          Avalanche Target
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: G.sans, fontWeight: 500, fontSize: '0.9rem', color: G.text, marginBottom: 5 }}>{debt.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: G.mono, fontSize: '0.57rem', letterSpacing: '0.06em', background: `${G.muted}14`, color: G.muted, padding: '2px 8px', border: `1px solid ${G.muted}18` }}>
              {DEBT_TYPES.find(t => t.value === debt.type)?.label || debt.type}
            </span>
            <RateBadge rate={debt.rate} />
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleteDebt.isPending}
          style={{ background: 'transparent', border: '1px solid transparent', padding: '5px 7px', cursor: 'pointer', color: G.muted, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = G.red; e.currentTarget.style.borderColor = `${G.red}40`; e.currentTarget.style.background = `${G.red}10` }}
          onMouseLeave={e => { e.currentTarget.style.color = G.muted; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
        >
          {deleteDebt.isPending ? <Spinner size={12} /> : <X size={13} />}
        </button>
      </div>

      {/* Balance grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: G.border, marginBottom: 18 }}>
        <div style={{ background: G.surface, padding: '14px 16px' }}>
          <FL>Remaining</FL>
          <div style={{ fontFamily: G.display, fontSize: '1.8rem', fontWeight: 300, color: G.red, lineHeight: 1 }}>{inr(debt.balance)}</div>
        </div>
        <div style={{ background: G.surface, padding: '14px 16px' }}>
          <FL>Original</FL>
          <div style={{ fontFamily: G.display, fontSize: '1.8rem', fontWeight: 300, color: G.muted, lineHeight: 1 }}>{inr(debt.original_balance)}</div>
          <div style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.muted, marginTop: 4 }}>~{inr(monthlyInt)}/mo interest</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <GBar value={paid} max={debt.original_balance} color={barColor} height={3} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.green }}>{progress.toFixed(1)}% paid off</span>
          <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted }}>{inr(debt.balance)} remaining</span>
        </div>
      </div>

      {/* Payment actions */}
      {paying ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GInput value={customAmt} onChange={setCustomAmt} type="number" min="0" placeholder="Amount (₹)" disabled={isPending} style={{ flex: 1 }} />
          <button onClick={() => makePayment(Number(customAmt))} disabled={isPending}
            style={{ background: G.green, color: G.ink, border: 'none', padding: '9px 16px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending ? <Spinner size={11} /> : 'Pay'}
          </button>
          <button onClick={() => setPaying(false)}
            style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '9px 12px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <X size={12} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {debt.min_payment > 0 && (
            <button onClick={() => makePayment(debt.min_payment)} disabled={isPending}
              style={{ background: `${G.blue}14`, border: `1px solid ${G.blue}30`, color: G.blue, padding: '6px 12px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.1em', transition: 'all 0.2s', opacity: isPending ? 0.5 : 1 }}
              onMouseEnter={e => { if (!isPending) { e.currentTarget.style.background = `${G.blue}22`; e.currentTarget.style.borderColor = G.blue }}}
              onMouseLeave={e => { e.currentTarget.style.background = `${G.blue}14`; e.currentTarget.style.borderColor = `${G.blue}30` }}
            >EMI {inr(debt.min_payment)}</button>
          )}
          {[5000, 10000].map(a => (
            <button key={a} onClick={() => makePayment(a)} disabled={isPending}
              style={{ background: `${G.gold}14`, border: `1px solid ${G.gold}30`, color: G.gold, padding: '6px 12px', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.1em', transition: 'all 0.2s', opacity: isPending ? 0.5 : 1 }}
              onMouseEnter={e => { if (!isPending) { e.currentTarget.style.background = `${G.gold}20`; e.currentTarget.style.borderColor = G.gold }}}
              onMouseLeave={e => { e.currentTarget.style.background = `${G.gold}14`; e.currentTarget.style.borderColor = `${G.gold}30` }}
            >+{inr(a)}</button>
          ))}
          <button onClick={() => setPaying(true)} disabled={isPending}
            style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '6px 12px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.1em', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
          >Custom</button>
        </div>
      )}
    </div>
  )
}

// ── Debt Page ─────────────────────────────────────────────────────────────────
export default function Debt() {
  const { userId } = useFinance()
  const { data: debts = [], isLoading, error, refetch } = useDebts(userId)
  const [adding, setAdding] = useState(false)

  if (isLoading) return <Skeleton />

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', background: G.card, border: `1px solid ${G.border}`, fontFamily: G.mono, fontSize: '0.7rem', color: G.red }}>
      Error loading debts: {error.message}
      <button onClick={() => refetch()} style={{ display: 'block', margin: '20px auto 0', background: G.red, border: 'none', color: '#fff', padding: '8px 20px', fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.15em', cursor: 'pointer' }}>Retry</button>
    </div>
  )

  const totalDebt     = debts.reduce((s, d) => s + Number(d.balance), 0)
  const monthlyMin    = debts.reduce((s, d) => s + Number(d.min_payment || 0), 0)
  const totalInterest = debts.reduce((s, d) => s + (d.balance * d.rate / 100) / 12, 0)
  const highestRate   = debts.reduce((h, d) => !h || d.rate > h.rate ? d : h, null)
  const sorted        = [...debts].sort((a, b) => b.rate - a.rate)

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: G.sans }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Page header */}
      <div style={{ paddingBottom: 20, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ width: 20, height: 1, background: G.red, display: 'inline-block' }} />
          <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.red }}>PortaFi</span>
        </div>
        <h1 style={{ fontFamily: G.display, fontSize: '2rem', fontWeight: 300, color: G.text, margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>Debt Tracker</h1>
        <p style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted, marginTop: 6, letterSpacing: '0.1em' }}>Loans · Credit cards · EMIs · Avalanche strategy</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KpiTile label="Total Debt"       value={inr(totalDebt)}     accent={G.red}   sub={`${debts.length} active debts`} />
        <KpiTile label="Monthly EMIs"     value={inr(monthlyMin)}    accent={G.amber} sub="Minimum commitments" />
        <KpiTile label="Monthly Interest" value={inr(totalInterest)} accent={G.red}   sub="Cost of debt this month" />
        <KpiTile label="Highest Rate"     value={highestRate ? `${highestRate.rate}%` : '—'} accent={G.red} sub={highestRate?.name || 'No debts'} />
      </div>

      {/* Avalanche tip */}
      {debts.length > 1 && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.amber}`, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={14} color={G.amber} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: G.muted, lineHeight: 1.7 }}>
            <span style={{ color: G.goldLight, letterSpacing: '0.08em' }}>Avalanche strategy</span>
            {' — '}Pay minimums on all debts, then direct extra toward{' '}
            <span style={{ color: G.red }}>{sorted[0]?.name} ({sorted[0]?.rate}% APR)</span>
            {' '}first — minimises total interest paid.
          </div>
        </div>
      )}

      {/* Add button / form */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: adding ? 16 : 0 }}>
          <button onClick={() => setAdding(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: adding ? 'transparent' : G.red, color: adding ? G.muted : '#fff', border: `1px solid ${adding ? G.border : G.red}`, padding: '10px 22px', cursor: 'pointer', fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
            {adding ? <><X size={13} />Cancel</> : <><Plus size={13} />Add Debt</>}
          </button>
        </div>
        {adding && <AddDebtForm onDone={() => setAdding(false)} />}
      </div>

      {/* Empty state */}
      {debts.length === 0 && !adding && (
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted, border: `1px dashed ${G.border}`, background: G.goldGlow }}>
          No debts tracked. Add your loans and credit cards above.
        </div>
      )}

      {/* Debt cards — avalanche order */}
      <div style={{ display: 'grid', gap: 14 }}>
        {sorted.map((d, i) => <DebtCard key={d.id} debt={d} rank={i} />)}
      </div>
    </div>
  )
}