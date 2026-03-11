// src/pages/Budget.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useTransactionsRange, useAddTransaction, useDeleteTransaction } from '../../hooks/useTransactions.js'
import { useCashAccounts } from '../../hooks/useCashAccounts.js'
import { useFlexBudget } from '../../hooks/useFlexBudget.js' // Import the new hook
import { Spinner } from '../shared/ui.jsx'
import { inr, fmtDate, todayISO, currentMonth } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  Trash2, Plus, Wallet, Home, Coffee, ShoppingBag, Zap,
  Briefcase, Shield, Heart, Car, Film, Gift, Smartphone,
  BookOpen, Plane, PiggyBank, Utensils, Hash, ChevronDown, Check, X, Banknote,
  ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Move
} from 'lucide-react'

// ── Responsive CSS ────────────────────────────────────────────────────────────
const CSS = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes gpulse   { 0%,100%{opacity:.25} 50%{opacity:.6} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .bg-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .bg-main-grid   { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .bg-form-two    { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .bg-header      { display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px; margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid ${theme.border}; }
  .bg-period-nav  { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .bg-flex-grid   { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:20px; }

  @media (max-width:1024px) {
    .bg-main-grid { grid-template-columns:1fr; }
  }
  @media (max-width:767px) {
    .bg-summary-grid { grid-template-columns:1fr 1fr; gap:10px; }
    .bg-form-two     { grid-template-columns:1fr; }
    .bg-main-grid    { grid-template-columns:1fr; }
    .bg-header       { flex-direction:column; align-items:flex-start; }
    .bg-header-btn   { width:100%; justify-content:center; }
    .bg-period-nav   { width:100%; justify-content:space-between; }
    .bg-flex-grid    { grid-template-columns:1fr; }
  }
  @media (max-width:480px) {
    .bg-summary-grid { grid-template-columns:1fr; }
  }
`

// ── Glass ────────────────────────────────────────────────────────────────────
const glass  = (o=0.04, b=20) => ({ background:`rgba(255,255,255,${o})`, backdropFilter:`blur(${b}px) saturate(180%)`, WebkitBackdropFilter:`blur(${b}px) saturate(180%)` })
const gi     = `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
const shine  = { position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', pointerEvents:'none' }

// ── Category config ───────────────────────────────────────────────────────────
const EXPENSE_CATS = [
  { value:'Food & Dining',      icon:Utensils,    color:'#f59e0b' },
  { value:'Shopping',           icon:ShoppingBag, color:'#8b5cf6' },
  { value:'Transport',          icon:Car,         color:'#0ea5e9' },
  { value:'Entertainment',      icon:Film,        color:'#ec4899' },
  { value:'Bills & Utilities',  icon:Zap,         color:'#10b981' },
  { value:'Healthcare',         icon:Heart,       color:'#ef4444' },
  { value:'Housing',            icon:Home,        color:'#6366f1' },
  { value:'Education',          icon:BookOpen,    color:'#14b8a6' },
  { value:'Travel',             icon:Plane,       color:'#f97316' },
  { value:'Insurance',          icon:Shield,      color:'#64748b' },
  { value:'Investments',        icon:TrendingUp,  color:'#22c55e' },
  { value:'Personal Care',      icon:Coffee,      color:'#a78bfa' },
  { value:'Gifts',              icon:Gift,        color:'#fb7185' },
  { value:'Electronics',        icon:Smartphone,  color:'#38bdf8' },
  { value:'Other',              icon:Hash,        color:'#6b7280' },
]

const INCOME_CATS = [
  { value:'Salary',             icon:Briefcase,   color:'#22c55e' },
  { value:'Allowance',          icon:Banknote,    color:'#22c55e' },
  { value:'Freelance',          icon:Coffee,      color:'#0ea5e9' },
  { value:'Business',           icon:Briefcase,   color:'#8b5cf6' },
  { value:'Investment Returns', icon:TrendingUp,  color:'#f59e0b' },
  { value:'Rental Income',      icon:Home,        color:'#14b8a6' },
  { value:'Gift',               icon:Gift,        color:'#ec4899' },
  { value:'Bonus',              icon:PiggyBank,   color:'#22c55e' },
  { value:'Cash Back',          icon:PiggyBank,   color:'#7922c5' },
  { value:'Other Income',       icon:Hash,        color:'#6b7280' },
]

const catMeta = v => [...EXPENSE_CATS, ...INCOME_CATS].find(c=>c.value===v) || { icon:Hash, color:theme.muted }

// ── Primitives ────────────────────────────────────────────────────────────────
const FL = ({children,required}) => (
  <div style={{ fontFamily:theme.mono, fontSize:'0.51rem', letterSpacing:'0.17em', textTransform:'uppercase', color:theme.muted, marginBottom:5, display:'flex', alignItems:'center', gap:3 }}>
    {children}{required && <span style={{color:theme.red}}>*</span>}
  </div>
)

const SL = ({children,icon:Icon}) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
    <div style={{ width:3, height:14, background:theme.accent, borderRadius:2, boxShadow:`0 0 8px ${theme.accent}` }}/>
    {Icon && <Icon size={13} style={{color:theme.accent}} strokeWidth={2}/>}
    <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>{children}</span>
  </div>
)

const inputSt = {
  ...glass(0.05,14),
  border:`1px solid ${theme.border}`, borderRadius:9,
  color:theme.text, fontFamily:theme.mono, fontSize:'0.73rem',
  padding:'10px 12px', outline:'none', width:'100%', boxSizing:'border-box',
  transition:'border-color 0.2s, box-shadow 0.2s',
  boxShadow:`inset 0 2px 4px rgba(0,0,0,0.2)`,
}

const GInput = ({value,onChange,type='text',placeholder,min,step}) => (
  <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder} min={min} step={step}
    style={inputSt}
    onFocus={e=>{e.target.style.borderColor=`${theme.accent}70`;e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}`}}
    onBlur={e=>{e.target.style.borderColor=theme.border;e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2)`}}
  />
)

// ── Period Selector Component ─────────────────────────────────────────────────
function PeriodSelector({ periodType, setPeriodType, selectedDate, setSelectedDate, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate, showCustomPicker, setShowCustomPicker }) {
  
  const formatDisplayDate = () => {
    const date = new Date(selectedDate)
    switch(periodType) {
      case 'day':
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      case 'week': {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(date)
        monday.setDate(diff)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        return `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
      case 'month':
        return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      default:
        return `${new Date(customStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(customEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
  }

  const navigatePrevious = () => {
    const date = new Date(selectedDate)
    switch(periodType) {
      case 'day':
        date.setDate(date.getDate() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
      default:
        return
    }
    setSelectedDate(date)
  }

  const navigateNext = () => {
    const date = new Date(selectedDate)
    switch(periodType) {
      case 'day':
        date.setDate(date.getDate() + 1)
        break
      case 'week':
        date.setDate(date.getDate() + 7)
        break
      case 'month':
        date.setMonth(date.getMonth() + 1)
        break
      default:
        return
    }
    setSelectedDate(date)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
      {/* Period Type Tabs */}
      <div style={{ display: 'flex', gap: 8, background: glass(0.03, 10), borderRadius: 10, padding: 4 }}>
        {['day', 'week', 'month', 'period'].map(type => (
          <button
            key={type}
            onClick={() => {
              setPeriodType(type)
              if (type === 'period') setShowCustomPicker(true)
              else setShowCustomPicker(false)
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: periodType === type ? `${theme.accent}20` : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: periodType === type ? theme.accent : theme.muted,
              fontFamily: theme.mono,
              fontSize: '0.65rem',
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Navigation for non-period views */}
      {periodType !== 'period' && (
        <div className="bg-period-nav">
          <button
            onClick={navigatePrevious}
            style={{
              ...glass(0.05, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              color: theme.accent,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          
          <div style={{ 
            flex: 1, 
            textAlign: 'center', 
            fontFamily: theme.mono, 
            fontSize: '0.75rem', 
            color: theme.text,
            ...glass(0.03, 10),
            padding: '8px 16px',
            borderRadius: 20,
            border: `1px solid ${theme.border}`
          }}>
            {formatDisplayDate()}
          </div>

          <button
            onClick={navigateNext}
            style={{
              ...glass(0.05, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              color: theme.accent,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <div style={{ 
          ...glass(0.08, 16), 
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div>
            <FL>From</FL>
            <GInput 
              type="date" 
              value={customStartDate} 
              onChange={setCustomStartDate}
            />
          </div>
          <div>
            <FL>To</FL>
            <GInput 
              type="date" 
              value={customEndDate} 
              onChange={setCustomEndDate}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Styled Dropdown ────────────────────────────────────────────────────────────
function StyledDropdown({ options, value, onChange, placeholder='Select…', disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sel = options.find(o=>o.value===value)

  useEffect(()=>{
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return ()=>document.removeEventListener('mousedown', fn)
  },[])

  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <button type="button" onClick={()=>!disabled&&setOpen(v=>!v)}
        style={{ ...inputSt, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, border:`1px solid ${open?`${theme.accent}70`:theme.border}`, boxShadow:open?`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}`:`inset 0 2px 4px rgba(0,0,0,0.2)`, padding:'10px 12px' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
          {sel ? (
            <>
              <div style={{ width:26, height:26, borderRadius:8, background:`${sel.color}20`, border:`1px solid ${sel.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <sel.icon size={14} style={{color:sel.color}} strokeWidth={2}/>
              </div>
              <span style={{ color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sel.value}</span>
            </>
          ) : (
            <span style={{ color:theme.muted }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} style={{ color:theme.muted, flexShrink:0, transform:open?'rotate(180deg)':'none', transition:'transform 0.25s' }}/>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, ...glass(0.14,24), border:`1px solid ${theme.borderHi}`, borderRadius:12, maxHeight:260, overflowY:'auto', zIndex:1200, boxShadow:'0 16px 40px rgba(0,0,0,0.5)', animation:'fadeIn 0.18s ease' }}>
          <div style={{ padding:6, display:'grid', gap:2 }}>
            {options.map(opt => {
              const isActive = value===opt.value
              return (
                <button key={opt.value} type="button"
                  onClick={()=>{ onChange(opt.value); setOpen(false) }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:isActive?`${opt.color}18`:'transparent', border:'none', borderRadius:9, color:isActive?opt.color:theme.text, fontFamily:theme.mono, fontSize:'0.72rem', textAlign:'left', cursor:'pointer', transition:'background 0.15s', width:'100%' }}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent' }}
                >
                  <div style={{ width:28, height:28, borderRadius:8, background:`${opt.color}18`, border:`1px solid ${opt.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <opt.icon size={14} style={{color:isActive?opt.color:theme.muted}} strokeWidth={2}/>
                  </div>
                  <span style={{ flex:1 }}>{opt.value}</span>
                  {isActive && <Check size={13} style={{color:opt.color, flexShrink:0}}/>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Account Dropdown ──────────────────────────────────────────────────────────
function AccountDropdown({ accounts, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sel = accounts.find(a=>a.id===value)

  useEffect(()=>{
    const fn = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return ()=>document.removeEventListener('mousedown', fn)
  },[])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={()=>setOpen(v=>!v)}
        style={{ ...inputSt, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, cursor:'pointer', border:`1px solid ${open?`${theme.accent}70`:theme.border}`, boxShadow:open?`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}`:`inset 0 2px 4px rgba(0,0,0,0.2)`, padding:'10px 12px' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:8, ...glass(0.1,8), border:`1px solid ${theme.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Wallet size={13} style={{color:theme.accent}}/>
          </div>
          {sel ? (
            <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
              <span style={{color:theme.text}}>{sel.name}</span>
              <span style={{color:theme.muted,fontSize:'0.65rem'}}>{inr(sel.balance)}</span>
            </div>
          ) : <span style={{color:theme.muted}}>Select account</span>}
        </div>
        <ChevronDown size={14} style={{ color:theme.muted, transform:open?'rotate(180deg)':'none', transition:'transform 0.25s', flexShrink:0 }}/>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, ...glass(0.14,24), border:`1px solid ${theme.borderHi}`, borderRadius:12, zIndex:1200, boxShadow:'0 16px 40px rgba(0,0,0,0.5)', animation:'fadeIn 0.18s ease', overflow:'hidden' }}>
          {accounts.map(acc => (
            <button key={acc.id} type="button"
              onClick={()=>{ onChange(acc.id); setOpen(false) }}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:value===acc.id?`${theme.accent}12`:'transparent', border:'none', borderBottom:`1px solid ${theme.border}`, color:value===acc.id?theme.accent:theme.text, fontFamily:theme.mono, fontSize:'0.72rem', cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e=>{ if(value!==acc.id) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
              onMouseLeave={e=>{ if(value!==acc.id) e.currentTarget.style.background='transparent' }}
            >
              <span>{acc.name}</span>
              <span style={{color:theme.muted,fontSize:'0.65rem'}}>{inr(acc.balance)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Add Transaction Form ───────────────────────────────────────────────────────
function AddTransactionForm({ onSuccess }) {
  const { userId } = useFinance()
  const addTransaction = useAddTransaction(userId)
  const { data:cashAccounts=[] } = useCashAccounts(userId)
  const [type, setType] = useState('expense')
  const [form, setForm] = useState({ date:todayISO(), description:'', amount:'', category:'', account_id:'' })
  const [err, setErr] = useState('')

  const cats = type==='income' ? INCOME_CATS : EXPENSE_CATS
  const accentC = type==='income' ? theme.green : theme.red

  const handleTypeChange = t => {
    setType(t)
    setForm(f=>({...f, category:''}))
    setErr('')
  }

  const submit = async () => {
    if (!form.description||!form.amount) { setErr('Description and amount required'); return }
    if (!form.account_id) { setErr('Select an account'); return }
    if (!form.category) { setErr('Select a category'); return }
    if (Number(form.amount)<=0) { setErr('Amount must be > 0'); return }
    setErr('')
    try {
      const amount = type==='income' ? Math.abs(+form.amount) : -Math.abs(+form.amount)
      await addTransaction.mutateAsync({ ...form, amount })
      setForm({ date:todayISO(), description:'', amount:'', category:'', account_id:'' })
      if (onSuccess) onSuccess()
    } catch(e) { setErr(e.message) }
  }

  return (
    <div style={{ ...glass(0.06,22), border:`1px solid ${accentC}30`, borderLeft:`2px solid ${accentC}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden', boxShadow:`${gi},0 0 28px ${accentC}10`, animation:'fadeUp 0.3s ease' }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:`radial-gradient(circle,${accentC}0c 0%,transparent 70%)`, pointerEvents:'none' }}/>

      <SL icon={type==='income'?TrendingUp:TrendingDown}>Add Transaction</SL>

      <div style={{ display:'flex', ...glass(0.05,12), border:`1px solid ${theme.border}`, borderRadius:10, overflow:'hidden', marginBottom:20 }}>
        {[['expense','Expense',ArrowDownCircle,theme.red],['income','Income',ArrowUpCircle,theme.green]].map(([t,lbl,Icon,c])=>(
          <button key={t} onClick={()=>handleTypeChange(t)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 16px', border:'none', background:type===t?`${c}18`:'transparent', color:type===t?c:theme.muted, fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s', borderBottom:type===t?`2px solid ${c}`:'2px solid transparent', borderRight:t==='expense'?`1px solid ${theme.border}`:'none' }}>
            <Icon size={12} strokeWidth={2}/>{lbl}
          </button>
        ))}
      </div>

      <div className="bg-form-two" style={{marginBottom:12}}>
        <div><FL>Date</FL><GInput value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date"/></div>
        <div>
          <FL required>Account</FL>
          <AccountDropdown accounts={cashAccounts} value={form.account_id} onChange={v=>setForm(f=>({...f,account_id:v}))}/>
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <FL required>Category</FL>
        <StyledDropdown options={cats} value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="Pick a category…"/>
      </div>

      <div style={{marginBottom:12}}>
        <FL required>Description</FL>
        <GInput value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="What was this for?"/>
      </div>

      <div style={{marginBottom:16}}>
        <FL required>Amount (₹)</FL>
        <GInput value={form.amount} onChange={v=>setForm(f=>({...f,amount:v}))} type="number" min="0" step="0.01" placeholder="0.00"/>
      </div>

      {form.description && form.amount && form.category && (
        <div style={{ padding:'9px 14px', ...glass(0.06,12), border:`1px solid ${theme.border}`, borderLeft:`2px solid ${accentC}`, borderRadius:10, marginBottom:14, display:'flex', alignItems:'center', gap:10, fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted, flexWrap:'wrap', animation:'fadeUp 0.2s ease' }}>
          {type==='income'?<ArrowUpCircle size={12} style={{color:accentC}}/>:<ArrowDownCircle size={12} style={{color:accentC}}/>}
          <span style={{ color:theme.accentLt, fontFamily:theme.display, fontSize:'1.05rem' }}>{inr(Math.abs(+form.amount))}</span>
          <span>·</span><span style={{color:theme.text}}>{form.description}</span>
          <span>·</span><span style={{color:accentC}}>{form.category}</span>
        </div>
      )}

      {err && (
        <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.red, padding:'8px 12px', ...glass(0.04,10), border:`1px solid ${theme.red}28`, borderRadius:9, marginBottom:12 }}>
          {err}
        </div>
      )}

      <button onClick={submit} disabled={addTransaction.isPending} style={{ width:'100%', ...glass(0.08,12), border:`1px solid ${accentC}50`, borderRadius:10, color:accentC, padding:'12px', cursor:addTransaction.isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.66rem', letterSpacing:'0.18em', textTransform:'uppercase', opacity:addTransaction.isPending?0.6:1, transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:`0 0 16px ${accentC}18` }}
        onMouseEnter={e=>{ if(!addTransaction.isPending) e.currentTarget.style.boxShadow=`0 0 28px ${accentC}35` }}
        onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 16px ${accentC}18`}
      >
        {addTransaction.isPending ? <Spinner size={13}/> : <>{type==='income'?<ArrowUpCircle size={14}/>:<ArrowDownCircle size={14}/>} Add {type==='income'?'Income':'Expense'}</>}
      </button>
    </div>
  )
}

// ── Category Bubble Component (Flex Fund) ─────────────────────────────────────
function CategoryBubble({ name, data, onDragStart, onDragEnd, onDrop, isDragging, isOverTarget }) {
  const Icon = catMeta(name).icon
  const percent = data.percentUsed || 0
  const isOver = data.isOver
  const color = isOver ? theme.red : percent > 80 ? theme.yellow : theme.green
  
  return (
    <div
      draggable={!data.isFlexReserve && data.remaining > 0}
      onDragStart={(e) => {
        e.dataTransfer.setData('category', name)
        e.dataTransfer.setData('amount', data.remaining)
        onDragStart(name)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const fromCategory = e.dataTransfer.getData('category')
        const amount = parseFloat(e.dataTransfer.getData('amount'))
        if (fromCategory && fromCategory !== name && data.isOver) {
          onDrop(fromCategory, name, Math.min(amount, data.overAmount))
        }
      }}
      style={{
        ...glass(0.08, 16),
        border: `2px solid ${isOverTarget ? theme.accent : color}`,
        borderRadius: 16,
        padding: 16,
        cursor: data.isFlexReserve || data.remaining <= 0 ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        width: `${Math.min(percent, 100)}%`,
        background: color,
        transition: 'width 0.3s'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontFamily: theme.sans, fontSize: '1rem', color: theme.text }}>
            {name}
          </div>
          {!data.isFlexReserve && (
            <div style={{ fontFamily: theme.mono, fontSize: '0.7rem', color: theme.muted }}>
              Limit: {inr(data.limit)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: theme.display, fontSize: '1.3rem', color: theme.text }}>
            {inr(data.spent)}
          </div>
          {!data.isFlexReserve && (
            <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted }}>
              Spent
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontFamily: theme.display, 
            fontSize: '1.1rem', 
            color: data.isOver ? theme.red : theme.green 
          }}>
            {data.isOver ? `-${inr(data.overAmount)}` : inr(data.remaining)}
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted }}>
            {data.isOver ? 'Overspent' : 'Remaining'}
          </div>
        </div>
      </div>

      {data.isFlexReserve && (
        <div style={{
          marginTop: 8,
          padding: '4px 8px',
          background: `${theme.accent}20`,
          borderRadius: 8,
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: '0.6rem',
          color: theme.accent
        }}>
          🎯 Rollover Reserve
        </div>
      )}
    </div>
  )
}

// ── Smart Suggestion Component ────────────────────────────────────────────────
function SmartSuggestion({ suggestion, onAccept, onDecline }) {
  if (!suggestion) return null

  return (
    <div style={{
      ...glass(0.12, 20),
      border: `1px solid ${theme.accent}`,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      animation: 'fadeUp 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <AlertCircle size={20} color={theme.yellow} />
        <h3 style={{ fontFamily: theme.sans, fontSize: '1rem', color: theme.text, margin: 0 }}>
          You're {inr(suggestion.overspent.overAmount)} over in "{suggestion.overspent.name}"
        </h3>
      </div>

      <p style={{ fontFamily: theme.mono, fontSize: '0.8rem', color: theme.muted, marginBottom: 16 }}>
        Where should we pull this from?
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        {suggestion.available.map(cat => (
          <button
            key={cat.name}
            onClick={() => onAccept(cat, Math.min(cat.remaining, suggestion.overspent.overAmount))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: glass(0.06, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = glass(0.1, 10)
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = glass(0.06, 10)
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRight size={14} color={theme.accent} />
              <span style={{ fontFamily: theme.sans, color: theme.text }}>
                Take it from {cat.name}
              </span>
            </div>
            <span style={{ fontFamily: theme.mono, color: theme.green }}>
              {inr(Math.min(cat.remaining, suggestion.overspent.overAmount))} available
            </span>
          </button>
        ))}

        <button
          onClick={onDecline}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            background: 'transparent',
            border: `1px dashed ${theme.border}`,
            borderRadius: 12,
            cursor: 'pointer',
            color: theme.muted,
            fontFamily: theme.mono,
            fontSize: '0.7rem'
          }}
        >
          <X size={14} /> Reduce next month's allowance instead
        </button>
      </div>
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const [active, setActive] = useState(null)

  const chartData = useMemo(()=>
    Object.entries(data||{})
      .map(([name,value])=>({ name, value, meta:catMeta(name) }))
      .sort((a,b)=>b.value-a.value)
      .slice(0,8)
  , [data])

  const total = chartData.reduce((s,d)=>s+d.value,0)
  const activeItem = active!==null ? chartData[active] : null

  if (!chartData.length) return (
    <div style={{ height:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:theme.muted }}>
      <TrendingDown size={32} strokeWidth={1} style={{opacity:0.3}}/>
      <span style={{ fontFamily:theme.mono, fontSize:'0.68rem', letterSpacing:'0.1em' }}>No spending data</span>
    </div>
  )

  const CustomTooltip = ({ active:a, payload }) => {
    if (!a||!payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ ...glass(0.18,24), border:`1px solid ${theme.borderHi}`, padding:'12px 16px', borderRadius:12, boxShadow:`0 12px 32px rgba(0,0,0,0.5),0 0 0 1px ${d.meta.color}20` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:`${d.meta.color}20`, border:`1px solid ${d.meta.color}35`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <d.meta.icon size={14} style={{color:d.meta.color}}/>
          </div>
          <span style={{ fontFamily:theme.sans, fontSize:'0.85rem', color:theme.text }}>{d.name}</span>
        </div>
        <div style={{ fontFamily:theme.display, fontSize:'1.2rem', color:d.meta.color, textShadow:`0 0 16px ${d.meta.color}50`, marginBottom:4 }}>{inr(d.value)}</div>
        <div style={{ fontFamily:theme.mono, fontSize:'0.58rem', color:theme.muted }}>{total>0?((d.value/total)*100).toFixed(1):0}% of total</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ position:'relative' }}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData} cx="50%" cy="50%"
              innerRadius={70} outerRadius={100}
              paddingAngle={2} dataKey="value"
              startAngle={90} endAngle={-270}
              onMouseEnter={(_,i)=>setActive(i)}
              onMouseLeave={()=>setActive(null)}
            >
              {chartData.map((d,i)=>(
                <Cell key={i}
                  fill={d.meta.color}
                  stroke="none"
                  style={{
                    filter: active===i ? `drop-shadow(0 0 10px ${d.meta.color}90)` : 'none',
                    transform: active===i ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin:'center',
                    transition:'all 0.25s',
                    cursor:'pointer',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/>
          </PieChart>
        </ResponsiveContainer>

        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none', transition:'all 0.25s' }}>
          {activeItem ? (
            <>
              <div style={{ width:32, height:32, borderRadius:10, background:`${activeItem.meta.color}20`, border:`1px solid ${activeItem.meta.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px' }}>
                <activeItem.meta.icon size={15} style={{color:activeItem.meta.color}}/>
              </div>
              <div style={{ fontFamily:theme.display, fontSize:'1.1rem', color:activeItem.meta.color, fontWeight:700, lineHeight:1 }}>{inr(activeItem.value)}</div>
              <div style={{ fontFamily:theme.mono, fontSize:'0.49rem', color:theme.muted, marginTop:3, letterSpacing:'0.1em' }}>{activeItem.name}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Total</div>
              <div style={{ fontFamily:theme.display, fontSize:'1.3rem', color:theme.text, fontWeight:700, lineHeight:1 }}>{inr(total)}</div>
              <div style={{ fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted, marginTop:3 }}>{chartData.length} categories</div>
            </>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 14px', marginTop:14 }}>
        {chartData.map((d,i)=>{
          const pct = total>0?((d.value/total)*100).toFixed(0):0
          const isAct = active===i
          return (
            <div key={i}
              onMouseEnter={()=>setActive(i)}
              onMouseLeave={()=>setActive(null)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', ...glass(isAct?0.08:0.03,10), border:`1px solid ${isAct?d.meta.color+'40':theme.border}`, borderRadius:9, cursor:'pointer', transition:'all 0.2s' }}
            >
              <div style={{ width:22, height:22, borderRadius:6, background:`${d.meta.color}20`, border:`1px solid ${d.meta.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <d.meta.icon size={11} style={{color:d.meta.color}} strokeWidth={2}/>
              </div>
              <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:isAct?theme.text:theme.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, transition:'color 0.2s' }}>{d.name}</span>
              <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:d.meta.color, flexShrink:0 }}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── KPI Summary Card ─────────────────────────────────────────────────────────
function SummaryCard({ label, value, accent, icon:Icon, sub, index=0 }) {
  return (
    <div style={{ ...glass(0.05,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden', boxShadow:gi, animation:`fadeUp 0.4s ${index*0.08}s both` }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:accent, opacity:0.6 }}/>
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ fontFamily:theme.mono, fontSize:'0.51rem', letterSpacing:'0.17em', textTransform:'uppercase', color:theme.muted }}>{label}</div>
        <div style={{ width:28, height:28, ...glass(0.08,10), border:`1px solid ${accent}30`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:accent, flexShrink:0 }}>
          <Icon size={13} strokeWidth={1.8}/>
        </div>
      </div>
      <div style={{ fontFamily:theme.display, fontSize:'1.8rem', fontWeight:700, color:theme.text, lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${accent}30` }}>{value}</div>
      {sub && <div style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:accent }}>{sub}</div>}
    </div>
  )
}

// ── Transaction Item ──────────────────────────────────────────────────────────
function TransactionItem({ transaction, onDelete }) {
  const [hov, setHov] = useState(false)
  const isIncome = transaction.amount > 0
  const c = isIncome ? theme.green : theme.red
  const meta = catMeta(transaction.category)
  const CatIcon = meta.icon

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 10px', background:hov?'rgba(255,255,255,0.028)':'transparent', borderRadius:hov?10:0, borderBottom:`1px solid ${theme.border}`, transition:'all 0.2s', gap:8 }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:11, minWidth:0, flex:1 }}>
        <div style={{ width:36, height:36, flexShrink:0, ...glass(0.08,10), border:`1px solid ${meta.color}30`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color, transition:'all 0.2s', boxShadow:hov?`0 0 12px ${meta.color}30`:'none' }}>
          <CatIcon size={16} strokeWidth={2}/>
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:theme.sans, fontSize:'0.84rem', color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
            {transaction.description}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', background:`${meta.color}15`, color:meta.color, padding:'1px 7px', borderRadius:5, border:`1px solid ${meta.color}28` }}>
              {transaction.category}
            </span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted }}>{fmtDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontFamily:theme.display, fontSize:'1.05rem', color:c, textShadow:`0 0 10px ${c}35`, whiteSpace:'nowrap' }}>
          {isIncome?'+':''}{inr(Math.abs(transaction.amount))}
        </div>
        <button onClick={()=>onDelete(transaction.id,transaction)}
          style={{ ...glass(0.04,8), border:`1px solid transparent`, borderRadius:8, color:theme.muted, padding:'5px 6px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', opacity:hov?1:0.4 }}
          onMouseEnter={e=>{ e.currentTarget.style.color=theme.red; e.currentTarget.style.borderColor=`${theme.red}40`; e.currentTarget.style.background=`${theme.red}10` }}
          onMouseLeave={e=>{ e.currentTarget.style.color=theme.muted; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
        >
          <Trash2 size={13} strokeWidth={1.5}/>
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Budget() {
  const { userId } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [showFlexFund, setShowFlexFund] = useState(false)
  const [draggingFrom, setDraggingFrom] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  
  // Time period states
  const [periodType, setPeriodType] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  // Calculate date range based on period type
  const getDateRange = useCallback(() => {
    const date = new Date(selectedDate)
    let start = ''
    let end = ''

    switch(periodType) {
      case 'day':
        start = date.toISOString().split('T')[0]
        end = start
        break
      
      case 'week': {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(date)
        monday.setDate(diff)
        start = monday.toISOString().split('T')[0]
        
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        end = sunday.toISOString().split('T')[0]
        break
      }
      
      case 'month': {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        start = `${year}-${month.toString().padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`
        break
      }
      
      case 'period':
        start = customStartDate
        end = customEndDate
        break
    }

    return { start, end }
  }, [periodType, selectedDate, customStartDate, customEndDate])

  // Get date range
  const { start, end } = getDateRange()
  const month = currentMonth()
  
  // Use the transactions range hook
  const { data: transactions = [], isLoading } = useTransactionsRange(userId, start, end)
  const deleteTransaction = useDeleteTransaction(userId)
  const addTransaction = useAddTransaction(userId)
  
  // Use the flex budget hook
  const {
    flexFund,
    overspentCategories,
    showSuggestion,
    startDrag,
    dropToRebalance,
    acceptSuggestion,
    rolloverToNextMonth,
    isRollingOver
  } = useFlexBudget(userId, month)

  // Calculate totals from transactions
  const income = useMemo(() => 
    transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0)
  , [transactions])
  
  const expenses = useMemo(() => 
    transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  , [transactions])
  
  const balance = income - expenses
  const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0.0'

  // Group spending by category for chart
  const spendingByCategory = useMemo(() => {
    const spending = {}
    transactions.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || 'Other'
        spending[cat] = (spending[cat] || 0) + Math.abs(Number(t.amount))
      }
    })
    return spending
  }, [transactions])

  const handleDragStart = (category) => {
    setDraggingFrom(category)
    startDrag(category)
  }

  const handleDragEnd = () => {
    setDraggingFrom(null)
    setDropTarget(null)
  }

  const handleDrop = (from, to, amount) => {
    dropToRebalance(from, to, amount)
    setDraggingFrom(null)
    setDropTarget(null)
  }

  const handleAcceptSuggestion = (fromCategory, amount) => {
    acceptSuggestion(fromCategory, amount)
  }

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <Spinner size={36}/>
    </div>
  )

  return (
    <div style={{ display:'grid', gap:22, fontFamily:theme.sans }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="bg-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <TrendingUp size={12} style={{color:theme.accent}} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily:theme.display, fontSize:'2rem', fontWeight:700, color:theme.text, margin:0, lineHeight:1 }}>Budget & Transactions</h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:theme.muted, marginTop:6, letterSpacing:'0.10em' }}>
            Track every rupee
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowFlexFund(!showFlexFund)}
            style={{
              ...glass(0.08, 14),
              border: `1px solid ${showFlexFund ? theme.accent : theme.border}`,
              borderRadius: 10,
              padding: '10px 22px',
              color: showFlexFund ? theme.accent : theme.muted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontFamily: theme.mono,
              fontSize: '0.63rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              transition: 'all 0.25s'
            }}
          >
            <Move size={13} />
            {showFlexFund ? 'Hide Flex Fund' : 'Flex Fund'}
          </button>
          <button className="bg-header-btn"
            onClick={()=>setShowForm(v=>!v)}
            style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(showForm?0.04:0.08,14), border:`1px solid ${showForm?theme.border:theme.accent+'60'}`, borderRadius:10, color:showForm?theme.muted:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.25s', boxShadow:showForm?'none':`0 0 20px ${theme.accentGlow}` }}
          >
            {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> Add Transaction</>}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        periodType={periodType}
        setPeriodType={setPeriodType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        showCustomPicker={showCustomPicker}
        setShowCustomPicker={setShowCustomPicker}
      />

      {/* KPIs */}
      <div className="bg-summary-grid">
        <SummaryCard label="Income"   value={inr(income)}   accent={theme.green} icon={TrendingUp}   sub={`${periodType} total`}                   index={0}/>
        <SummaryCard label="Expenses" value={inr(expenses)} accent={theme.red}   icon={TrendingDown} sub={`${periodType} total`}                  index={1}/>
        <SummaryCard label="Savings"  value={inr(balance)}  accent={balance>=0?theme.blue:theme.red} icon={PiggyBank} sub={`${savingsRate}% savings rate`} index={2}/>
      </div>

      {/* Form */}
      {showForm && <AddTransactionForm onSuccess={()=>setShowForm(false)}/>}

      {/* Smart Suggestions (from Flex Fund) */}
      {showFlexFund && (
        <SmartSuggestion
          suggestion={showSuggestion}
          onAccept={handleAcceptSuggestion}
          onDecline={() => {}}
        />
      )}

      {/* Flex Fund Section */}
      {showFlexFund && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: theme.display, fontSize: '1.3rem', color: theme.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Move size={20} color={theme.accent} />
              Flex Fund
            </h2>
            
            {/* Flex Reserve Stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <span style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted }}>FLEX RESERVE</span>
                <div style={{ fontFamily: theme.display, fontSize: '1.2rem', color: theme.accent }}>
                  {inr(flexFund.flexReserve)}
                </div>
              </div>
              <button
                onClick={() => rolloverToNextMonth()}
                disabled={isRollingOver || flexFund.flexReserve === 0}
                style={{
                  ...glass(0.08, 12),
                  border: `1px solid ${theme.accent}`,
                  borderRadius: 8,
                  padding: '8px 16px',
                  color: theme.accent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isRollingOver || flexFund.flexReserve === 0 ? 'not-allowed' : 'pointer',
                  opacity: isRollingOver || flexFund.flexReserve === 0 ? 0.5 : 1,
                  fontFamily: theme.mono,
                  fontSize: '0.6rem'
                }}
              >
                <RefreshCw size={12} className={isRollingOver ? 'spin' : ''} />
                Rollover
              </button>
            </div>
          </div>

          {/* Category Bubbles Grid */}
          <div className="bg-flex-grid">
            {Object.entries(flexFund.categories)
              .filter(([name]) => name !== 'Flex Reserve')
              .map(([name, data]) => (
                <CategoryBubble
                  key={name}
                  name={name}
                  data={data}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  isDragging={draggingFrom === name}
                  isOverTarget={dropTarget === name}
                />
              ))}

            {/* Flex Reserve Bubble */}
            {flexFund.flexReserve > 0 && (
              <CategoryBubble
                name="Flex Reserve"
                data={flexFund.categories['Flex Reserve']}
                onDragStart={() => {}}
                onDragEnd={() => {}}
                onDrop={() => {}}
              />
            )}
          </div>

          {/* Drag Instruction */}
          <div style={{
            marginTop: 16,
            padding: 12,
            ...glass(0.04, 10),
            borderRadius: 12,
            textAlign: 'center',
            fontFamily: theme.mono,
            fontSize: '0.65rem',
            color: theme.muted
          }}>
            💡 Drag a bubble with surplus onto an overspent bubble to rebalance your budget
          </div>
        </div>
      )}

      {/* Main content: chart + transactions */}
      <div className="bg-main-grid">
        {/* Donut chart card */}
        <div style={{ ...glass(0.04,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden', boxShadow:gi }}>
          <div style={shine}/>
          <SL icon={TrendingDown}>Spending Breakdown</SL>
          <DonutChart data={spendingByCategory}/>
        </div>

        {/* Transactions card */}
        <div style={{ ...glass(0.04,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden', boxShadow:gi }}>
          <div style={shine}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:8 }}>
            <SL icon={Wallet}>Recent Transactions</SL>
            <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted, letterSpacing:'0.08em' }}>
              {transactions.length} entries
            </span>
          </div>

          {!transactions.length ? (
            <div style={{ padding:'40px 0', textAlign:'center', fontFamily:theme.mono, fontSize:'0.7rem', color:theme.muted, opacity:0.5 }}>
              No transactions in this period
            </div>
          ) : (
            <div>
              {transactions.slice(0,12).map(t=>(
                <TransactionItem key={t.id} transaction={t}
                  onDelete={(id,tx)=>deleteTransaction.mutateAsync({id,transaction:tx})}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}