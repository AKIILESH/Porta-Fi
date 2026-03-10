import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useTransactions, useAddTransaction, useDeleteTransaction } from '../../hooks/useTransactions.js'
import { useBudgetLimits, useSetBudgetLimit } from '../../hooks/useBudgetLimits.js'
import { useCashAccounts } from '../../hooks/useCashAccounts.js'
import { Spinner } from '../shared/ui.jsx'
import { inr, inrCompact, fmtDate, todayISO, currentMonth } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, TrendingDown, PiggyBank, ArrowUpCircle,
  ArrowDownCircle, Trash2, Target, Receipt, Plus, X,
  BarChart2,
} from 'lucide-react'

// ── Responsive CSS ────────────────────────────────────────────────────────────
const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes gpulse { 0%,100%{opacity:.3} 50%{opacity:.7} }

  .b-kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .b-two-col  { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .b-form-two { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
  .b-budget-row { display:flex; gap:10px; align-items:flex-end; margin-bottom:22px; flex-wrap:wrap; }
  .b-budget-limit-input { width:140px; min-width:100px; }
  .b-tx-row { display:flex; justify-content:space-between; align-items:center; }
  .b-tx-meta { display:flex; align-items:center; gap:12px; min-width:0; }
  .b-header { padding-bottom:20px; border-bottom:1px solid ${theme.border}; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px; }

  @media (max-width: 1024px) {
    .b-kpi-grid { grid-template-columns:repeat(3,1fr); }
    .b-two-col  { grid-template-columns:1fr; }
  }

  @media (max-width: 767px) {
    .b-kpi-grid { grid-template-columns:1fr 1fr; gap:8px; }
    .b-two-col  { grid-template-columns:1fr; }
    .b-form-two { grid-template-columns:1fr; }
    .b-budget-limit-input { width:100%; }
    .b-budget-row { flex-direction:column; align-items:stretch; }
    .b-tx-row { gap:8px; }
    .b-header { flex-direction:column; align-items:flex-start; }
  }

  @media (max-width: 480px) {
    .b-kpi-grid { grid-template-columns:1fr; }
  }
`

// ── Glass helpers ─────────────────────────────────────────────────────────────
const glass = (o = 0.04, b = 20) => ({
  background: `rgba(255,255,255,${o})`,
  backdropFilter: `blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
})
const gi = `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
const shine = {
  position:'absolute', top:0, left:'10%', right:'10%', height:1,
  background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)',
  pointerEvents:'none',
}

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES  = ['Housing','Food','Transport','Entertainment','Health','Shopping','Utilities','Education','Insurance','Other']
const INCOME_CATS = ['Salary','Freelance','Business','Investment Returns','Other Income']
const PIE_COLORS  = [theme.accent,'#4f8eff','#F59E0B','#9b5cff',theme.red,'#ff9f43','#54a0ff','#48dbfb','#ff6b81','#a29bfe']

// ── Primitives ────────────────────────────────────────────────────────────────
const FL = ({ children, required }) => (
  <div style={{ fontFamily:theme.mono, fontSize:'0.51rem', letterSpacing:'0.18em', textTransform:'uppercase', color:theme.muted, marginBottom:5, display:'flex', alignItems:'center', gap:3 }}>
    {children}{required && <span style={{ color:theme.red }}>*</span>}
  </div>
)

const SL = ({ children, icon:Icon }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
    <div style={{ width:3, height:14, background:theme.accent, borderRadius:2, boxShadow:`0 0 8px ${theme.accent}` }}/>
    {Icon && <Icon size={13} style={{ color:theme.accent }} strokeWidth={2}/>}
    <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>{children}</span>
  </div>
)

const inputSt = {
  ...glass(0.05, 14),
  border:`1px solid ${theme.border}`, borderRadius:9,
  color:theme.text, fontFamily:theme.mono, fontSize:'0.72rem',
  padding:'9px 12px', outline:'none', width:'100%',
  boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s',
  boxShadow:`inset 0 2px 4px rgba(0,0,0,0.2)`,
}
const GInput = ({ value, onChange, type='text', placeholder, min, step, style={} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} type={type}
    placeholder={placeholder} min={min} step={step}
    style={{ ...inputSt, ...style }}
    onFocus={e => { e.target.style.borderColor=`${theme.accent}70`; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}` }}
    onBlur={e => { e.target.style.borderColor=theme.border; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2)` }}
  />
)
const GSelect = ({ value, onChange, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ ...inputSt, cursor:'pointer', appearance:'none', WebkitAppearance:'none',
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7fa5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', paddingRight:30 }}
    onFocus={e => e.target.style.borderColor=`${theme.accent}70`}
    onBlur={e => e.target.style.borderColor=theme.border}
  >
    {children}
  </select>
)

const GCard = ({ children, style={}, className='' }) => (
  <div className={className} style={{ ...glass(0.04,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden', boxShadow:gi, ...style }}>
    <div style={shine}/>
    {children}
  </div>
)

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BudgetSkeleton() {
  return (
    <div style={{ display:'grid', gap:20 }}>
      <div style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:80, animation:'gpulse 1.8s infinite' }}/>
      <div className="b-kpi-grid">
        {[1,2,3].map(i => <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:120, animation:`gpulse 1.8s ${i*0.15}s infinite` }}/>)}
      </div>
      <div className="b-two-col">
        {[1,2].map(i => <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:16, height:320, animation:`gpulse 1.8s ${i*0.2}s infinite` }}/>)}
      </div>
    </div>
  )
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub, accent, icon:Icon, index=0 }) {
  return (
    <div style={{ ...glass(0.05,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:'22px 24px', position:'relative', overflow:'hidden', boxShadow:gi, animation:`fadeUp 0.4s ${index*0.07}s both` }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:accent, opacity:0.55 }}/>
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <FL>{label}</FL>
        {Icon && (
          <div style={{ width:28, height:28, ...glass(0.08,10), border:`1px solid ${accent}30`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:accent, flexShrink:0 }}>
            <Icon size={13} strokeWidth={1.8}/>
          </div>
        )}
      </div>
      <div style={{ fontFamily:theme.display, fontSize:'1.85rem', fontWeight:700, color:theme.text, lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${accent}30` }}>{value}</div>
      {sub && <div style={{ fontFamily:theme.mono, fontSize:'0.58rem', color:accent }}>{sub}</div>}
    </div>
  )
}

// ── Type Toggle ───────────────────────────────────────────────────────────────
function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display:'flex', ...glass(0.05,12), border:`1px solid ${theme.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
      {[['expense', 'Expense', ArrowDownCircle, theme.red], ['income', 'Income', ArrowUpCircle, theme.green]].map(([t, label, Icon, c]) => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          padding:'9px 16px', border:'none',
          background:value===t ? `${c}18` : 'transparent',
          color:value===t ? c : theme.muted,
          fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em',
          textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s',
          borderBottom:value===t ? `2px solid ${c}` : '2px solid transparent',
          borderRight:t==='expense' ? `1px solid ${theme.border}` : 'none',
        }}>
          <Icon size={12} strokeWidth={2}/>{label}
        </button>
      ))}
    </div>
  )
}

// ── Add Transaction Form ──────────────────────────────────────────────────────
function AddTransactionForm() {
  const { userId } = useFinance()
  const addTransaction = useAddTransaction(userId)
  const { data: cashAccounts = [] } = useCashAccounts(userId)

  const [type, setType] = useState('expense')
  const [form, setForm] = useState({ date:todayISO(), description:'', amount:'', category:'Food', account_id:cashAccounts[0]?.id||'' })
  const [err, setErr]   = useState('')

  const set = k => v => setForm(f => ({ ...f, [k]:v }))
  const cats = type === 'income' ? INCOME_CATS : CATEGORIES
  const accentC = type === 'income' ? theme.green : theme.red

  const handleTypeChange = t => {
    setType(t)
    setForm(f => ({ ...f, category: t==='income' ? INCOME_CATS[0] : CATEGORIES[0] }))
  }

  const submit = async () => {
    if (!form.description || !form.amount) { setErr('Description and amount are required'); return }
    if (!form.account_id) { setErr('Please select an account'); return }
    setErr('')
    try {
      const amount = type==='income' ? Math.abs(+form.amount) : -Math.abs(+form.amount)
      await addTransaction.mutateAsync({ ...form, amount, category:form.category||cats[0] })
      setForm({ date:todayISO(), description:'', amount:'', category:cats[0], account_id:cashAccounts[0]?.id||'' })
    } catch(e) { setErr(e.message) }
  }

  const isPending = addTransaction.isPending

  return (
    <GCard style={{ borderLeft:`2px solid ${accentC}`, boxShadow:`${gi}, 0 0 24px ${accentC}10` }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${accentC}50,transparent)` }}/>
      <SL icon={type==='income'?TrendingUp:TrendingDown}>Add Transaction</SL>

      <TypeToggle value={type} onChange={handleTypeChange}/>

      <div className="b-form-two">
        <div><FL>Date</FL><GInput value={form.date} onChange={set('date')} type="date"/></div>
        <div>
          <FL>Category</FL>
          <GSelect value={form.category} onChange={set('category')}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </GSelect>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <FL>Account</FL>
        <GSelect value={form.account_id} onChange={set('account_id')}>
          <option value="">— Select Account —</option>
          {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} · {inr(acc.balance)}</option>)}
        </GSelect>
      </div>

      <div style={{ marginBottom:12 }}>
        <FL required>Description</FL>
        <GInput value={form.description} onChange={set('description')} placeholder="e.g. Zepto grocery order"/>
      </div>

      <div style={{ marginBottom:16 }}>
        <FL required>Amount (₹)</FL>
        <GInput value={form.amount} onChange={set('amount')} type="number" min="0" step="0.01" placeholder="0.00"/>
      </div>

      {form.description && form.amount && (
        <div style={{ padding:'9px 14px', ...glass(0.06,12), border:`1px solid ${theme.border}`, borderLeft:`2px solid ${accentC}`, borderRadius:10, marginBottom:14, fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {type==='income' ? <ArrowUpCircle size={12} style={{ color:accentC }}/> : <ArrowDownCircle size={12} style={{ color:accentC }}/>}
          <span style={{ color:theme.accentLt, fontFamily:theme.display, fontSize:'1rem' }}>{inr(Math.abs(+form.amount))}</span>
          <span>·</span><span style={{ color:theme.text }}>{form.description}</span>
        </div>
      )}

      {err && (
        <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.red, padding:'8px 12px', ...glass(0.04,10), border:`1px solid ${theme.red}28`, borderRadius:9, marginBottom:12 }}>
          {err}
        </div>
      )}

      <button onClick={submit} disabled={isPending} style={{
        width:'100%', ...glass(0.08,12), border:`1px solid ${accentC}50`, borderRadius:10,
        color:accentC, padding:'11px', cursor:isPending?'not-allowed':'pointer',
        fontFamily:theme.mono, fontSize:'0.66rem', letterSpacing:'0.18em', textTransform:'uppercase',
        opacity:isPending?0.6:1, transition:'all 0.2s',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        boxShadow:`0 0 16px ${accentC}18`,
      }}
        onMouseEnter={e => { if(!isPending) e.currentTarget.style.boxShadow=`0 0 24px ${accentC}35` }}
        onMouseLeave={e => e.currentTarget.style.boxShadow=`0 0 16px ${accentC}18`}
      >
        {isPending ? <Spinner size={13}/> : <>{type==='income'?<ArrowUpCircle size={14}/>:<ArrowDownCircle size={14}/>} Add {type==='income'?'Income':'Expense'}</>}
      </button>
    </GCard>
  )
}

// ── Spending Chart ────────────────────────────────────────────────────────────
function SpendingChart({ spendByCategory }) {
  const data = Object.entries(spendByCategory||{}).map(([name,value]) => ({ name, value }))

  if (!data.length) return (
    <div style={{ height:220, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:theme.muted }}>
      <BarChart2 size={28} strokeWidth={1} style={{ opacity:0.3 }}/>
      <span style={{ fontFamily:theme.mono, fontSize:'0.68rem', letterSpacing:'0.1em' }}>No spending data this month</span>
    </div>
  )

  const CustomTooltip = ({ active, payload }) => {
    if (!active||!payload?.length) return null
    const d = payload[0].payload
    const total = data.reduce((s,i) => s+i.value, 0)
    return (
      <div style={{ ...glass(0.15,20), border:`1px solid ${theme.borderHi}`, padding:'10px 14px', borderRadius:10, boxShadow:`0 8px 24px rgba(0,0,0,0.4)` }}>
        <div style={{ fontFamily:theme.mono, fontSize:'0.58rem', color:theme.muted, marginBottom:3 }}>{d.name}</div>
        <div style={{ fontFamily:theme.display, fontSize:'1.05rem', color:theme.accentLt }}>{inr(d.value)}</div>
        <div style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted }}>{((d.value/total)*100).toFixed(1)}%</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={82} dataKey="value"
          label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
          labelLine={{ stroke:theme.border, strokeWidth:1 }}
          style={{ fontFamily:theme.mono, fontSize:'0.52rem', fill:theme.muted }}
        >
          {data.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} strokeWidth={0}/>)}
        </Pie>
        <Tooltip content={<CustomTooltip/>}/>
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Budget Limits ─────────────────────────────────────────────────────────────
function BudgetLimits({ spendByCategory }) {
  const { userId } = useFinance()
  const month = currentMonth()
  const { data:budgetLimits=[], isLoading, error } = useBudgetLimits(userId, month)
  const setBudgetLimit = useSetBudgetLimit(userId)
  const [form, setForm] = useState({ category:CATEGORIES[0], limit:'' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.limit) return
    setSaving(true)
    try {
      await setBudgetLimit.mutateAsync({ category:form.category, limit:Number(form.limit) })
      setForm(f => ({ ...f, limit:'' }))
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (isLoading) return <GCard><div style={{ padding:'40px 0', textAlign:'center' }}><Spinner size={20}/></div></GCard>
  if (error) return <GCard><div style={{ padding:'30px 0', textAlign:'center', fontFamily:theme.mono, fontSize:'0.7rem', color:theme.red }}>Error: {error.message}</div></GCard>

  const limits = Array.isArray(budgetLimits) ? budgetLimits : []

  return (
    <GCard>
      <SL icon={Target}>Monthly Budget Limits</SL>

      <div className="b-budget-row">
        <div style={{ flex:1, minWidth:120 }}>
          <FL>Category</FL>
          <GSelect value={form.category} onChange={v => setForm(f => ({ ...f, category:v }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </GSelect>
        </div>
        <div className="b-budget-limit-input">
          <FL>Monthly Limit (₹)</FL>
          <GInput value={form.limit} onChange={v => setForm(f => ({ ...f, limit:v }))} type="number" placeholder="e.g. 10000"/>
        </div>
        <button onClick={submit} disabled={saving||setBudgetLimit?.isPending} style={{
          ...glass(0.08,12), border:`1px solid ${theme.accent}50`, borderRadius:9,
          color:theme.accent, padding:'9px 20px', cursor:(saving||setBudgetLimit?.isPending)?'not-allowed':'pointer',
          fontFamily:theme.mono, fontSize:'0.62rem', letterSpacing:'0.15em', textTransform:'uppercase',
          opacity:(saving||setBudgetLimit?.isPending)?0.6:1, transition:'all 0.2s',
          display:'flex', alignItems:'center', gap:6, flexShrink:0,
          boxShadow:`0 0 12px ${theme.accentGlow}`,
          whiteSpace:'nowrap',
        }}>
          {(saving||setBudgetLimit?.isPending) ? <Spinner size={12}/> : <><Plus size={12} strokeWidth={2}/> Set</>}
        </button>
      </div>

      {limits.length === 0 && (
        <div style={{ padding:'30px 0', textAlign:'center', fontFamily:theme.mono, fontSize:'0.7rem', color:theme.muted, opacity:0.5 }}>No budget limits set yet</div>
      )}

      <div style={{ display:'grid', gap:18 }}>
        {limits.map(b => {
          if (!b||!b.category) return null
          const spent = spendByCategory?.[b.category] || 0
          const over  = spent > (b.monthly_limit||0)
          const prog  = b.monthly_limit > 0 ? Math.min(100, (spent/b.monthly_limit)*100) : 0
          const barC  = over ? theme.red : prog > 80 ? theme.yellow : theme.green

          return (
            <div key={b.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7, flexWrap:'wrap', gap:4 }}>
                <span style={{ fontFamily:theme.sans, fontSize:'0.83rem', color:theme.text }}>{b.category}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  {over && (
                    <span style={{ fontFamily:theme.mono, fontSize:'0.53rem', letterSpacing:'0.12em', color:theme.red, border:`1px solid ${theme.red}40`, padding:'2px 7px', borderRadius:5, background:`${theme.red}10` }}>
                      OVER
                    </span>
                  )}
                  <span style={{ fontFamily:theme.mono, fontSize:'0.63rem', color:over?theme.red:theme.muted }}>
                    <span style={{ color:over?theme.red:theme.text }}>{inr(spent)}</span> / {inr(b.monthly_limit||0)}
                  </span>
                </div>
              </div>
              <div style={{ height:4, ...glass(0.04,8), border:`1px solid ${theme.border}`, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${prog}%`, background:`linear-gradient(90deg,${barC}80,${barC})`, borderRadius:4, transition:'width 0.6s ease', boxShadow:`0 0 8px ${barC}50`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', animation:'shimmer 2s infinite' }}/>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
                <span style={{ fontFamily:theme.mono, fontSize:'0.51rem', color:barC }}>{prog.toFixed(0)}% used</span>
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
  const { data:transactionsData, isLoading } = useTransactions(userId, month)
  const deleteTransaction = useDeleteTransaction(userId)
  const { data:cashAccounts=[] } = useCashAccounts(userId)

  const transactions = transactionsData?.data || []
  const getAccName = id => cashAccounts.find(a => a.id===id)?.name || '—'

  const handleDelete = async (id, transaction) => {
    if (window.confirm('Delete this transaction?')) {
      try { await deleteTransaction.mutateAsync({ id, transaction }) }
      catch(e) { console.error(e) }
    }
  }

  if (isLoading) return <GCard><div style={{ padding:'40px 0', textAlign:'center' }}><Spinner/></div></GCard>

  return (
    <GCard>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:8 }}>
        <SL icon={Receipt}>This Month's Transactions</SL>
        <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted, letterSpacing:'0.1em' }}>{transactions.length} entries</span>
      </div>

      {transactions.length === 0 && (
        <div style={{ padding:'40px 0', textAlign:'center', fontFamily:theme.mono, fontSize:'0.7rem', color:theme.muted, opacity:0.5 }}>
          No transactions this month
        </div>
      )}

      {transactions.map((t, i) => {
        const [hov, setHov] = useState(false)
        const isCredit = t.amount >= 0
        const c = isCredit ? theme.green : theme.red

        return (
          <div key={t.id}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              padding:'12px 10px',
              borderBottom:i<transactions.length-1 ? `1px solid ${theme.border}` : 'none',
              background:hov?'rgba(255,255,255,0.025)':'transparent',
              transition:'background 0.2s', borderRadius:hov?8:0,
            }}
          >
            <div className="b-tx-row">
              {/* Left: icon + info */}
              <div className="b-tx-meta" style={{ minWidth:0, flex:1 }}>
                <div style={{ width:34, height:34, flexShrink:0, ...glass(0.08,10), border:`1px solid ${c}28`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:c }}>
                  {isCredit ? <ArrowUpCircle size={15} strokeWidth={2}/> : <ArrowDownCircle size={15} strokeWidth={2}/>}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:theme.sans, fontSize:'0.83rem', color:theme.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.description}
                  </div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.56rem', color:theme.muted, letterSpacing:'0.06em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.category} · {fmtDate(t.date)} · {getAccName(t.account_id)}
                  </div>
                </div>
              </div>

              {/* Right: amount + delete */}
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:8 }}>
                <div style={{ fontFamily:theme.display, fontSize:'1.05rem', color:c, textAlign:'right', textShadow:`0 0 10px ${c}35`, whiteSpace:'nowrap' }}>
                  {isCredit?'+':''}{inr(t.amount)}
                </div>
                <button onClick={() => handleDelete(t.id,t)} disabled={deleteTransaction.isPending}
                  style={{ ...glass(0.04,10), border:`1px solid transparent`, borderRadius:8, color:theme.muted, padding:'5px 7px', cursor:deleteTransaction.isPending?'not-allowed':'pointer', transition:'all 0.2s', display:'flex', alignItems:'center' }}
                  onMouseEnter={e => { if(!deleteTransaction.isPending){ e.currentTarget.style.color=theme.red; e.currentTarget.style.borderColor=`${theme.red}40`; e.currentTarget.style.background=`${theme.red}10` }}}
                  onMouseLeave={e => { if(!deleteTransaction.isPending){ e.currentTarget.style.color=theme.muted; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}}
                >
                  {deleteTransaction.isPending ? <Spinner size={10}/> : <Trash2 size={13} strokeWidth={1.5}/>}
                </button>
              </div>
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
  const { data:transactionsData, isLoading } = useTransactions(userId, month)
  const transactions = transactionsData?.data || []

  const monthlyIncome   = transactions.filter(t => t.amount>0).reduce((s,t) => s+Number(t.amount), 0)
  const monthlyExpenses = transactions.filter(t => t.amount<0).reduce((s,t) => s+Math.abs(Number(t.amount)), 0)
  const spendByCategory = {}
  transactions.filter(t => t.amount<0).forEach(t => {
    spendByCategory[t.category] = (spendByCategory[t.category]||0) + Math.abs(Number(t.amount))
  })
  const savings     = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (savings/monthlyIncome)*100 : 0

  if (isLoading) return <BudgetSkeleton/>

  return (
    <div style={{ display:'grid', gap:20, fontFamily:theme.sans }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="b-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <TrendingUp size={12} style={{ color:theme.accent }} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily:theme.display, fontSize:'2rem', fontWeight:700, color:theme.text, margin:0, lineHeight:1 }}>Budget & Transactions</h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.58rem', color:theme.muted, marginTop:6, letterSpacing:'0.10em' }}>Income · Expenses · Monthly limits</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="b-kpi-grid">
        <KpiTile label="Income This Month"   value={inr(monthlyIncome)}   accent={theme.green} icon={TrendingUp}   sub="Total inflows"                          index={0}/>
        <KpiTile label="Expenses This Month" value={inr(monthlyExpenses)} accent={theme.red}   icon={TrendingDown} sub="Total outflows"                         index={1}/>
        <KpiTile label="Net Savings"         value={inr(savings)}         accent={savings>=0?theme.blue:theme.red} icon={PiggyBank} sub={`${savingsRate.toFixed(1)}% savings rate`} index={2}/>
      </div>

      {/* Form + Chart */}
      <div className="b-two-col">
        <AddTransactionForm/>
        <GCard>
          <SL icon={BarChart2}>Spending by Category</SL>
          <SpendingChart spendByCategory={spendByCategory}/>
        </GCard>
      </div>

      {/* Budget limits — pass spendByCategory down */}
      <BudgetLimits spendByCategory={spendByCategory}/>

      {/* Transactions */}
      <TransactionList/>
    </div>
  )
}