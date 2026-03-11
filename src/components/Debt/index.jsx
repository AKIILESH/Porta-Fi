import { useState, useRef, useEffect } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt } from '../../hooks/useDebts.js'
import { Spinner } from '../shared/ui.jsx'
import { inr } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import {
  Plus, X, AlertTriangle, CreditCard, Home, Car, GraduationCap,
  Briefcase, Heart, ChevronDown, Check, Landmark, Coins,
  TrendingDown, Wallet, Zap, Target, ArrowRight, RefreshCw,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// CSS + KEYFRAMES
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn  { from { opacity:0; transform:scale(0.96) }      to { opacity:1; transform:scale(1) }     }
  @keyframes shimmer { 0%   { transform:translateX(-100%) }            100% { transform:translateX(220%) }     }
  @keyframes gpulse  { 0%,100% { opacity:.2 } 50% { opacity:.5 }                                              }
  @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 ${theme.red}40 } 50% { box-shadow: 0 0 0 6px ${theme.red}00 } }

  .dd-scroll::-webkit-scrollbar       { width:4px }
  .dd-scroll::-webkit-scrollbar-track { background:transparent }
  .dd-scroll::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:4px }

  .d-kpi-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .d-cards-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .d-form-grid  { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:12px; margin-bottom:14px; }
  .d-header     { display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;
                  margin-bottom:26px; padding-bottom:22px; border-bottom:1px solid ${theme.border}; }

  @media (max-width:1200px) { .d-form-grid { grid-template-columns:1fr 1fr 1fr; } }
  @media (max-width:1024px) {
    .d-kpi-grid   { grid-template-columns:repeat(2,1fr); }
    .d-cards-grid { grid-template-columns:1fr; }
    .d-form-grid  { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:767px) {
    .d-kpi-grid   { grid-template-columns:repeat(2,1fr); gap:10px; }
    .d-cards-grid { grid-template-columns:1fr; }
    .d-form-grid  { grid-template-columns:1fr; }
    .d-header     { flex-direction:column; align-items:flex-start; }
    .d-hdr-btn    { width:100%; justify-content:center; }
  }
  @media (max-width:420px) { .d-kpi-grid { grid-template-columns:1fr; } }
`

// ─────────────────────────────────────────────────────────────────────────────
// GLASS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const glass  = (o=0.04, b=20) => ({
  background:           `rgba(255,255,255,${o})`,
  backdropFilter:       `blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
})
const gi    = `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.12)`
const shine = { position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', pointerEvents:'none' }

// ─────────────────────────────────────────────────────────────────────────────
// DEBT TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const DEBT_TYPES = [
  { value:'credit_card',    label:'Credit Card',    icon:CreditCard,    color:'#ef4444' },
  { value:'home_loan',      label:'Home Loan',      icon:Home,          color:'#6366f1' },
  { value:'car_loan',       label:'Car Loan',       icon:Car,           color:'#0ea5e9' },
  { value:'personal_loan',  label:'Personal Loan',  icon:Wallet,        color:'#f59e0b' },
  { value:'education_loan', label:'Education Loan', icon:GraduationCap, color:'#14b8a6' },
  { value:'gold_loan',      label:'Gold Loan',      icon:Coins,         color:'#eab308' },
  { value:'business_loan',  label:'Business Loan',  icon:Briefcase,     color:'#8b5cf6' },
  { value:'medical',        label:'Medical',        icon:Heart,         color:'#ec4899' },
  { value:'other',          label:'Other',          icon:Landmark,      color:'#6b7280' },
]
const debtMeta = v => DEBT_TYPES.find(t => t.value === v) || DEBT_TYPES[DEBT_TYPES.length-1]

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const FL = ({ children, required }) => (
  <div style={{ fontFamily:theme.mono, fontSize:'0.51rem', letterSpacing:'0.17em', textTransform:'uppercase', color:theme.muted, marginBottom:6, display:'flex', alignItems:'center', gap:3 }}>
    {children}{required && <span style={{color:theme.red}}>*</span>}
  </div>
)

const SL = ({ children, icon:Icon, color }) => {
  const c = color || theme.accent
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
      <div style={{ width:3, height:15, background:c, borderRadius:2, boxShadow:`0 0 10px ${c}80` }}/>
      {Icon && <Icon size={13} style={{color:c}} strokeWidth={2}/>}
      <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:c }}>{children}</span>
    </div>
  )
}

const inputBase = {
  ...glass(0.05,14),
  border:`1px solid ${theme.border}`, borderRadius:10,
  color:theme.text, fontFamily:theme.mono, fontSize:'0.73rem',
  padding:'10px 13px', outline:'none', width:'100%',
  transition:'border-color 0.2s, box-shadow 0.2s',
  boxShadow:`inset 0 2px 5px rgba(0,0,0,0.22)`,
}

const GInput = ({ value, onChange, type='text', placeholder, min, step, disabled }) => (
  <input value={value} type={type} placeholder={placeholder} min={min} step={step}
    disabled={disabled} onChange={e => onChange(e.target.value)}
    style={{ ...inputBase, opacity:disabled?0.45:1 }}
    onFocus={e => { if(!disabled){ e.target.style.borderColor=`${theme.accent}70`; e.target.style.boxShadow=`inset 0 2px 5px rgba(0,0,0,0.22),0 0 0 3px ${theme.accentDim}` }}}
    onBlur={e  => { e.target.style.borderColor=theme.border; e.target.style.boxShadow=`inset 0 2px 5px rgba(0,0,0,0.22)` }}
  />
)

// ─────────────────────────────────────────────────────────────────────────────
// STYLED DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function TypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sel = debtMeta(value)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(v=>!v)} style={{
        ...inputBase, display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:8, cursor:'pointer',
        border:`1px solid ${open ? `${theme.accent}70` : theme.border}`,
        boxShadow: open ? `inset 0 2px 5px rgba(0,0,0,0.22),0 0 0 3px ${theme.accentDim}` : `inset 0 2px 5px rgba(0,0,0,0.22)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:`${sel.color}1a`, border:`1px solid ${sel.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <sel.icon size={12} style={{color:sel.color}} strokeWidth={2}/>
          </div>
          <span style={{ color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.72rem' }}>{sel.label}</span>
        </div>
        <ChevronDown size={13} style={{ color:theme.muted, flexShrink:0, transform:open?'rotate(180deg)':'none', transition:'transform 0.22s' }}/>
      </button>

      {open && (
        <div className="dd-scroll" style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, ...glass(0.16,26), border:`1px solid ${theme.borderHi}`, borderRadius:13, maxHeight:260, overflowY:'auto', zIndex:1400, boxShadow:'0 20px 50px rgba(0,0,0,0.55)', animation:'fadeIn 0.17s ease', padding:5 }}>
          {DEBT_TYPES.map(opt => {
            const isAct = value === opt.value
            return (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', width:'100%', background:isAct?`${opt.color}18`:'transparent', border:'none', borderRadius:9, color:isAct?opt.color:theme.text, fontFamily:theme.mono, fontSize:'0.71rem', textAlign:'left', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>{ if(!isAct) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
                onMouseLeave={e=>{ if(!isAct) e.currentTarget.style.background='transparent' }}
              >
                <div style={{ width:26, height:26, borderRadius:8, background:`${opt.color}1a`, border:`1px solid ${opt.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <opt.icon size={13} style={{color:isAct?opt.color:theme.muted}} strokeWidth={2}/>
                </div>
                <span style={{flex:1}}>{opt.label}</span>
                {isAct && <Check size={12} style={{color:opt.color, flexShrink:0}}/>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI TILE
// ─────────────────────────────────────────────────────────────────────────────
function KpiTile({ label, value, accent, sub, icon:Icon, index=0 }) {
  return (
    <div style={{ ...glass(0.05,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden', boxShadow:gi, animation:`fadeUp 0.4s ${index*0.07}s both` }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:accent, opacity:0.6 }}/>
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <FL>{label}</FL>
        {Icon && (
          <div style={{ width:28, height:28, ...glass(0.08,10), border:`1px solid ${accent}30`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:accent, flexShrink:0 }}>
            <Icon size={13} strokeWidth={1.8}/>
          </div>
        )}
      </div>
      <div style={{ fontFamily:theme.display, fontSize:'1.8rem', fontWeight:700, color:theme.text, lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${accent}30` }}>{value}</div>
      {sub && <div style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:accent }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE BADGE
// ─────────────────────────────────────────────────────────────────────────────
function RateBadge({ rate }) {
  const c = rate > 18 ? theme.red : rate > 10 ? theme.yellow : theme.green
  return (
    <span style={{ fontFamily:theme.mono, fontSize:'0.58rem', letterSpacing:'0.08em', background:`${c}14`, color:c, padding:'3px 9px', border:`1px solid ${c}30`, borderRadius:6, display:'inline-flex', alignItems:'center', gap:4 }}>
      <Zap size={9} strokeWidth={2}/>{rate}% p.a.
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR (glass track + shimmer fill)
// ─────────────────────────────────────────────────────────────────────────────
function GlassBar({ value, max, color, height=4 }) {
  const p = max > 0 ? Math.min(100, (value/max)*100) : 0
  return (
    <div style={{ height, ...glass(0.04,8), border:`1px solid ${theme.border}`, borderRadius:height, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${p}%`, background:`linear-gradient(90deg,${color}80,${color})`, borderRadius:height, transition:'width 0.7s ease', boxShadow:`0 0 8px ${color}50`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', animation:'shimmer 2.2s infinite' }}/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function DebtSkeleton() {
  return (
    <div style={{ display:'grid', gap:18 }}>
      <div className="d-kpi-grid">
        {[0,1,2,3].map(i => (
          <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:16, height:100, animation:`gpulse 1.8s ${i*0.12}s ease-in-out infinite` }}/>
        ))}
      </div>
      <div style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:64, animation:'gpulse 1.8s 0.5s ease-in-out infinite' }}/>
      <div className="d-cards-grid">
        {[0,1].map(i => (
          <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:18, height:280, animation:`gpulse 1.8s ${i*0.2}s ease-in-out infinite` }}/>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD DEBT FORM
// ─────────────────────────────────────────────────────────────────────────────
function AddDebtForm({ onDone }) {
  const { userId } = useFinance()
  const addDebt = useAddDebt(userId)
  const [form, setForm] = useState({ name:'', type:'personal_loan', balance:'', rate:'', min_payment:'' })
  const [err, setErr] = useState('')
  const set = k => v => setForm(f => ({...f, [k]:v}))

  const meta = debtMeta(form.type)
  const monthlyInt = form.balance && form.rate ? (+form.balance * +form.rate / 100) / 12 : 0
  const isHighRate = +form.rate > 18

  const submit = async () => {
    if (!form.name || !form.balance || !form.rate) { setErr('Name, balance and rate are required'); return }
    setErr('')
    try {
      await addDebt.mutateAsync({ name:form.name, type:form.type, balance:+form.balance, original_balance:+form.balance, rate:+form.rate, min_payment:+form.min_payment||0 })
      onDone()
    } catch(e) { setErr(e.message) }
  }

  return (
    <div style={{ ...glass(0.06,22), border:`1px solid ${meta.color}30`, borderLeft:`2px solid ${meta.color}`, borderRadius:18, padding:26, position:'relative', overflow:'hidden', boxShadow:`${gi},0 0 30px ${meta.color}0a`, animation:'fadeUp 0.3s ease', marginBottom:4 }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, background:`radial-gradient(circle,${meta.color}0c 0%,transparent 70%)`, pointerEvents:'none' }}/>

      <SL icon={meta.icon} color={meta.color}>Add New Debt</SL>

      <div className="d-form-grid">
        <div>
          <FL required>Debt Name</FL>
          <GInput value={form.name} onChange={set('name')} placeholder="e.g. HDFC Home Loan"/>
        </div>
        <div>
          <FL>Type</FL>
          <TypeDropdown value={form.type} onChange={set('type')}/>
        </div>
        <div>
          <FL required>Balance (₹)</FL>
          <GInput value={form.balance} onChange={set('balance')} type="number" min="0" placeholder="500000"/>
        </div>
        <div>
          <FL required>Rate (% p.a.)</FL>
          <GInput value={form.rate} onChange={set('rate')} type="number" step="0.01" min="0" placeholder="8.5"/>
        </div>
        <div>
          <FL>Min EMI (₹)</FL>
          <GInput value={form.min_payment} onChange={set('min_payment')} type="number" min="0" placeholder="5000"/>
        </div>
      </div>

      {/* Live preview */}
      {form.balance && form.rate && (
        <div style={{ padding:'10px 16px', ...glass(0.06,12), border:`1px solid ${isHighRate?theme.red+'40':theme.border}`, borderLeft:`2px solid ${isHighRate?theme.red:meta.color}`, borderRadius:10, marginBottom:14, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', animation:'fadeUp 0.2s ease' }}>
          <span style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted }}>Monthly interest</span>
          <span style={{ fontFamily:theme.display, fontSize:'1.1rem', color:isHighRate?theme.red:meta.color, textShadow:`0 0 12px ${isHighRate?theme.red:meta.color}50` }}>{inr(monthlyInt)}</span>
          {isHighRate && (
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:theme.mono, fontSize:'0.58rem', color:theme.red, background:`${theme.red}10`, padding:'3px 10px', borderRadius:6, border:`1px solid ${theme.red}28` }}>
              <AlertTriangle size={10} strokeWidth={2}/> High interest rate
            </span>
          )}
        </div>
      )}

      {err && (
        <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.red, padding:'9px 13px', ...glass(0.04,10), border:`1px solid ${theme.red}28`, borderRadius:9, marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
          <AlertTriangle size={12} strokeWidth={2}/>{err}
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={submit} disabled={addDebt.isPending} style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${meta.color}50`, borderRadius:10, color:meta.color, padding:'10px 24px', cursor:addDebt.isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.65rem', letterSpacing:'0.16em', textTransform:'uppercase', opacity:addDebt.isPending?0.6:1, transition:'all 0.2s', boxShadow:`0 0 16px ${meta.color}18` }}
          onMouseEnter={e=>{ if(!addDebt.isPending) e.currentTarget.style.boxShadow=`0 0 28px ${meta.color}35` }}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 16px ${meta.color}18`}
        >
          {addDebt.isPending ? <Spinner size={13}/> : <><Plus size={14}/>Add Debt</>}
        </button>
        <button onClick={onDone} style={{ display:'inline-flex', alignItems:'center', gap:7, ...glass(0.04,12), border:`1px solid ${theme.border}`, borderRadius:10, color:theme.muted, padding:'10px 20px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.2s' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${theme.border}`; e.currentTarget.style.color=theme.text }}
          onMouseLeave={e=>{ e.currentTarget.style.color=theme.muted }}
        >
          <X size={13}/>Cancel
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBT CARD
// ─────────────────────────────────────────────────────────────────────────────
function DebtCard({ debt, rank, index=0 }) {
  const { userId }  = useFinance()
  const updateDebt  = useUpdateDebt(userId)
  const deleteDebt  = useDeleteDebt(userId)
  const [paying, setPaying]   = useState(false)
  const [customAmt, setAmt]   = useState('')
  const [hov, setHov]         = useState(false)

  const meta        = debtMeta(debt.type)
  const paid        = Math.max(0, (debt.original_balance||debt.balance) - debt.balance)
  const origBal     = debt.original_balance || debt.balance
  const progress    = origBal > 0 ? Math.min((paid/origBal)*100, 100) : 0
  const monthlyInt  = (Number(debt.balance)*Number(debt.rate)/100)/12
  const rateColor   = debt.rate>18 ? theme.red : debt.rate>10 ? theme.yellow : theme.green
  const barColor    = progress>80 ? theme.green : progress>40 ? theme.yellow : theme.red
  const isPending   = updateDebt.isPending || deleteDebt.isPending
  const isTop       = rank === 0

  const makePayment = async amt => {
    if (!amt || amt <= 0) return
    await updateDebt.mutateAsync({ id:debt.id, updates:{ balance:Math.max(0, debt.balance-amt) } })
    setAmt(''); setPaying(false)
  }
  const handleDelete = async () => {
    if (window.confirm('Delete this debt?')) await deleteDebt.mutateAsync(debt.id)
  }

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        ...glass(hov?0.07:0.04, 22),
        border:`1px solid ${isTop?`${meta.color}45`:hov?theme.borderHi:theme.border}`,
        borderLeft:`2px solid ${isTop?meta.color:hov?`${meta.color}60`:'transparent'}`,
        borderRadius:18, padding:24, position:'relative', overflow:'hidden',
        transition:'all 0.3s ease',
        boxShadow:hov?`${gi},0 0 30px ${meta.color}12`:gi,
        animation:`fadeUp 0.4s ${index*0.1}s both`,
      }}
    >
      <div style={shine}/>
      {/* Ambient glow blob */}
      <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, background:`radial-gradient(circle,${meta.color}${hov?'14':'09'} 0%,transparent 70%)`, pointerEvents:'none', transition:'opacity 0.3s' }}/>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${meta.color}60,transparent)` }}/>

      {/* Avalanche badge */}
      {isTop && (
        <div style={{ position:'absolute', top:14, right:52, fontFamily:theme.mono, fontSize:'0.49rem', letterSpacing:'0.18em', textTransform:'uppercase', ...glass(0.1,12), color:theme.red, padding:'3px 9px', border:`1px solid ${theme.red}30`, borderRadius:6, display:'flex', alignItems:'center', gap:5, animation:'pulse-ring 2.5s ease-in-out infinite' }}>
          <Target size={9} strokeWidth={2.5}/> Avalanche Target
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, minWidth:0, flex:1 }}>
          <div style={{ width:40, height:40, flexShrink:0, ...glass(0.1,12), border:`1px solid ${meta.color}35`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:meta.color, boxShadow:hov?`0 0 16px ${meta.color}40`:'none', transition:'box-shadow 0.3s' }}>
            <meta.icon size={18} strokeWidth={1.8}/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:theme.sans, fontWeight:600, fontSize:'0.92rem', color:theme.text, marginBottom:7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{debt.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontFamily:theme.mono, fontSize:'0.56rem', letterSpacing:'0.06em', ...glass(0.06,8), color:theme.muted, padding:'2px 9px', border:`1px solid ${theme.border}`, borderRadius:6 }}>
                {meta.label}
              </span>
              <RateBadge rate={debt.rate}/>
            </div>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleteDebt.isPending}
          style={{ ...glass(0.04,8), border:`1px solid transparent`, borderRadius:8, color:theme.muted, padding:'6px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', flexShrink:0 }}
          onMouseEnter={e=>{ e.currentTarget.style.color=theme.red; e.currentTarget.style.borderColor=`${theme.red}40`; e.currentTarget.style.background=`${theme.red}10` }}
          onMouseLeave={e=>{ e.currentTarget.style.color=theme.muted; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
        >
          {deleteDebt.isPending ? <Spinner size={12}/> : <X size={14} strokeWidth={1.8}/>}
        </button>
      </div>

      {/* Balance grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
        <div style={{ ...glass(0.06,14), border:`1px solid ${theme.red}25`, borderRadius:12, padding:'14px 16px' }}>
          <FL>Remaining</FL>
          <div style={{ fontFamily:theme.display, fontSize:'1.65rem', fontWeight:700, color:theme.red, lineHeight:1, textShadow:`0 0 16px ${theme.red}40` }}>{inr(debt.balance)}</div>
        </div>
        <div style={{ ...glass(0.04,14), border:`1px solid ${theme.border}`, borderRadius:12, padding:'14px 16px' }}>
          <FL>Original</FL>
          <div style={{ fontFamily:theme.display, fontSize:'1.65rem', fontWeight:700, color:theme.muted, lineHeight:1 }}>{inr(origBal)}</div>
          <div style={{ fontFamily:theme.mono, fontSize:'0.56rem', color:rateColor, marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={9} strokeWidth={2}/>{inr(monthlyInt)}/mo interest
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:18 }}>
        <GlassBar value={paid} max={origBal} color={barColor} height={5}/>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:7, flexWrap:'wrap', gap:4 }}>
          <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:barColor }}>{progress.toFixed(1)}% paid off</span>
          <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted }}>{inr(paid)} cleared</span>
        </div>
      </div>

      {/* Payment panel */}
      {paying ? (
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:100 }}>
            <GInput value={customAmt} onChange={setAmt} type="number" min="0" placeholder="Enter amount (₹)" disabled={isPending}/>
          </div>
          <button onClick={()=>makePayment(Number(customAmt))} disabled={isPending||!customAmt||+customAmt<=0}
            style={{ display:'flex', alignItems:'center', gap:6, ...glass(0.08,12), border:`1px solid ${theme.green}50`, borderRadius:9, color:theme.green, padding:'9px 16px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.62rem', letterSpacing:'0.1em', transition:'all 0.2s', opacity:(isPending||!customAmt||+customAmt<=0)?0.5:1, boxShadow:`0 0 12px ${theme.green}18` }}>
            {isPending ? <Spinner size={11}/> : <><ArrowRight size={13}/>Pay</>}
          </button>
          <button onClick={()=>setPaying(false)}
            style={{ ...glass(0.04,10), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:'9px 11px', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.2s' }}>
            <X size={13}/>
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {debt.min_payment > 0 && (
            <button onClick={()=>makePayment(debt.min_payment)} disabled={isPending}
              style={{ ...glass(0.06,10), border:`1px solid ${theme.blue}30`, color:theme.blue, padding:'7px 13px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.1em', borderRadius:9, transition:'all 0.2s', opacity:isPending?0.5:1, display:'flex', alignItems:'center', gap:5 }}
              onMouseEnter={e=>{ if(!isPending) e.currentTarget.style.boxShadow=`0 0 14px ${theme.blue}30` }}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
            >
              <CreditCard size={11} strokeWidth={2}/> EMI {inr(debt.min_payment)}
            </button>
          )}
          {[5000,10000].map(a => (
            <button key={a} onClick={()=>makePayment(a)} disabled={isPending}
              style={{ ...glass(0.06,10), border:`1px solid ${theme.accent}30`, color:theme.accent, padding:'7px 13px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.1em', borderRadius:9, transition:'all 0.2s', opacity:isPending?0.5:1 }}
              onMouseEnter={e=>{ if(!isPending) e.currentTarget.style.boxShadow=`0 0 14px ${theme.accent}28` }}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
            >+{inr(a)}</button>
          ))}
          <button onClick={()=>setPaying(true)} disabled={isPending}
            style={{ ...glass(0.04,10), border:`1px solid ${theme.border}`, color:theme.muted, padding:'7px 13px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.1em', borderRadius:9, transition:'all 0.2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${theme.accent}60`; e.currentTarget.style.color=theme.accentLt }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
          >Custom</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Debt() {
  const { userId } = useFinance()
  const { data:debts=[], isLoading, error, refetch } = useDebts(userId)
  const [adding, setAdding] = useState(false)

  if (isLoading) return <><style>{CSS}</style><DebtSkeleton/></>

  if (error) return (
    <div style={{ ...glass(0.06,20), border:`1px solid ${theme.red}40`, borderRadius:18, padding:40, textAlign:'center' }}>
      <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.red, marginBottom:20 }}>
        <AlertTriangle size={24} strokeWidth={1.5} style={{ display:'block', margin:'0 auto 12px', opacity:0.7 }}/>
        Error loading debts: {error.message}
      </div>
      <button onClick={()=>refetch()} style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${theme.accent}50`, borderRadius:10, color:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.16em', textTransform:'uppercase' }}>
        <RefreshCw size={13}/> Retry
      </button>
    </div>
  )

  const totalDebt     = debts.reduce((s,d) => s+Number(d.balance), 0)
  const monthlyMin    = debts.reduce((s,d) => s+Number(d.min_payment||0), 0)
  const totalInterest = debts.reduce((s,d) => s+(d.balance*d.rate/100)/12, 0)
  const highestRate   = debts.reduce((h,d) => (!h||d.rate>h.rate)?d:h, null)
  const sorted        = [...debts].sort((a,b) => b.rate-a.rate)

  return (
    <div style={{ display:'grid', gap:22, fontFamily:theme.sans }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="d-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <TrendingDown size={12} style={{color:theme.red}} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.red }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily:theme.display, fontSize:'2rem', fontWeight:700, color:theme.text, margin:0, lineHeight:1 }}>Debt Tracker</h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:theme.muted, marginTop:6, letterSpacing:'0.10em' }}>
            Loans · Credit cards · EMIs · Avalanche strategy
          </p>
        </div>
        <button className="d-hdr-btn"
          onClick={()=>setAdding(v=>!v)}
          style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(adding?0.04:0.08,14), border:`1px solid ${adding?theme.border:theme.red+'60'}`, borderRadius:10, color:adding?theme.muted:theme.red, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.25s', boxShadow:adding?'none':`0 0 20px ${theme.red}12` }}
        >
          {adding ? <><X size={13}/>Cancel</> : <><Plus size={13}/>Add Debt</>}
        </button>
      </div>

      {/* KPIs */}
      <div className="d-kpi-grid">
        <KpiTile label="Total Debt"       value={inr(totalDebt)}     accent={theme.red}    icon={TrendingDown}  sub={`${debts.length} active debts`}    index={0}/>
        <KpiTile label="Monthly EMIs"     value={inr(monthlyMin)}    accent={theme.yellow} icon={CreditCard}    sub="Minimum commitments"               index={1}/>
        <KpiTile label="Monthly Interest" value={inr(totalInterest)} accent={theme.red}    icon={Zap}           sub="Cost of debt this month"            index={2}/>
        <KpiTile label="Highest Rate"     value={highestRate?`${highestRate.rate}%`:'—'} accent={theme.red} icon={Target} sub={highestRate?.name||'No debts'} index={3}/>
      </div>

      {/* Avalanche tip */}
      {debts.length > 1 && (
        <div style={{ ...glass(0.05,18), border:`1px solid ${theme.yellow}30`, borderLeft:`2px solid ${theme.yellow}`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, animation:'fadeUp 0.4s 0.3s both' }}>
          <AlertTriangle size={14} style={{color:theme.yellow, flexShrink:0, marginTop:1}} strokeWidth={1.8}/>
          <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted, lineHeight:1.8 }}>
            <span style={{ color:theme.accentLt, letterSpacing:'0.08em' }}>Avalanche strategy</span>
            {' — '}Pay minimums on all debts, then direct extra toward{' '}
            <span style={{ color:theme.red }}>{sorted[0]?.name} ({sorted[0]?.rate}% APR)</span>
            {' '}first — minimises total interest paid.
          </div>
        </div>
      )}

      {/* Form */}
      {adding && <AddDebtForm onDone={()=>setAdding(false)}/>}

      {/* Empty state */}
      {debts.length===0 && !adding && (
        <div style={{ ...glass(0.04,18), border:`1px dashed ${theme.border}`, borderRadius:18, padding:'60px 0', textAlign:'center' }}>
          <TrendingDown size={36} strokeWidth={1} style={{ color:theme.muted, margin:'0 auto 14px', opacity:0.25, display:'block' }}/>
          <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.muted, opacity:0.5 }}>
            No debts tracked yet.<br/>Add your loans and credit cards above.
          </div>
        </div>
      )}

      {/* Debt cards */}
      <div className="d-cards-grid">
        {sorted.map((d,i) => <DebtCard key={d.id} debt={d} rank={i} index={i}/>)}
      </div>
    </div>
  )
}