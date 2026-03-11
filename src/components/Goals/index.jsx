import { useState, useRef, useEffect } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal } from '../../hooks/useGoals.js'
import { Spinner } from '../shared/ui.jsx'
import { inr, inrCompact } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import {
  Target, Home, Plane, GraduationCap, Car, Heart, Laptop, Shield,
  TrendingUp, Umbrella, Dumbbell, Music, Globe, Coins, Gift,
  Plus, X, CheckCircle, ChevronDown, Check, AlertTriangle,
  RefreshCw, Zap, Calendar, ArrowRight, Sparkles, Clock,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp    { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn    { from { opacity:0; transform:scale(0.96) }      to { opacity:1; transform:scale(1) }     }
  @keyframes shimmer   { 0%   { transform:translateX(-100%) }            100% { transform:translateX(220%) }     }
  @keyframes gpulse    { 0%,100% { opacity:.2 } 50% { opacity:.5 }                                              }
  @keyframes celebrate { 0%   { transform:scale(1) }  50% { transform:scale(1.06) } 100% { transform:scale(1) } }
  @keyframes spin      { to   { transform:rotate(360deg) } }

  .g-header      { display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;
                   margin-bottom:26px; padding-bottom:22px; border-bottom:1px solid ${theme.border}; }
  .g-kpi-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .g-goals-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
  .g-form-grid   { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:12px; margin-bottom:14px; }
  .g-ef-stats    { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }

  .g-icon-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: ${theme.borderHi} !important; }

  .dd-menu::-webkit-scrollbar       { width:4px }
  .dd-menu::-webkit-scrollbar-track { background:transparent }
  .dd-menu::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:4px }

  @media (max-width:1024px) {
    .g-kpi-grid  { grid-template-columns:repeat(3,1fr); }
    .g-form-grid { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:767px) {
    .g-header    { flex-direction:column; align-items:flex-start; }
    .g-hdr-btn   { width:100%; justify-content:center; }
    .g-kpi-grid  { grid-template-columns:repeat(2,1fr); gap:10px; }
    .g-goals-grid{ grid-template-columns:1fr; }
    .g-form-grid { grid-template-columns:1fr; }
    .g-ef-stats  { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:420px) {
    .g-kpi-grid  { grid-template-columns:1fr; }
    .g-ef-stats  { grid-template-columns:1fr; }
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// GLASS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const glass = (o=0.04, b=20) => ({
  background:           `rgba(255,255,255,${o})`,
  backdropFilter:       `blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
})
const gi    = `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.12)`
const shine = { position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', pointerEvents:'none' }

// ─────────────────────────────────────────────────────────────────────────────
// GOAL ICONS — each with a color
// ─────────────────────────────────────────────────────────────────────────────
const GOAL_ICONS = [
  { name:'Target',        icon:Target,        color:'#00d4ff', label:'General'      },
  { name:'Home',          icon:Home,          color:'#6366f1', label:'House'        },
  { name:'Plane',         icon:Plane,         color:'#0ea5e9', label:'Travel'       },
  { name:'GraduationCap', icon:GraduationCap, color:'#14b8a6', label:'Education'    },
  { name:'Car',           icon:Car,           color:'#f59e0b', label:'Vehicle'      },
  { name:'Heart',         icon:Heart,         color:'#ec4899', label:'Wedding'      },
  { name:'Laptop',        icon:Laptop,        color:'#8b5cf6', label:'Tech'         },
  { name:'Shield',        icon:Shield,        color:'#22c55e', label:'Safety'       },
  { name:'TrendingUp',    icon:TrendingUp,    color:'#00d4ff', label:'Investment'   },
  { name:'Umbrella',      icon:Umbrella,      color:'#38bdf8', label:'Vacation'     },
  { name:'Dumbbell',      icon:Dumbbell,      color:'#ef4444', label:'Health'       },
  { name:'Music',         icon:Music,         color:'#a78bfa', label:'Hobby'        },
  { name:'Globe',         icon:Globe,         color:'#10b981', label:'World Trip'   },
  { name:'Coins',         icon:Coins,         color:'#eab308', label:'Savings'      },
  { name:'Gift',          icon:Gift,          color:'#fb7185', label:'Gift'         },
]

const iconByName = name => GOAL_ICONS.find(i => i.name === name) || GOAL_ICONS[0]

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
// ICON PICKER DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function IconPickerDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sel = iconByName(value)

  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(v=>!v)} style={{
        ...inputBase, display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:8, cursor:'pointer',
        border:`1px solid ${open?`${theme.accent}70`:theme.border}`,
        boxShadow: open ? `inset 0 2px 5px rgba(0,0,0,0.22),0 0 0 3px ${theme.accentDim}` : `inset 0 2px 5px rgba(0,0,0,0.22)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:8, background:`${sel.color}1a`, border:`1px solid ${sel.color}35`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <sel.icon size={13} style={{color:sel.color}} strokeWidth={2}/>
          </div>
          <span style={{ color:theme.text, fontSize:'0.72rem' }}>{sel.label}</span>
        </div>
        <ChevronDown size={13} style={{ color:theme.muted, transform:open?'rotate(180deg)':'none', transition:'transform 0.22s', flexShrink:0 }}/>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, ...glass(0.16,26), border:`1px solid ${theme.borderHi}`, borderRadius:13, zIndex:1400, boxShadow:'0 20px 50px rgba(0,0,0,0.55)', animation:'fadeIn 0.17s ease', padding:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5 }}>
            {GOAL_ICONS.map(opt => {
              const isAct = value === opt.name
              return (
                <button key={opt.name} type="button"
                  onClick={() => { onChange(opt.name); setOpen(false) }}
                  title={opt.label}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'8px 4px', ...glass(isAct?0.1:0.02,8), border:`1px solid ${isAct?opt.color+'50':theme.border}`, borderRadius:9, cursor:'pointer', transition:'all 0.15s', background:isAct?`${opt.color}18`:'transparent' }}
                  onMouseEnter={e=>{ if(!isAct) e.currentTarget.style.background='rgba(255,255,255,0.06)' }}
                  onMouseLeave={e=>{ if(!isAct) e.currentTarget.style.background='transparent' }}
                >
                  <opt.icon size={16} style={{color:isAct?opt.color:theme.muted}} strokeWidth={isAct?2:1.5}/>
                  <span style={{ fontFamily:theme.mono, fontSize:'0.42rem', color:isAct?opt.color:theme.muted, letterSpacing:'0.05em', textAlign:'center', lineHeight:1 }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHS DROPDOWN  (for emergency fund)
// ─────────────────────────────────────────────────────────────────────────────
function MonthsDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const opts = [
    { v:3,  label:'3 months', sub:'Minimum safety' },
    { v:6,  label:'6 months', sub:'Recommended' },
    { v:9,  label:'9 months', sub:'Conservative' },
    { v:12, label:'12 months', sub:'Very safe' },
  ]
  const sel = opts.find(o => o.v === value) || opts[1]

  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(v=>!v)} style={{ ...inputBase, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, cursor:'pointer', border:`1px solid ${open?`${theme.accent}70`:theme.border}`, boxShadow: open?`inset 0 2px 5px rgba(0,0,0,0.22),0 0 0 3px ${theme.accentDim}`:`inset 0 2px 5px rgba(0,0,0,0.22)` }}>
        <div>
          <span style={{ color:theme.text, fontSize:'0.72rem' }}>{sel.label}</span>
          <span style={{ color:theme.muted, fontSize:'0.62rem', marginLeft:8 }}>{sel.sub}</span>
        </div>
        <ChevronDown size={13} style={{ color:theme.muted, transform:open?'rotate(180deg)':'none', transition:'transform 0.22s', flexShrink:0 }}/>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, ...glass(0.16,26), border:`1px solid ${theme.borderHi}`, borderRadius:12, zIndex:1400, boxShadow:'0 16px 40px rgba(0,0,0,0.5)', animation:'fadeIn 0.17s ease', overflow:'hidden' }}>
          {opts.map(o => (
            <button key={o.v} type="button"
              onClick={() => { onChange(o.v); setOpen(false) }}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:value===o.v?`${theme.accent}12`:'transparent', border:'none', borderBottom:`1px solid ${theme.border}`, color:value===o.v?theme.accent:theme.text, fontFamily:theme.mono, fontSize:'0.71rem', cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e=>{ if(value!==o.v) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
              onMouseLeave={e=>{ if(value!==o.v) e.currentTarget.style.background='transparent' }}
            >
              <span>{o.label}</span>
              <span style={{ fontSize:'0.63rem', color:theme.muted }}>{o.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GLASS PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
function GlassBar({ value, max, color, height=5 }) {
  const p = max > 0 ? Math.min(100, (value/max)*100) : 0
  return (
    <div style={{ height, ...glass(0.04,8), border:`1px solid ${theme.border}`, borderRadius:height, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${p}%`, background:`linear-gradient(90deg,${color}70,${color})`, borderRadius:height, transition:'width 0.8s ease', boxShadow:`0 0 10px ${color}50`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)', animation:'shimmer 2.5s infinite' }}/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI TILE
// ─────────────────────────────────────────────────────────────────────────────
function KpiTile({ label, value, accent, sub, icon:Icon, index=0 }) {
  return (
    <div style={{ ...glass(0.05,20), border:`1px solid ${theme.border}`, borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden', boxShadow:gi, animation:`fadeUp 0.4s ${index*0.08}s both` }}>
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
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function GoalsSkeleton() {
  return (
    <div style={{ display:'grid', gap:18 }}>
      <div style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:18, height:220, animation:'gpulse 1.8s ease-in-out infinite' }}/>
      <div className="g-kpi-grid">
        {[0,1,2].map(i => <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:16, height:100, animation:`gpulse 1.8s ${i*0.15}s ease-in-out infinite` }}/>)}
      </div>
      <div className="g-goals-grid">
        {[0,1,2].map(i => <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:18, height:240, animation:`gpulse 1.8s ${i*0.2}s ease-in-out infinite` }}/>)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY FUND CARD
// ─────────────────────────────────────────────────────────────────────────────
function EmergencyFundCard({ emergencyFund, onUpdate, isPending }) {
  const { monthlyExpenses, cashBalance } = useFinance()
  const [editing, setEditing]   = useState(false)
  const [targetMonths, setTM]   = useState(6)

  const current   = cashBalance || 0
  const target    = monthlyExpenses * targetMonths
  const progress  = target > 0 ? Math.min((current/target)*100, 100) : 0
  const remaining = Math.max(0, target - current)
  const achieved  = current >= target
  const coverage  = monthlyExpenses > 0 ? (current/monthlyExpenses).toFixed(1) : '0'
  const accent    = achieved ? theme.green : theme.yellow

  const barColor  = achieved ? theme.green : progress > 70 ? theme.yellow : theme.red

  const handleSave = async () => {
    await onUpdate({ target, saved:current })
    setEditing(false)
  }

  return (
    <div style={{ ...glass(0.06,24), border:`1px solid ${achieved?`${theme.green}40`:`${theme.yellow}30`}`, borderLeft:`2px solid ${accent}`, borderRadius:18, padding:28, position:'relative', overflow:'hidden', boxShadow:`${gi},0 0 30px ${accent}0a`, animation:'fadeUp 0.4s ease' }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, background:`radial-gradient(circle,${accent}10 0%,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${accent}60,transparent)` }}/>

      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:46, height:46, ...glass(0.1,14), border:`1px solid ${accent}40`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:accent, boxShadow:`0 0 20px ${accent}30`, flexShrink:0 }}>
            <Shield size={20} strokeWidth={1.8}/>
          </div>
          <div>
            <SL icon={Shield} color={accent}>Emergency Fund</SL>
            <div style={{ fontFamily:theme.sans, fontSize:'0.88rem', color:theme.muted, marginTop:-12 }}>
              {achieved
                ? `✓ Fully funded — ${coverage} months of expenses covered`
                : `${inr(remaining)} more to reach ${targetMonths}-month safety net`
              }
            </div>
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:7, ...glass(0.05,10), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:'8px 16px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.2s', flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${accent}60`; e.currentTarget.style.color=accent }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
          >
            <Zap size={11} strokeWidth={2}/> Update Target
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ animation:'fadeUp 0.2s ease' }}>
          <div style={{ marginBottom:14 }}>
            <FL>Target months of expenses</FL>
            <MonthsDropdown value={targetMonths} onChange={setTM}/>
          </div>
          {monthlyExpenses > 0 && (
            <div style={{ padding:'10px 14px', ...glass(0.06,12), border:`1px solid ${accent}30`, borderLeft:`2px solid ${accent}`, borderRadius:10, marginBottom:14, fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted, display:'flex', alignItems:'center', gap:10 }}>
              <span>Target amount:</span>
              <span style={{ color:accent, fontFamily:theme.display, fontSize:'1.1rem' }}>{inr(target)}</span>
              <span>· Currently:</span>
              <span style={{ color:theme.text }}>{inr(current)}</span>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSave} disabled={isPending}
              style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${accent}50`, borderRadius:10, color:accent, padding:'10px 22px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.65rem', letterSpacing:'0.16em', textTransform:'uppercase', opacity:isPending?0.6:1, transition:'all 0.2s', boxShadow:`0 0 14px ${accent}18` }}>
              {isPending ? <Spinner size={13}/> : <><Check size={13}/> Save</>}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ display:'inline-flex', alignItems:'center', gap:7, ...glass(0.04,10), border:`1px solid ${theme.border}`, borderRadius:10, color:theme.muted, padding:'10px 18px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.13em', textTransform:'uppercase', transition:'all 0.2s' }}>
              <X size={13}/> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Big progress + amounts */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10, flexWrap:'wrap', gap:6 }}>
              <div style={{ fontFamily:theme.display, fontSize:'2.2rem', fontWeight:700, color:theme.text, lineHeight:1, textShadow:`0 0 24px ${accent}30` }}>{inr(current)}</div>
              <div style={{ fontFamily:theme.mono, fontSize:'0.63rem', color:theme.muted }}>target: <span style={{color:theme.text}}>{inr(target)}</span></div>
            </div>
            <GlassBar value={current} max={target} color={barColor} height={6}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:7, flexWrap:'wrap', gap:4 }}>
              <span style={{ fontFamily:theme.mono, fontSize:'0.56rem', color:barColor }}>{progress.toFixed(1)}% funded</span>
              <span style={{ fontFamily:theme.mono, fontSize:'0.56rem', color:theme.muted }}>{targetMonths}-month goal</span>
            </div>
          </div>

          {/* Stat pills */}
          <div className="g-ef-stats">
            {[
              { label:'Status',        value:achieved?'✓ Funded':`${progress.toFixed(0)}%`, color:accent },
              { label:'Monthly Need',  value:inr(monthlyExpenses),                           color:theme.text },
              { label:'Coverage',      value:`${coverage} months`,                           color:theme.text },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...glass(0.06,12), border:`1px solid ${theme.border}`, borderRadius:12, padding:'12px 14px' }}>
                <FL>{label}</FL>
                <div style={{ fontFamily:theme.display, fontSize:'1.1rem', color, fontWeight:700 }}>{value}</div>
              </div>
            ))}
          </div>

          {!achieved && (
            <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
              {[['Add from Cash','/cash'],['Trim Budget','/budget']].map(([label,href]) => (
                <button key={label} onClick={() => window.location.href=href}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, ...glass(0.05,10), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:'7px 14px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.12em', textTransform:'uppercase', transition:'all 0.2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${accent}60`; e.currentTarget.style.color=accent }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
                >
                  <ArrowRight size={10} strokeWidth={2.5}/>{label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD GOAL FORM
// ─────────────────────────────────────────────────────────────────────────────
function AddGoalForm({ onDone, userId }) {
  const addGoal = useAddGoal(userId)
  const [form, setForm] = useState({ name:'', iconName:'Target', target:'', saved:'', deadline:'' })
  const [err, setErr]   = useState('')
  const set = k => v => setForm(f => ({...f, [k]:v}))

  const selIcon = iconByName(form.iconName)
  const monthlyNeeded = form.target && form.deadline
    ? Math.max(0, (+form.target - (+form.saved||0)) / Math.max(1, Math.ceil((new Date(form.deadline)-new Date())/2592000000)))
    : null

  const submit = async () => {
    if (!form.name || !form.target) { setErr('Name and target amount are required'); return }
    if (+form.target <= 0) { setErr('Target must be greater than 0'); return }
    setErr('')
    try {
      await addGoal.mutateAsync({ name:form.name, icon:form.iconName, target:+form.target, saved:+form.saved||0, deadline:form.deadline||null })
      onDone()
    } catch(e) { setErr(e.message) }
  }

  return (
    <div style={{ ...glass(0.06,22), border:`1px solid ${selIcon.color}30`, borderLeft:`2px solid ${selIcon.color}`, borderRadius:18, padding:26, position:'relative', overflow:'hidden', boxShadow:`${gi},0 0 30px ${selIcon.color}0a`, animation:'fadeUp 0.3s ease', marginBottom:4 }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, background:`radial-gradient(circle,${selIcon.color}0c 0%,transparent 70%)`, pointerEvents:'none' }}/>

      <SL icon={selIcon.icon} color={selIcon.color}>New Goal</SL>

      {/* Icon picker */}
      <div style={{ marginBottom:14 }}>
        <FL>Goal Type</FL>
        <IconPickerDropdown value={form.iconName} onChange={set('iconName')}/>
      </div>

      <div className="g-form-grid">
        <div>
          <FL required>Goal Name</FL>
          <GInput value={form.name} onChange={set('name')} placeholder="e.g. House Down Payment"/>
        </div>
        <div>
          <FL required>Target (₹)</FL>
          <GInput value={form.target} onChange={set('target')} type="number" min="0" placeholder="500000"/>
        </div>
        <div>
          <FL>Already Saved (₹)</FL>
          <GInput value={form.saved} onChange={set('saved')} type="number" min="0" placeholder="0"/>
        </div>
        <div>
          <FL>Deadline</FL>
          <GInput value={form.deadline} onChange={set('deadline')} type="date"/>
        </div>
      </div>

      {/* Smart preview */}
      {form.target && (
        <div style={{ padding:'10px 16px', ...glass(0.06,12), border:`1px solid ${selIcon.color}30`, borderLeft:`2px solid ${selIcon.color}`, borderRadius:10, marginBottom:14, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', animation:'fadeUp 0.2s ease' }}>
          <Sparkles size={13} style={{color:selIcon.color, flexShrink:0}}/>
          <span style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted }}>Target:</span>
          <span style={{ fontFamily:theme.display, fontSize:'1.1rem', color:selIcon.color }}>{inr(+form.target)}</span>
          {form.saved && +form.saved > 0 && <>
            <span style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted }}>· Head start:</span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.green }}>{inr(+form.saved)}</span>
          </>}
          {monthlyNeeded !== null && <>
            <span style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted }}>· Save monthly:</span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:selIcon.color }}>{inr(monthlyNeeded)}</span>
          </>}
        </div>
      )}

      {err && (
        <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.red, padding:'9px 13px', ...glass(0.04,10), border:`1px solid ${theme.red}28`, borderRadius:9, marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
          <AlertTriangle size={12} strokeWidth={2}/>{err}
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={submit} disabled={addGoal.isPending}
          style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${selIcon.color}50`, borderRadius:10, color:selIcon.color, padding:'10px 24px', cursor:addGoal.isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.65rem', letterSpacing:'0.16em', textTransform:'uppercase', opacity:addGoal.isPending?0.6:1, transition:'all 0.2s', boxShadow:`0 0 16px ${selIcon.color}18` }}
          onMouseEnter={e=>{ if(!addGoal.isPending) e.currentTarget.style.boxShadow=`0 0 28px ${selIcon.color}35` }}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 16px ${selIcon.color}18`}
        >
          {addGoal.isPending ? <Spinner size={13}/> : <><Plus size={14}/> Create Goal</>}
        </button>
        <button onClick={onDone}
          style={{ display:'inline-flex', alignItems:'center', gap:7, ...glass(0.04,12), border:`1px solid ${theme.border}`, borderRadius:10, color:theme.muted, padding:'10px 18px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.2s' }}>
          <X size={13}/> Cancel
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function GoalCard({ goal, index=0 }) {
  const { userId }  = useFinance()
  const updateGoal  = useUpdateGoal(userId)
  const deleteGoal  = useDeleteGoal(userId)
  const [depositing, setDepositing] = useState(false)
  const [customAmt, setAmt]         = useState('')
  const [hov, setHov]               = useState(false)

  const meta      = iconByName(goal.icon)
  const progress  = goal.target > 0 ? Math.min((goal.saved/goal.target)*100, 100) : 0
  const remaining = goal.target - goal.saved
  const done      = progress >= 100
  const accent    = done ? theme.green : meta.color
  const barColor  = done ? theme.green : progress > 80 ? theme.yellow : meta.color
  const isPending = updateGoal.isPending || deleteGoal.isPending

  const daysLeft  = goal.deadline ? Math.ceil((new Date(goal.deadline)-new Date())/86400000) : null
  const urgent    = daysLeft !== null && daysLeft < 30 && !done

  // Monthly pace needed
  const monthsLeft = daysLeft ? daysLeft/30 : null
  const monthlyPace = (monthsLeft && monthsLeft > 0 && remaining > 0)
    ? Math.ceil(remaining/monthsLeft) : null

  const deposit = async amt => {
    await updateGoal.mutateAsync({ id:goal.id, updates:{ saved:Math.min(goal.saved+amt, goal.target) } })
  }
  const handleCustom = async () => {
    if (!customAmt || isNaN(customAmt) || +customAmt <= 0) return
    await deposit(Number(customAmt)); setAmt(''); setDepositing(false)
  }
  const handleDelete = async () => {
    if (window.confirm('Delete this goal?')) await deleteGoal.mutateAsync(goal.id)
  }

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        ...glass(hov?0.07:0.04,22),
        border:`1px solid ${done?`${theme.green}45`:urgent?`${theme.red}35`:hov?theme.borderHi:theme.border}`,
        borderLeft:`2px solid ${accent}`,
        borderRadius:18, padding:24, position:'relative', overflow:'hidden',
        transition:'all 0.3s ease',
        boxShadow: hov ? `${gi},0 0 28px ${accent}12` : gi,
        animation:`fadeUp 0.4s ${index*0.09}s both`,
      }}
    >
      <div style={shine}/>
      <div style={{ position:'absolute', top:-50, right:-50, width:160, height:160, background:`radial-gradient(circle,${accent}${hov?'14':'09'} 0%,transparent 70%)`, pointerEvents:'none', transition:'opacity 0.3s' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,${accent}60,transparent)` }}/>

      {/* Completed ribbon */}
      {done && (
        <div style={{ position:'absolute', top:12, right:44, display:'flex', alignItems:'center', gap:5, ...glass(0.1,12), border:`1px solid ${theme.green}35`, borderRadius:7, padding:'3px 9px', color:theme.green, fontFamily:theme.mono, fontSize:'0.49rem', letterSpacing:'0.16em', textTransform:'uppercase', animation:'celebrate 0.6s ease' }}>
          <CheckCircle size={10} strokeWidth={2.5}/> Achieved!
        </div>
      )}
      {urgent && !done && (
        <div style={{ position:'absolute', top:12, right:44, display:'flex', alignItems:'center', gap:5, ...glass(0.1,12), border:`1px solid ${theme.red}35`, borderRadius:7, padding:'3px 9px', color:theme.red, fontFamily:theme.mono, fontSize:'0.49rem', letterSpacing:'0.16em', textTransform:'uppercase' }}>
          <Clock size={10} strokeWidth={2.5}/> Urgent
        </div>
      )}

      {/* Card header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 }}>
          <div style={{ width:42, height:42, flexShrink:0, ...glass(0.1,12), border:`1px solid ${accent}35`, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', color:accent, boxShadow:hov?`0 0 18px ${accent}40`:'none', transition:'box-shadow 0.3s' }}>
            <meta.icon size={18} strokeWidth={1.8}/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:theme.sans, fontWeight:600, fontSize:'0.9rem', color:theme.text, marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{goal.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', background:`${accent}14`, color:accent, padding:'2px 8px', border:`1px solid ${accent}28`, borderRadius:6 }}>
                {meta.label}
              </span>
              {daysLeft !== null && (
                <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:urgent?theme.red:theme.muted, display:'flex', alignItems:'center', gap:4 }}>
                  <Calendar size={9} strokeWidth={2}/>
                  {done ? 'Done' : daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleteGoal.isPending}
          style={{ ...glass(0.04,8), border:`1px solid transparent`, borderRadius:8, color:theme.muted, padding:'6px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', flexShrink:0 }}
          onMouseEnter={e=>{ e.currentTarget.style.color=theme.red; e.currentTarget.style.borderColor=`${theme.red}40`; e.currentTarget.style.background=`${theme.red}10` }}
          onMouseLeave={e=>{ e.currentTarget.style.color=theme.muted; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
        >
          {deleteGoal.isPending ? <Spinner size={12}/> : <X size={14} strokeWidth={1.8}/>}
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:9, flexWrap:'wrap', gap:4 }}>
          <div style={{ fontFamily:theme.display, fontSize:'1.55rem', fontWeight:700, color:done?theme.green:theme.text, lineHeight:1, textShadow:`0 0 16px ${accent}30` }}>
            {inrCompact(goal.saved)}
          </div>
          <div style={{ fontFamily:theme.mono, fontSize:'0.63rem', color:theme.muted }}>
            of <span style={{color:theme.text}}>{inrCompact(goal.target)}</span>
          </div>
        </div>
        <GlassBar value={goal.saved} max={goal.target} color={barColor} height={5}/>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:7, flexWrap:'wrap', gap:4 }}>
          <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:barColor }}>{progress.toFixed(1)}%</span>
          <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted, display:'flex', alignItems:'center', gap:5 }}>
            {done
              ? <><CheckCircle size={11} style={{color:theme.green}}/><span style={{color:theme.green}}>Reached!</span></>
              : `${inrCompact(remaining)} to go`
            }
          </span>
        </div>
      </div>

      {/* Monthly pace hint */}
      {monthlyPace && !done && (
        <div style={{ ...glass(0.05,10), border:`1px solid ${theme.border}`, borderRadius:9, padding:'7px 12px', marginBottom:14, display:'flex', alignItems:'center', gap:8, fontFamily:theme.mono, fontSize:'0.58rem', color:theme.muted }}>
          <TrendingUp size={11} style={{color:accent, flexShrink:0}}/>
          Save <span style={{color:accent, margin:'0 3px'}}>{inrCompact(monthlyPace)}/mo</span> to hit your deadline
        </div>
      )}

      {/* Deposit actions */}
      {!done && (
        depositing ? (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:100 }}>
              <GInput value={customAmt} onChange={setAmt} type="number" min="0" placeholder="Enter amount (₹)" disabled={isPending}/>
            </div>
            <button onClick={handleCustom} disabled={isPending||!customAmt||+customAmt<=0}
              style={{ display:'flex', alignItems:'center', gap:6, ...glass(0.08,12), border:`1px solid ${accent}50`, borderRadius:9, color:accent, padding:'10px 16px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.62rem', letterSpacing:'0.1em', transition:'all 0.2s', opacity:(isPending||!customAmt||+customAmt<=0)?0.5:1, boxShadow:`0 0 12px ${accent}18` }}>
              {isPending ? <Spinner size={11}/> : <><ArrowRight size={13}/> Add</>}
            </button>
            <button onClick={() => setDepositing(false)}
              style={{ ...glass(0.04,10), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:'10px 11px', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.2s' }}>
              <X size={13}/>
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {[1000,5000,10000].map(a => (
              <button key={a} onClick={() => deposit(a)} disabled={isPending}
                style={{ ...glass(0.06,10), border:`1px solid ${accent}30`, color:accent, padding:'7px 12px', cursor:isPending?'not-allowed':'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.1em', borderRadius:9, transition:'all 0.2s', opacity:isPending?0.5:1 }}
                onMouseEnter={e=>{ if(!isPending) e.currentTarget.style.boxShadow=`0 0 14px ${accent}30` }}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
              >+{inrCompact(a)}</button>
            ))}
            <button onClick={() => setDepositing(true)} disabled={isPending}
              style={{ ...glass(0.04,10), border:`1px solid ${theme.border}`, color:theme.muted, padding:'7px 12px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.59rem', letterSpacing:'0.1em', borderRadius:9, transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${accent}60`; e.currentTarget.style.color=accent }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
            >Custom</button>
          </div>
        )
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GOALS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Goals() {
  const { userId, monthlyExpenses, cashBalance } = useFinance()
  const { data:goals=[], isLoading, error, refetch } = useGoals(userId)
  const addGoal    = useAddGoal(userId)
  const updateGoal = useUpdateGoal(userId)
  const [adding, setAdding] = useState(false)

  const emergencyFund = goals.find(g => g.name === 'Emergency Fund')
  const otherGoals    = goals.filter(g => g.name !== 'Emergency Fund')
  const totalSaved    = otherGoals.reduce((s,g) => s+Number(g.saved), 0)
  const totalTarget   = otherGoals.reduce((s,g) => s+Number(g.target), 0)
  const doneCount     = otherGoals.filter(g => g.saved >= g.target).length
  const urgentCount   = otherGoals.filter(g => {
    if (g.saved >= g.target) return false
    const d = g.deadline ? Math.ceil((new Date(g.deadline)-new Date())/86400000) : null
    return d !== null && d < 30
  }).length

  const handleEmUpdate = async updates => {
    if (emergencyFund) await updateGoal.mutateAsync({ id:emergencyFund.id, updates })
    else await addGoal.mutateAsync({ name:'Emergency Fund', icon:'Shield', target:updates.target||monthlyExpenses*6, saved:cashBalance||0, deadline:null })
  }

  if (isLoading) return <><style>{CSS}</style><GoalsSkeleton/></>

  if (error) return (
    <div style={{ ...glass(0.06,20), border:`1px solid ${theme.red}40`, borderRadius:18, padding:40, textAlign:'center' }}>
      <AlertTriangle size={28} strokeWidth={1.5} style={{ color:theme.red, display:'block', margin:'0 auto 14px', opacity:0.6 }}/>
      <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.red, marginBottom:20 }}>Error loading goals: {error.message}</div>
      <button onClick={()=>refetch()} style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${theme.accent}50`, borderRadius:10, color:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.16em', textTransform:'uppercase' }}>
        <RefreshCw size={13}/> Retry
      </button>
    </div>
  )

  return (
    <div style={{ display:'grid', gap:22, fontFamily:theme.sans }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="g-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={12} style={{color:theme.accent}} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily:theme.display, fontSize:'2rem', fontWeight:700, color:theme.text, margin:0, lineHeight:1 }}>Goals & Milestones</h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:theme.muted, marginTop:6, letterSpacing:'0.10em' }}>
            Emergency fund · Savings targets · Life milestones
            {urgentCount > 0 && <span style={{ color:theme.red, marginLeft:10 }}>· {urgentCount} urgent</span>}
          </p>
        </div>
        <button className="g-hdr-btn"
          onClick={() => setAdding(v=>!v)}
          style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(adding?0.04:0.08,14), border:`1px solid ${adding?theme.border:`${theme.accent}60`}`, borderRadius:10, color:adding?theme.muted:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', transition:'all 0.25s', boxShadow:adding?'none':`0 0 20px ${theme.accentGlow}` }}
        >
          {adding ? <><X size={13}/>Cancel</> : <><Plus size={13}/>New Goal</>}
        </button>
      </div>

      {/* Emergency Fund */}
      <EmergencyFundCard
        emergencyFund={emergencyFund||{saved:0,target:monthlyExpenses*6}}
        onUpdate={handleEmUpdate}
        isPending={updateGoal.isPending||addGoal.isPending}
      />

      {/* KPIs */}
      <div className="g-kpi-grid">
        <KpiTile label="Active Goals"  value={otherGoals.length}       accent={theme.accent}  icon={Target}     sub={`${doneCount} completed`}                                         index={0}/>
        <KpiTile label="Total Saved"   value={inrCompact(totalSaved)}  accent={theme.green}   icon={TrendingUp} sub="Across all goals"                                                 index={1}/>
        <KpiTile label="Total Target"  value={inrCompact(totalTarget)} accent={theme.blue}    icon={Coins}      sub={totalTarget>0?`${((totalSaved/totalTarget)*100).toFixed(0)}% funded`:'Set your targets'} index={2}/>
      </div>

      {/* Add form */}
      {adding && <AddGoalForm onDone={() => setAdding(false)} userId={userId}/>}

      {/* Empty */}
      {otherGoals.length === 0 && !adding ? (
        <div style={{ ...glass(0.04,18), border:`1px dashed ${theme.border}`, borderRadius:18, padding:'60px 0', textAlign:'center' }}>
          <Target size={36} strokeWidth={1} style={{ color:theme.muted, margin:'0 auto 16px', opacity:0.25, display:'block' }}/>
          <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.muted, opacity:0.5, marginBottom:20 }}>
            No goals yet. Create your first savings milestone.
          </div>
          <button onClick={() => setAdding(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(0.08,12), border:`1px solid ${theme.accent}50`, borderRadius:10, color:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.14em', textTransform:'uppercase', boxShadow:`0 0 16px ${theme.accentGlow}` }}>
            <Plus size={13}/> Create First Goal
          </button>
        </div>
      ) : (
        <div className="g-goals-grid">
          {otherGoals
            .sort((a,b) => {
              // Urgent first, then in-progress, then completed
              const aD = a.deadline ? Math.ceil((new Date(a.deadline)-new Date())/86400000) : 9999
              const bD = b.deadline ? Math.ceil((new Date(b.deadline)-new Date())/86400000) : 9999
              const aDone = a.saved >= a.target
              const bDone = b.saved >= b.target
              if (aDone && !bDone) return 1
              if (!aDone && bDone) return -1
              return aD - bD
            })
            .map((g,i) => <GoalCard key={g.id} goal={g} index={i}/>)
          }
        </div>
      )}
    </div>
  )
}