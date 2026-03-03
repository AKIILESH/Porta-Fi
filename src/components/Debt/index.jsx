import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { Card, Btn, Input, Select, KpiCard, SectionHeader, EmptyState, Badge, ProgressBar, Spinner } from '../shared/ui.jsx'
import { inr } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'

const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'home_loan', label: 'Home Loan' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'education_loan', label: 'Education Loan' },
  { value: 'gold_loan', label: 'Gold Loan' },
  { value: 'business_loan', label: 'Business Loan' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' }
]

// ── Add Debt Form ──────────────────────────────────────────────────────────────
function AddDebtForm({ onDone }) {
  const { addDebt } = useFinance()
  const [form, setForm] = useState({ name: '', type: 'personal_loan', balance: '', rate: '', min_payment: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr]= useState('')
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.balance || !form.rate) { setErr('Name, balance and rate required'); return }
    setSaving(true); setErr('')
    try {
      await addDebt({
        name:             form.name,
        type:             form.type,
        balance:          +form.balance,
        original_balance: +form.balance,
        rate:             +form.rate,
        min_payment:      +form.min_payment || 0,
      })
      onDone()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background: theme.bg2, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>DEBT NAME</div>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. HDFC Home Loan" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>TYPE</div>
          <Select value={form.type} onChange={set('type')}>
            {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>BALANCE (₹)</div>
          <Input value={form.balance} onChange={set('balance')} placeholder="500000" type="number" min="0" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>RATE (% p.a.)</div>
          <Input value={form.rate} onChange={set('rate')} placeholder="8.5" type="number" step="0.01" min="0" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>MIN EMI (₹)</div>
          <Input value={form.min_payment} onChange={set('min_payment')} placeholder="5000" type="number" min="0" />
        </div>
        <Btn onClick={submit} disabled={saving}>{saving ? <Spinner size={14} /> : 'Add'}</Btn>
      </div>
      {err && <div style={{ color: theme.red, fontFamily: theme.mono, fontSize: 11, marginTop: 8 }}>{err}</div>}
    </div>
  )
}

// ── Debt Card ──────────────────────────────────────────────────────────────────
function DebtCard({ debt }) {
  const { updateDebt, deleteDebt } = useFinance()
  const [paying, setPaying] = useState(false)
  const [customAmt, setCustomAmt] = useState('')

  const progress       = debt.original_balance > 0 ? Math.max(0, Math.min(((debt.original_balance - debt.balance) / debt.original_balance) * 100, 100)) : 0
  const monthlyInterest = (Number(debt.balance) * Number(debt.rate) / 100) / 12
  const rateColor      = debt.rate > 18 ? theme.red : debt.rate > 10 ? theme.yellow : theme.accent

  const makePayment = async (amount) => {
    const newBalance = Math.max(0, debt.balance - amount)
    await updateDebt(debt.id, { balance: newBalance })
    setCustomAmt('')
    setPaying(false)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: theme.head, fontWeight: 700, fontSize: 15 }}>{debt.name}</div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginTop: 2 }}>
            {debt.type} · ~{inr(monthlyInterest)}/mo interest
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Badge color={rateColor}>{debt.rate}% p.a.</Badge>
          <Btn ghost sm onClick={() => deleteDebt(debt.id)} color={theme.red}>✕</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 2 }}>REMAINING</div>
          <div style={{ fontFamily: theme.mono, fontSize: 22, fontWeight: 700, color: theme.red }}>{inr(debt.balance)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 2 }}>ORIGINAL</div>
          <div style={{ fontFamily: theme.mono, fontSize: 14, color: theme.muted }}>{inr(debt.original_balance)}</div>
        </div>
      </div>

      <ProgressBar value={debt.original_balance - debt.balance} max={debt.original_balance} color={theme.accent} height={8} />
      <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginTop: 6, marginBottom: 14 }}>
        {progress.toFixed(1)}% paid off · {inr(debt.balance)} remaining
      </div>

      {paying ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={customAmt} onChange={setCustomAmt} placeholder="Amount (₹)" type="number" min="0" />
          <Btn sm onClick={() => makePayment(Number(customAmt))} color={theme.accent}>Pay</Btn>
          <Btn sm ghost onClick={() => setPaying(false)}>Cancel</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {debt.min_payment > 0 && (
            <Btn sm onClick={() => makePayment(debt.min_payment)} color={theme.blue}>
              EMI {inr(debt.min_payment, 0)}
            </Btn>
          )}
          {[5000, 10000].map(a => (
            <Btn key={a} sm onClick={() => makePayment(a)} color={theme.accent}>+{inr(a, 0)}</Btn>
          ))}
          <Btn sm ghost onClick={() => setPaying(true)}>Custom</Btn>
        </div>
      )}
    </Card>
  )
}

// ── Debt Index ─────────────────────────────────────────────────────────────────
export default function Debt() {
  const { debts } = useFinance()
  const [adding, setAdding] = useState(false)

  const totalDebt    = debts.reduce((s, d) => s + Number(d.balance), 0)
  const monthlyMin   = debts.reduce((s, d) => s + Number(d.min_payment || 0), 0)
  const highestRate  = debts.reduce((h, d) => !h || d.rate > h.rate ? d : h, null)
  const totalInterest = debts.reduce((s, d) => s + (d.balance * d.rate / 100) / 12, 0)

  // Avalanche order (highest rate first)
  const sorted = [...debts].sort((a, b) => b.rate - a.rate)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KpiCard label="Total Debt" value={inr(totalDebt)} color={theme.red} />
        <KpiCard label="Monthly EMIs" value={inr(monthlyMin)} color={theme.yellow} />
        <KpiCard label="Monthly Interest" value={inr(totalInterest)} color={theme.red} />
        <KpiCard label="Highest Rate" value={highestRate ? `${highestRate.rate}%` : '—'} sub={highestRate?.name} color={theme.red} />
      </div>

      {/* Strategy tip */}
      {debts.length > 1 && (
        <div style={{ background: theme.bg2, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '12px 16px', fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
          💡 <strong style={{ color: theme.text }}>Avalanche strategy:</strong> Pay minimums on all debts, then put extra toward{' '}
          <strong style={{ color: theme.red }}>{sorted[0]?.name} ({sorted[0]?.rate}% APR)</strong> first — this saves the most interest overall.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={() => setAdding(a => !a)}>{adding ? '✕ Cancel' : '+ Add Debt'}</Btn>
      </div>

      {adding && <AddDebtForm onDone={() => setAdding(false)} />}

      {debts.length === 0 && !adding && (
        <Card><EmptyState icon="◌" message="No debts added. Track your loans and credit cards here." /></Card>
      )}

      {/* Show in avalanche order */}
      <div style={{ display: 'grid', gap: 12 }}>
        {sorted.map(d => <DebtCard key={d.id} debt={d} />)}
      </div>
    </div>
  )
}
