// src/pages/TaxCosts.jsx
import { useState, useRef, useEffect ,useMemo} from "react"
import { useTheme }    from '../../context/ThemeContext.jsx'
import { useFinance }  from '../../context/FinanceContext.jsx'
import { useTaxCosts } from '../../hooks/useTaxCosts'
import { inr, inrCompact } from '../../lib/formatters.js'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, Zap, Shield, Receipt, RefreshCw, Lock, Unlock,
  Calendar, ChevronDown, ChevronRight, CircleDot,
  ArrowUp, ArrowDown, Layers, BarChart3, Scale,
  Percent, Clock, Target,
} from 'lucide-react'

// ─── Glass helpers ─────────────────────────────────────────────────────────
const makeGlass = (isDark, o = 0.04, b = 20) => ({
  background:           isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.6})`,
  backdropFilter:       `blur(${b}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(160%)`,
})
const makeInset = (isDark) => isDark
  ? `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
  : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.04)`
const shine = {
  position:'absolute', top:0, left:'10%', right:'10%', height:1,
  background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
  pointerEvents:'none',
}

// ─── Shared primitives ─────────────────────────────────────────────────────
function SectionLabel({ children, theme }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
      <div style={{ width:3, height:14, background:theme.accent, borderRadius:2 }}/>
      <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>
        {children}
      </span>
    </div>
  )
}

function StatCard({ icon:Icon, label, value, sub, color, theme, isDark }) {
  const gi = makeInset(isDark)
  return (
    <div style={{
      ...makeGlass(isDark, 0.04, 16),
      border:`1px solid ${theme.border}`,
      borderRadius:14, padding:'16px 18px',
      position:'relative', overflow:'hidden',
      boxShadow: gi,
      flex:1, minWidth:140,
    }}>
      <div style={shine}/>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
        <div style={{
          width:26, height:26, borderRadius:8,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: color ? `${color}14` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
          border:`1px solid ${color ? color+'28' : theme.border}`,
          color: color || theme.muted,
        }}>
          <Icon size={12} strokeWidth={1.8}/>
        </div>
        <span style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily:theme.display||theme.sans, fontSize:'1.4rem', fontWeight:600, color: color || theme.text, lineHeight:1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, marginTop:5 }}>{sub}</div>}
    </div>
  )
}

function InfoRow({ icon:Icon, label, value, color, theme, mono }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, color:theme.muted }}>
        <Icon size={11} strokeWidth={1.8} style={{ flexShrink:0 }}/>
        <span style={{ fontFamily:theme.mono, fontSize:'0.58rem', letterSpacing:'0.04em' }}>{label}</span>
      </div>
      <span style={{ fontFamily: mono ? theme.mono : theme.sans, fontSize:'0.70rem', fontWeight:500, color: color || theme.text }}>
        {value}
      </span>
    </div>
  )
}

function Divider({ theme }) {
  return <div style={{ height:1, background:theme.border, margin:'2px 0' }}/>
}

function Badge({ color, icon:Icon, children, theme }) {
  const map = { green:'#22c55e', red:'#ef4444', yellow:'#f59e0b', blue:'#3b82f6', purple:'#a78bfa' }
  const c = map[color] || map.blue
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:999,
      background:`${c}14`, border:`1px solid ${c}28`, color:c,
      fontFamily:theme.mono, fontSize:'0.50rem',
      letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0,
    }}>
      {Icon && <Icon size={9} strokeWidth={2}/>}
      {children}
    </div>
  )
}

// ─── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ pct, color, height=5, theme, isDark }) {
  return (
    <div style={{ height, borderRadius:999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow:'hidden' }}>
      <div style={{
        width:`${Math.min(pct,100)}%`, height:'100%', borderRadius:999,
        background: color, boxShadow:`0 0 6px ${color}40`,
        transition:'width 1s cubic-bezier(0.4,0,0.2,1)',
      }}/>
    </div>
  )
}

// ─── Card wrapper ──────────────────────────────────────────────────────────
function Card({ children, theme, isDark, style={} }) {
  return (
    <div style={{
      ...makeGlass(isDark, 0.04, 16),
      border:`1px solid ${theme.border}`,
      borderRadius:14, overflow:'hidden',
      position:'relative',
      boxShadow: makeInset(isDark),
      ...style,
    }}>
      <div style={shine}/>
      {children}
    </div>
  )
}

function CardHeader({ icon:Icon, title, badge, theme, isDark }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'12px 16px', borderBottom:`1px solid ${theme.border}`,
    }}>
      <div style={{
        width:24, height:24, borderRadius:7, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border:`1px solid ${theme.border}`, color:theme.muted,
      }}>
        <Icon size={12} strokeWidth={1.8}/>
      </div>
      <span style={{ fontFamily:theme.mono, fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:theme.muted, flex:1 }}>
        {title}
      </span>
      {badge}
    </div>
  )
}

// ─── Expandable holding row ────────────────────────────────────────────────
function ExpandableRow({ children, summary, theme, isDark }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom:`1px solid ${theme.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:8,
          padding:'12px 16px', background:'transparent', border:'none',
          cursor:'pointer', textAlign:'left',
          transition:'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ChevronRight size={12} strokeWidth={2} style={{
          color:theme.muted, flexShrink:0,
          transform: open ? 'rotate(90deg)' : 'none',
          transition:'transform 0.2s',
        }}/>
        {summary}
      </button>
      {open && (
        <div style={{ padding:'0 16px 14px 36px', display:'flex', flexDirection:'column', gap:8 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// TAB 1 — COST X-RAY
// ──────────────────────────────────────────────────────────────────────────
function CostXRay({ data, theme, isDark }) {
  const { costXray = [], costSummary = {} } = data
  const hasExpense = costXray.some(h => h.expense_ratio != null)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Summary cards */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <StatCard icon={Percent}  label="Annual Drag"     value={inrCompact(costSummary.total_annual_drag||0)}
          sub="expense ratio cost p.a." color={theme.red}   theme={theme} isDark={isDark}/>
        <StatCard icon={Receipt}  label="Stamp Duty Paid" value={inrCompact(costSummary.total_stamp_duty||0)}
          sub="across all buy trades"   color={theme.yellow} theme={theme} isDark={isDark}/>
        <StatCard icon={Lock}     label="Exit Load Risk"  value={inrCompact(costSummary.total_exit_load_risk||0)}
          sub="if you sold locked units today" color={theme.orange||'#f97316'} theme={theme} isDark={isDark}/>
      </div>

      {/* Per holding breakdown */}
      <Card theme={theme} isDark={isDark}>
        <CardHeader icon={Layers} title="Hidden Cost Breakdown — Per Holding" theme={theme} isDark={isDark}/>

        {/* Table header */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 90px 90px 90px 90px',
          gap:8, padding:'8px 16px',
          borderBottom:`1px solid ${theme.border}`,
        }}>
          {['Holding','Exp. Ratio','Annual Drag','Stamp Duty Paid','Exit Load Risk'].map((h,i) => (
            <span key={h} style={{
              fontFamily:theme.mono, fontSize:'0.48rem', letterSpacing:'0.14em',
              textTransform:'uppercase', color:theme.muted,
              textAlign: i > 0 ? 'right' : 'left',
            }}>{h}</span>
          ))}
        </div>

        {costXray.map(h => (
          <ExpandableRow key={h.holding_id} theme={theme} isDark={isDark}
            summary={
              <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 90px 90px', gap:8, flex:1, alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.text, fontWeight:500 }}>{h.ticker}</div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted }}>{h.name?.slice(0,32)}{h.name?.length > 32 ? '…' : ''}</div>
                </div>
                <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.expense_ratio ? theme.red : theme.muted, textAlign:'right' }}>
                  {h.expense_ratio != null ? `${h.expense_ratio}%` : '—'}
                </div>
                <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.annual_drag_inr ? theme.red : theme.muted, textAlign:'right' }}>
                  {h.annual_drag_inr != null ? inrCompact(h.annual_drag_inr) : '—'}
                </div>
                <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.yellow, textAlign:'right' }}>
                  {inrCompact(h.stamp_duty_paid)}
                </div>
                <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.exit_load_risk > 0 ? theme.red : theme.muted, textAlign:'right' }}>
                  {h.exit_load_risk > 0 ? inrCompact(h.exit_load_risk) : '—'}
                </div>
              </div>
            }
          >
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <InfoRow icon={CircleDot} label="Current Value"        value={inrCompact(h.current_value)}                       theme={theme}/>
              <InfoRow icon={Percent}   label="Expense Ratio"        value={h.expense_ratio != null ? `${h.expense_ratio}% p.a.` : 'N/A (ETF/Equity)'}  theme={theme}/>
              {h.annual_drag_inr != null && (
                <InfoRow icon={TrendingDown} label="Annual Drag (INR)"  value={inrCompact(h.annual_drag_inr)} color={theme.red}   theme={theme}/>
              )}
              {h.ten_year_drag != null && (
                <InfoRow icon={BarChart3}    label="10-Year Drag (Est)" value={inrCompact(h.ten_year_drag)}   color={theme.red}   theme={theme}/>
              )}
              <Divider theme={theme}/>
              <InfoRow icon={Receipt}   label="Stamp Duty Paid"      value={inrCompact(h.stamp_duty_paid)}    color={theme.yellow} theme={theme}/>
              <InfoRow icon={Lock}      label="Exit Load %"          value={h.exit_load_pct > 0 ? `${h.exit_load_pct}% within lock-in` : 'No exit load'} theme={theme}/>
              {h.exit_load_risk > 0 && (
                <InfoRow icon={AlertTriangle} label="Exit Load Risk Today" value={inrCompact(h.exit_load_risk)} color={theme.red} theme={theme}/>
              )}
              <InfoRow icon={Shield}    label="Plan Type"            value={h.plan_type === 'direct' ? 'Direct — no distributor commission' : 'Regular — distributor commission applies'} theme={theme}/>
            </div>
          </ExpandableRow>
        ))}

        {costXray.length === 0 && (
          <div style={{ padding:'32px 16px', textAlign:'center', color:theme.muted, fontFamily:theme.mono, fontSize:'0.65rem' }}>
            No holdings found
          </div>
        )}
      </Card>

      {/* Insight box */}
      <div style={{
        ...makeGlass(isDark, 0.03, 14),
        border:`1px solid ${theme.border}`,
        borderLeft:`2px solid ${theme.yellow}`,
        borderRadius:10, padding:'12px 14px',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:theme.muted }}>
          <Info size={11} strokeWidth={1.8}/>
          <span style={{ fontFamily:theme.mono, fontSize:'0.50rem', letterSpacing:'0.16em', textTransform:'uppercase' }}>How to read this</span>
        </div>
        <p style={{ fontFamily:theme.sans, fontSize:'0.78rem', color:theme.muted, lineHeight:1.65, margin:0 }}>
          <strong style={{ color:theme.text }}>Expense ratio</strong> is already embedded in the NAV of mutual funds — you never see it as a deduction.
          It compounds silently over time. The <strong style={{ color:theme.text }}>10-Year Drag</strong> shows what you give up over a decade.
          Switching from Regular to Direct plans of the same fund eliminates the distributor commission (typically 0.5–1% extra per year).
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// TAB 2 — EXIT LOAD TRACKER
// ──────────────────────────────────────────────────────────────────────────
function ExitLoadTracker({ data, theme, isDark }) {
  const { exitLots = [], exitSummary = {} } = data
  const locked = exitLots.filter(l => l.is_locked)
  const free   = exitLots.filter(l => !l.is_locked)
    const { userId } = useFinance()


  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Summary */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <StatCard icon={Lock}    label="Locked Value"   value={inrCompact(exitSummary.total_locked||0)}
          sub={`${exitSummary.locked_count||0} lots still in lock-in`}  color={theme.red}    theme={theme} isDark={isDark}/>
        <StatCard icon={AlertTriangle} label="Exit Load Risk" value={inrCompact(exitSummary.total_exit_risk||0)}
          sub="penalty if redeemed today"                               color={theme.yellow}  theme={theme} isDark={isDark}/>
        <StatCard icon={Calendar} label="Next Free Date" value={exitSummary.next_free_date
          ? new Date(exitSummary.next_free_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
          : 'All free'}
          sub="earliest lot clears exit load"                           color={theme.green}   theme={theme} isDark={isDark}/>
      </div>

      {/* Locked lots */}
      {locked.length > 0 && (
        <Card theme={theme} isDark={isDark}>
          <CardHeader icon={Lock} title="Locked Lots — Exit Load Applies"
            badge={<Badge color="red" icon={AlertTriangle} theme={theme}>{locked.length} lots</Badge>}
            theme={theme} isDark={isDark}/>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {locked.map(lot => (
              <div key={lot.lot_id} style={{
                padding:'14px 16px',
                borderBottom:`1px solid ${theme.border}`,
              }}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.text, fontWeight:500 }}>{lot.ticker}</div>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.54rem', color:theme.muted, marginTop:2 }}>
                      {lot.name?.slice(0,40)}{lot.name?.length > 40 ? '…' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.red, fontWeight:500 }}>
                      -{inrCompact(lot.exit_load_amount)} penalty
                    </div>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, marginTop:2 }}>
                      if redeemed today
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted }}>
                      Bought {new Date(lot.purchase_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.green }}>
                      Free {new Date(lot.free_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                  </div>
                  <ProgressBar pct={lot.progress_pct} color={lot.progress_pct > 75 ? theme.green : lot.progress_pct > 40 ? theme.yellow : theme.red} height={6} theme={theme} isDark={isDark}/>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.50rem', color:theme.muted }}>
                      {lot.progress_pct.toFixed(0)}% complete
                    </span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.50rem', color:theme.yellow }}>
                      {lot.days_remaining} days remaining
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  {[
                    ['Units', lot.units_remaining.toFixed(4)],
                    ['Current Value', inrCompact(lot.current_value)],
                    ['Exit Load %', `${lot.exit_load_pct}%`],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      ...makeGlass(isDark, 0.03, 10),
                      border:`1px solid ${theme.border}`,
                      borderRadius:8, padding:'8px 10px',
                    }}>
                      <div style={{ fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                      <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.text, fontWeight:500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Free lots */}
      {free.length > 0 && (
        <Card theme={theme} isDark={isDark}>
          <CardHeader icon={Unlock} title="Free Lots — No Exit Load"
            badge={<Badge color="green" icon={CheckCircle} theme={theme}>{free.length} lots</Badge>}
            theme={theme} isDark={isDark}/>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {free.map(lot => (
              <div key={lot.lot_id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'11px 16px', borderBottom:`1px solid ${theme.border}`,
              }}>
                <div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.text, fontWeight:500 }}>{lot.ticker}</div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, marginTop:1 }}>
                    Bought {new Date(lot.purchase_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    · {lot.units_remaining.toFixed(4)} units
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.green }}>
                    {inrCompact(lot.current_value)}
                  </div>
                  <Badge color="green" icon={Unlock} theme={theme}>Free to redeem</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {exitLots.length === 0 && (
        <div style={{ padding:'48px 16px', textAlign:'center', color:theme.muted, fontFamily:theme.mono, fontSize:'0.65rem' }}>
          No lots with exit load found
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// TAB 3 — TAX P&L
// ──────────────────────────────────────────────────────────────────────────
function TaxPnL({ data, theme, isDark }) {
  const { unrealisedPnL = [], realisedTrades = [], taxSummary = {} } = data
  const { userId } = useFinance()

  const gains  = unrealisedPnL.filter(h => h.total_gain > 0)
  const losses = unrealisedPnL.filter(h => h.total_gain < 0)

  const TAX_CAT_COLORS = {
    equity:'#3b82f6', debt:'#f59e0b', gold:'#f59e0b',
    international:'#a78bfa', reit:'#22c55e', crypto:'#ef4444',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* FY Summary */}
      <Card theme={theme} isDark={isDark}>
        <CardHeader icon={Scale} title={`FY ${taxSummary.fy} Tax Summary`} theme={theme} isDark={isDark}/>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
          <InfoRow icon={TrendingUp}   label="Unrealised STCG"    value={inrCompact(taxSummary.unrealised_stcg||0)}   color={theme.yellow} theme={theme}/>
          <InfoRow icon={TrendingUp}   label="Unrealised LTCG"    value={inrCompact(taxSummary.unrealised_ltcg||0)}   color={theme.green}  theme={theme}/>
          <Divider theme={theme}/>
          <InfoRow icon={CheckCircle}  label="LTCG Exempt Used"   value={inrCompact(taxSummary.ltcg_exempt_used||0)}  color={theme.green}  theme={theme}/>
          <InfoRow icon={Target}       label="LTCG Exempt Remaining" value={inrCompact(taxSummary.ltcg_exempt_remaining||0)} color={theme.blue} theme={theme}/>
          <InfoRow icon={TrendingUp}   label="Taxable LTCG"       value={inrCompact(taxSummary.unrealised_ltcg_taxable||0)} color={taxSummary.unrealised_ltcg_taxable > 0 ? theme.red : theme.green} theme={theme}/>
          <Divider theme={theme}/>
          <InfoRow icon={Receipt}      label="Est. Tax Liability"  value={inrCompact(taxSummary.estimated_tax||0)}    color={theme.red}    theme={theme}/>
          <Divider theme={theme}/>
          <InfoRow icon={BarChart3}    label="Realised P&L (FY)"  value={inrCompact(taxSummary.total_realised_pnl||0)}
            color={(taxSummary.total_realised_pnl||0) >= 0 ? theme.green : theme.red} theme={theme}/>
        </div>
      </Card>

      {/* LTCG Exemption bar */}
      <Card theme={theme} isDark={isDark}>
        <CardHeader icon={Target} title="₹1.25L LTCG Exemption (Equity)" theme={theme} isDark={isDark}/>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted }}>
              Used: {inrCompact(taxSummary.ltcg_exempt_used||0)}
            </span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.green }}>
              Remaining: {inrCompact(taxSummary.ltcg_exempt_remaining||0)}
            </span>
          </div>
          <ProgressBar
            pct={((taxSummary.ltcg_exempt_used||0) / 125000) * 100}
            color={(taxSummary.ltcg_exempt_used||0) > 100000 ? theme.red : theme.green}
            height={8} theme={theme} isDark={isDark}
          />
          <p style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, margin:0, lineHeight:1.6 }}>
            Equity LTCG up to ₹1.25L per financial year is tax-free. You have {inrCompact(taxSummary.ltcg_exempt_remaining||0)} of exemption remaining this FY.
          </p>
        </div>
      </Card>

      {/* Unrealised P&L per holding */}
      <Card theme={theme} isDark={isDark}>
        <CardHeader icon={Layers} title="Unrealised P&L — Per Holding" theme={theme} isDark={isDark}/>

        {/* Header */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 80px 80px',
          gap:8, padding:'8px 16px', borderBottom:`1px solid ${theme.border}`,
        }}>
          {['Holding','Category','Total Gain','STCG','LTCG','Est. Tax'].map((h,i) => (
            <span key={h} style={{
              fontFamily:theme.mono, fontSize:'0.48rem', letterSpacing:'0.14em',
              textTransform:'uppercase', color:theme.muted,
              textAlign: i > 0 ? 'right' : 'left',
            }}>{h}</span>
          ))}
        </div>

        {unrealisedPnL.map(h => {
          const catColor = TAX_CAT_COLORS[h.tax_category] || theme.muted
          return (
            <ExpandableRow key={h.holding_id} theme={theme} isDark={isDark}
              summary={
                <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 80px 80px', gap:8, flex:1, alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.text, fontWeight:500 }}>{h.ticker}</div>
                    <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted }}>{h.name?.slice(0,28)}{h.name?.length>28?'…':''}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{
                      fontFamily:theme.mono, fontSize:'0.52rem', padding:'1px 6px',
                      borderRadius:999, background:`${catColor}14`,
                      border:`1px solid ${catColor}28`, color:catColor,
                    }}>{h.tax_category}</span>
                  </div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.total_gain >= 0 ? theme.green : theme.red, textAlign:'right', fontWeight:500 }}>
                    {h.total_gain >= 0 ? '+' : ''}{inrCompact(h.total_gain)}
                  </div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.stcg_gain > 0 ? theme.yellow : theme.muted, textAlign:'right' }}>
                    {h.stcg_gain !== 0 ? inrCompact(h.stcg_gain) : '—'}
                  </div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.ltcg_gain > 0 ? theme.green : theme.muted, textAlign:'right' }}>
                    {h.ltcg_gain !== 0 ? inrCompact(h.ltcg_gain) : '—'}
                  </div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color: h.estimated_tax > 0 ? theme.red : theme.muted, textAlign:'right' }}>
                    {h.estimated_tax > 0 ? inrCompact(h.estimated_tax) : '—'}
                  </div>
                </div>
              }
            >
              {/* Per-lot breakdown */}
              <div style={{
                ...makeGlass(isDark, 0.03, 10),
                border:`1px solid ${theme.border}`,
                borderRadius:9, overflow:'hidden',
              }}>
                <div style={{ display:'grid', gridTemplateColumns:'90px 60px 70px 70px 70px 60px', gap:6, padding:'7px 12px', borderBottom:`1px solid ${theme.border}` }}>
                  {['Buy Date','Days','Buy NAV','Gain','Type','Est. Tax'].map(lh => (
                    <span key={lh} style={{ fontFamily:theme.mono, fontSize:'0.46rem', color:theme.muted, letterSpacing:'0.10em', textTransform:'uppercase' }}>{lh}</span>
                  ))}
                </div>
                {h.lots.map((lot, i) => (
                  <div key={lot.lot_id || i} style={{
                    display:'grid', gridTemplateColumns:'90px 60px 70px 70px 70px 60px',
                    gap:6, padding:'8px 12px',
                    borderBottom: i < h.lots.length-1 ? `1px solid ${theme.border}` : 'none',
                    background: isDark ? 'transparent' : 'transparent',
                  }}>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.text }}>
                      {new Date(lot.purchase_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                    </span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted }}>{lot.days_held}d</span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted }}>₹{lot.purchase_nav.toFixed(2)}</span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color: lot.lot_gain >= 0 ? theme.green : theme.red }}>
                      {lot.lot_gain >= 0 ? '+' : ''}{inrCompact(lot.lot_gain)}
                    </span>
                    <span>
                      <Badge color={lot.is_ltcg ? 'green' : 'yellow'} theme={theme}>{lot.gain_type}</Badge>
                    </span>
                    <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color: lot.estimated_tax > 0 ? theme.red : theme.muted }}>
                      {lot.estimated_tax > 0 ? inrCompact(lot.estimated_tax) : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tax rates note */}
              <div style={{ fontFamily:theme.mono, fontSize:'0.50rem', color:theme.muted, lineHeight:1.6 }}>
                {h.tax_category === 'equity' && 'STCG taxed at 20% · LTCG taxed at 12.5% · ₹1.25L exemption applies to LTCG'}
                {h.tax_category === 'debt'   && 'Both STCG and LTCG taxed at your income slab rate (post Apr 2023 budget)'}
                {h.tax_category === 'gold'   && 'STCG at slab rate · LTCG at 12.5% after 24 months (no indexation post 2024)'}
                {h.tax_category === 'international' && 'STCG at slab rate · LTCG at 12.5% after 24 months'}
                {h.tax_category === 'crypto' && 'Flat 30% tax on all gains regardless of holding period. 1% TDS on each sell.'}
                {h.tax_category === 'reit'   && 'Dividend income taxable at slab. STCG 20% (<36 months), LTCG 12.5% (>36 months)'}
              </div>
            </ExpandableRow>
          )
        })}
      </Card>

      {/* Realised trades */}
      {realisedTrades.length > 0 && (
        <Card theme={theme} isDark={isDark}>
          <CardHeader icon={Receipt} title="Realised P&L — Completed Trades"
            badge={<Badge color={taxSummary.total_realised_pnl >= 0 ? 'green' : 'red'}
              icon={taxSummary.total_realised_pnl >= 0 ? TrendingUp : TrendingDown} theme={theme}>
              {inrCompact(taxSummary.total_realised_pnl)}
            </Badge>}
            theme={theme} isDark={isDark}/>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {realisedTrades.map(t => (
              <div key={t.trade_id} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 16px', borderBottom:`1px solid ${theme.border}`,
              }}>
                <div style={{
                  width:24, height:24, borderRadius:7, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: t.realised_pnl >= 0 ? `${theme.green}14` : `${theme.red}12`,
                  border:`1px solid ${t.realised_pnl >= 0 ? theme.green+'28' : theme.red+'22'}`,
                  color: t.realised_pnl >= 0 ? theme.green : theme.red,
                }}>
                  {t.realised_pnl >= 0 ? <ArrowUp size={10} strokeWidth={2.5}/> : <ArrowDown size={10} strokeWidth={2.5}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.text, fontWeight:500 }}>{t.ticker}</div>
                  <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted }}>
                    {new Date(t.trade_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    · {t.quantity} units · {t.holding_period_days}d held
                  </div>
                </div>
                <Badge color={t.is_ltcg ? 'green' : 'yellow'} theme={theme}>{t.gain_type}</Badge>
                <div style={{ fontFamily:theme.mono, fontSize:'0.70rem', fontWeight:500, color: t.realised_pnl >= 0 ? theme.green : theme.red, textAlign:'right' }}>
                  {t.realised_pnl >= 0 ? '+' : ''}{inrCompact(t.realised_pnl)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'cost',    label:'Cost X-Ray',        icon:Percent  },
  { id:'exit',    label:'Exit Load Tracker', icon:Lock     },
  { id:'tax',     label:'Tax & P&L',         icon:Scale    },
]

export default function TaxCosts() {
  const { theme, isDark } = useTheme()
  const { userId }        = useFinance()
  
  const { data, isLoading, error, refetch } = useTaxCosts(userId)
  const [tab, setTab]     = useState('cost')
  const gi = makeInset(isDark)

  if (isLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <RefreshCw size={22} style={{ color:theme.muted, animation:'spin 1.2s linear infinite' }}/>
          <span style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted, letterSpacing:'0.08em' }}>
            Loading tax & cost data
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding:24 }}>
        <div style={{
          ...makeGlass(isDark, 0.04, 14),
          border:`1px solid ${theme.red}30`,
          borderRadius:12, padding:'16px 20px',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <AlertTriangle size={16} style={{ color:theme.red }}/>
          <span style={{ fontFamily:theme.mono, fontSize:'0.65rem', color:theme.muted }}>
            {error.message}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:'0 0 40px', display:'flex', flexDirection:'column', gap:24 }}>
      <style>{`@keyframes tabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:theme.display||theme.sans, fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:400, color:theme.text, margin:0, lineHeight:1.2 }}>
            Tax & Costs
          </h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.58rem', color:theme.muted, marginTop:6, letterSpacing:'0.04em' }}>
            Hidden expense ratios · exit load exposure · STCG / LTCG breakdown
          </p>
        </div>
        <button onClick={() => refetch()} style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'8px 14px',
          ...makeGlass(isDark, 0.05, 10),
          border:`1px solid ${theme.border}`,
          borderRadius:9, color:theme.muted,
          fontFamily:theme.mono, fontSize:'0.58rem',
          cursor:'pointer', transition:'all 0.2s',
          boxShadow: gi,
        }}>
          <RefreshCw size={11} strokeWidth={1.8}/> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display:'flex', gap:4,
        ...makeGlass(isDark, 0.04, 16),
        border:`1px solid ${theme.border}`,
        borderRadius:12, padding:4,
        boxShadow: gi, position:'relative', overflow:'hidden',
        alignSelf:'flex-start',
      }}>
        <div style={shine}/>
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 16px', borderRadius:9,
              background: tab === id
                ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)')
                : 'transparent',
              border:`1px solid ${tab === id ? theme.borderHi : 'transparent'}`,
              color: tab === id ? theme.text : theme.muted,
              fontFamily:theme.mono, fontSize:'0.60rem',
              letterSpacing:'0.08em', cursor:'pointer',
              transition:'all 0.2s',
              boxShadow: tab === id ? `0 0 12px ${theme.accent}10` : 'none',
            }}
            onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.color = theme.text } }}
            onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.color = theme.muted } }}
          >
            <Icon size={12} strokeWidth={1.8}/>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ animation:'tabIn 0.25s cubic-bezier(0.4,0,0.2,1)' }} key={tab}>
        {tab === 'cost' && data && <CostXRay     data={data} theme={theme} isDark={isDark}/>}
        {tab === 'exit' && data && <ExitLoadTracker data={data} theme={theme} isDark={isDark}/>}
        {tab === 'tax'  && data && <TaxPnL       data={data} theme={theme} isDark={isDark}/>}
      </div>
    </div>
  )
}