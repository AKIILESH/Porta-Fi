import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useTransactions, useAddTransaction, useDeleteTransaction } from '../../hooks/useTransactions.js'
import { useBudgetLimits, useSetBudgetLimit } from '../../hooks/useBudgetLimits.js'
import { useCashAccounts } from '../../hooks/useCashAccounts.js'
import { Spinner, EmptyState } from '../shared/ui.jsx'
import { inr, inrCompact, fmtDate, todayISO, currentMonth } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

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
  mono:      "'DM Mono','Courier New',monospace",
  display:   "'Cormorant Garamond',Georgia,serif",
  sans:      "'DM Sans',system-ui,sans-serif",
}

const CATEGORIES    = ['Housing','Food','Transport','Entertainment','Health','Shopping','Utilities','Education','Insurance','Other']
const INCOME_CATS   = ['Salary','Freelance','Business','Investment Returns','Other Income']
const PIE_COLORS    = [G.gold,'#4f8eff','#d4a842','#9b5cff',G.red,'#ff9f43','#54a0ff','#48dbfb','#ff6b81','#a29bfe']

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function BudgetSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ height: 80, background: G.card, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 120, background: G.card, animation: 'pulse 1.5s infinite' }} />)}
      </div>
    </div>
  )
}

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

const GInput = ({ value, onChange, type = 'text', placeholder, min, step, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} type={type}
    placeholder={placeholder} min={min} step={step}
    style={{ ...fieldBase, ...style }}
    onFocus={e => e.target.style.borderColor = G.gold}
    onBlur={e => e.target.style.borderColor = G.border}
  />
)

const GSelect = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...fieldBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', ...style }}>
    {children}
  </select>
)

const GCard = ({ children, style = {} }) => (
  <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: 24, position: 'relative', overflow: 'hidden', ...style }}>
    {children}
  </div>
)

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub, accent }) {
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

// ── Type Toggle ───────────────────────────────────────────────────────────────
function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${G.border}`, width: 'fit-content', marginBottom: 20 }}>
      {[['expense','▼ Expense'], ['income','▲ Income']].map(([t, label]) => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '8px 22px', border: 'none',
          background: value === t ? (t === 'income' ? `${G.green}18` : `${G.red}18`) : 'transparent',
          color: value === t ? (t === 'income' ? G.green : G.red) : G.muted,
          fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
          borderBottom: value === t ? `1px solid ${t === 'income' ? G.green : G.red}` : '1px solid transparent',
          borderRight: t === 'expense' ? `1px solid ${G.border}` : 'none',
        }}>{label}</button>
      ))}
    </div>
  )
}

// ── Add Transaction Form ──────────────────────────────────────────────────────
function AddTransactionForm() {
  const { userId } = useFinance()
  const addTransaction = useAddTransaction(userId)
  const { data: cashAccounts = [] } = useCashAccounts(userId)
  
  const [type, setType]   = useState('expense')
  const [form, setForm]   = useState({ 
    date: todayISO(), 
    description: '', 
    amount: '', 
    category: 'Food', 
    account_id: cashAccounts[0]?.id || '' 
  })
  const [err, setErr]     = useState('')

  const set  = k => v => setForm(f => ({ ...f, [k]: v }))
  const cats = type === 'income' ? INCOME_CATS : CATEGORIES

  const handleTypeChange = t => {
    setType(t)
    setForm(f => ({ ...f, category: t === 'income' ? INCOME_CATS[0] : CATEGORIES[0] }))
  }

  const submit = async () => {
    if (!form.description || !form.amount) { setErr('Description and amount are required'); return }
    if (!form.account_id) { setErr('Please select an account'); return }
    
    setErr('')
    try {
      const amount = type === 'income' ? Math.abs(+form.amount) : -Math.abs(+form.amount)
      await addTransaction.mutateAsync({ ...form, amount, category: form.category || cats[0] })
      setForm({ 
        date: todayISO(), 
        description: '', 
        amount: '', 
        category: cats[0], 
        account_id: cashAccounts[0]?.id || '' 
      })
    } catch (e) { 
      setErr(e.message) 
    }
  }

  const accentColor = type === 'income' ? G.green : G.red
  const isPending = addTransaction.isPending

  return (
    <GCard style={{ borderLeft: `2px solid ${accentColor}` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${accentColor}50, transparent)` }} />
      <SL>Add Transaction</SL>
      <TypeToggle value={type} onChange={handleTypeChange} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><FL>Date</FL><GInput value={form.date} onChange={set('date')} type="date" /></div>
        <div>
          <FL>Category</FL>
          <GSelect value={form.category} onChange={set('category')}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </GSelect>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FL>From Account</FL>
        <GSelect value={form.account_id} onChange={set('account_id')}>
          <option value="">— Select Account —</option>
          {cashAccounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} · {inr(acc.balance)}</option>
          ))}
        </GSelect>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FL required>Description</FL>
        <GInput value={form.description} onChange={set('description')} placeholder="e.g. Zepto grocery order" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <FL required>Amount (₹)</FL>
        <GInput value={form.amount} onChange={set('amount')} type="number" min="0" step="0.01" placeholder="0.00" />
      </div>

      {form.description && form.amount && (
        <div style={{ padding: '9px 14px', background: G.ink, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.gold}`, marginBottom: 14, fontFamily: G.mono, fontSize: '0.62rem', color: G.muted }}>
          {type === 'income' ? '+' : '−'}&nbsp;
          <span style={{ color: G.goldLight, fontFamily: G.display, fontSize: '1rem' }}>{inr(Math.abs(+form.amount))}</span>
          &nbsp;·&nbsp;{form.description}
        </div>
      )}

      {err && (
        <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: G.red, padding: '8px 12px', background: `${G.red}12`, border: `1px solid ${G.red}28`, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <button onClick={submit} disabled={isPending} style={{
        width: '100%', background: accentColor, color: G.ink,
        border: 'none', padding: '11px', cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: G.mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s, box-shadow 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
        onMouseEnter={e => { if (!isPending) e.currentTarget.style.boxShadow = `0 0 24px ${accentColor}40` }}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {isPending ? <Spinner size={13} /> : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
      </button>
    </GCard>
  )
}

// ── Spending Chart ────────────────────────────────────────────────────────────
function SpendingChart({ spendByCategory }) {
  const data = Object.entries(spendByCategory || {}).map(([name, value]) => ({ name, value }))
  if (!data.length) return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>
      No spending data this month yet
    </div>
  )

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const total = data.reduce((s, i) => s + i.value, 0)
    return (
      <div style={{ background: G.card, border: `1px solid ${G.borderHi}`, padding: '10px 14px' }}>
        <div style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted, marginBottom: 3 }}>{d.name}</div>
        <div style={{ fontFamily: G.display, fontSize: '1.05rem', color: G.goldLight }}>{inr(d.value)}</div>
        <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted }}>{((d.value / total) * 100).toFixed(1)}%</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={82} dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: G.border, strokeWidth: 1 }}
          style={{ fontFamily: G.mono, fontSize: '0.52rem', fill: G.muted }}
        >
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Budget Limits ─────────────────────────────────────────────────────────────
// ── Budget Limits ─────────────────────────────────────────────────────────────
function BudgetLimits() {
  const { userId } = useFinance()
  const month = currentMonth()
  
  const { 
    data: budgetLimits = [], 
    isLoading,
    error 
  } = useBudgetLimits(userId, month)
  
  const setBudgetLimit = useSetBudgetLimit(userId)
  
  const { spendByCategory = {} } = useFinance()
  
  const [form, setForm]   = useState({ category: CATEGORIES[0], limit: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.limit) return
    setSaving(true)
    try { 
      await setBudgetLimit.mutateAsync({ category: form.category, limit: Number(form.limit) })
      setForm(f => ({ ...f, limit: '' }))
    } catch (e) { 
      console.error(e) 
    } finally { 
      setSaving(false) 
    }
  }

  if (isLoading) {
    return (
      <GCard>
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spinner size={20} />
        </div>
      </GCard>
    )
  }

  if (error) {
    return (
      <GCard>
        <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.red }}>
          Error loading budget limits: {error.message}
        </div>
      </GCard>
    )
  }

  // Ensure budgetLimits is an array
  const limits = Array.isArray(budgetLimits) ? budgetLimits : []

  return (
    <GCard>
      <SL>Monthly Budget Limits</SL>

      {/* Set limit row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <FL>Category</FL>
          <GSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </GSelect>
        </div>
        <div style={{ width: 140 }}>
          <FL>Monthly Limit (₹)</FL>
          <GInput value={form.limit} onChange={v => setForm(f => ({ ...f, limit: v }))} type="number" placeholder="e.g. 10000" />
        </div>
        <button onClick={submit} disabled={saving || setBudgetLimit?.isPending} style={{
          background: G.gold, color: G.ink, border: 'none',
          padding: '9px 20px', cursor: (saving || setBudgetLimit?.isPending) ? 'not-allowed' : 'pointer',
          fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', opacity: (saving || setBudgetLimit?.isPending) ? 0.6 : 1, transition: 'opacity 0.2s', flexShrink: 0,
        }}>
          {(saving || setBudgetLimit?.isPending) ? <Spinner size={12} /> : 'Set'}
        </button>
      </div>

      {limits.length === 0 && (
        <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>No budget limits set yet</div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {limits.map(b => {
          // Ensure b exists and has required properties
          if (!b || !b.category) return null
          
          const spent = spendByCategory?.[b.category] || 0
          const over  = spent > (b.monthly_limit || 0)
          const prog  = b.monthly_limit > 0 ? Math.min(100, (spent / b.monthly_limit) * 100) : 0
          const barColor = over ? G.red : prog > 80 ? G.goldLight : G.green

          return (
            <div key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <span style={{ fontFamily: G.sans, fontSize: '0.83rem', color: G.text }}>{b.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {over && <span style={{ fontFamily: G.mono, fontSize: '0.55rem', letterSpacing: '0.12em', color: G.red, border: `1px solid ${G.red}40`, padding: '2px 6px' }}>OVER</span>}
                  <span style={{ fontFamily: G.mono, fontSize: '0.65rem', color: over ? G.red : G.muted }}>
                    <span style={{ color: over ? G.red : G.text }}>{inr(spent)}</span> / {inr(b.monthly_limit || 0)}
                  </span>
                </div>
              </div>
              {/* Custom progress bar */}
              <div style={{ height: 3, background: G.border, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${prog}%`, background: barColor, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ fontFamily: G.mono, fontSize: '0.52rem', color: barColor }}>{prog.toFixed(0)}% used</span>
              </div>
            </div>
          )
        })}
      </div>
    </GCard>
  )
}

// ── Transaction List ──────────────────────────────────────────────────────────
function TransactionList() {
  const { userId } = useFinance()
  const month = currentMonth()
  
  const { 
    data: transactionsData, 
    isLoading 
  } = useTransactions(userId, month)
  
  const deleteTransaction = useDeleteTransaction(userId)
  const { data: cashAccounts = [] } = useCashAccounts(userId)
  
  const transactions = transactionsData?.data || []
  const getAccName = id => cashAccounts.find(a => a.id === id)?.name || '—'

  const handleDelete = async (id, transaction) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await deleteTransaction.mutateAsync({ id, transaction })
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <GCard>
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spinner />
        </div>
      </GCard>
    )
  }

  return (
    <GCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <SL>This Month's Transactions</SL>
        <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, letterSpacing: '0.1em' }}>{transactions.length} entries</span>
      </div>

      {transactions.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>No transactions this month</div>
      )}

      {transactions.map((t, i) => {
        const [hov, setHov] = useState(false)
        const isCredit = t.amount >= 0
        return (
          <div key={t.id}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 12px',
              borderBottom: i < transactions.length - 1 ? `1px solid ${G.border}` : 'none',
              background: hov ? G.goldGlow : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: isCredit ? `${G.green}14` : `${G.red}14`,
                border: `1px solid ${isCredit ? G.green : G.red}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: G.mono, fontSize: '0.75rem',
                color: isCredit ? G.green : G.red,
              }}>{isCredit ? '▲' : '▼'}</div>
              <div>
                <div style={{ fontFamily: G.sans, fontSize: '0.83rem', color: G.text, marginBottom: 2 }}>{t.description}</div>
                <div style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.muted, letterSpacing: '0.07em' }}>
                  {t.category} · {fmtDate(t.date)} · {getAccName(t.account_id)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: G.display, fontSize: '1.05rem', color: isCredit ? G.green : G.red, textAlign: 'right' }}>
                {isCredit ? '+' : ''}{inr(t.amount)}
              </div>
              <button 
                onClick={() => handleDelete(t.id, t)} 
                disabled={deleteTransaction.isPending}
                style={{
                  background: 'transparent', border: `1px solid transparent`,
                  color: deleteTransaction.isPending ? G.muted : G.muted,
                  padding: '5px 7px', cursor: deleteTransaction.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: G.mono, fontSize: '0.6rem',
                  opacity: deleteTransaction.isPending ? 0.5 : 1,
                }}
                onMouseEnter={e => { 
                  if (!deleteTransaction.isPending) {
                    e.currentTarget.style.color = G.red; 
                    e.currentTarget.style.borderColor = `${G.red}40`; 
                    e.currentTarget.style.background = `${G.red}10`;
                  }
                }}
                onMouseLeave={e => { 
                  if (!deleteTransaction.isPending) {
                    e.currentTarget.style.color = G.muted; 
                    e.currentTarget.style.borderColor = 'transparent'; 
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {deleteTransaction.isPending ? <Spinner size={10} /> : '✕'}
              </button>
            </div>
          </div>
        )
      })}
    </GCard>
  )
}

// ── Budget Page ───────────────────────────────────────────────────────────────
export default function Budget() {
  const { userId } = useFinance()
  const month = currentMonth()
  
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading 
  } = useTransactions(userId, month)
  
  const transactions = transactionsData?.data || []
  
  // Calculate monthly aggregates
  const monthlyIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0)
    
  const monthlyExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    
  const spendByCategory = {}
  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      spendByCategory[t.category] = (spendByCategory[t.category] || 0) + Math.abs(Number(t.amount))
    })

  const savings = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0

  if (transactionsLoading) {
    return <BudgetSkeleton />
  }

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: G.sans }}>

      {/* Header */}
      <div style={{ paddingBottom: 20, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ width: 20, height: 1, background: G.gold, display: 'inline-block' }} />
          <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.gold }}>PortaFi</span>
        </div>
        <h1 style={{ fontFamily: G.display, fontSize: '2rem', fontWeight: 300, color: G.text, margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>
          Budget & Transactions
        </h1>
        <p style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted, marginTop: 6, letterSpacing: '0.1em' }}>
          Income · Expenses · Monthly limits
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <KpiTile label="Income This Month"   value={inr(monthlyIncome)}   accent={G.green} sub="Total inflows" />
        <KpiTile label="Expenses This Month" value={inr(monthlyExpenses)} accent={G.red}   sub="Total outflows" />
        <KpiTile label="Net Savings"         value={inr(savings)}         accent={savings >= 0 ? G.blue : G.red} sub={`${savingsRate.toFixed(1)}% savings rate`} />
      </div>

      {/* Form + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AddTransactionForm />
        <GCard>
          <SL>Spending by Category</SL>
          <SpendingChart spendByCategory={spendByCategory} />
        </GCard>
      </div>

      {/* Budget limits */}
      <BudgetLimits />

      {/* Transaction list */}
      <TransactionList />
    </div>
  )
}