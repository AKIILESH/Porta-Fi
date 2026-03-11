// src/pages/Markets.jsx
import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useIndices } from '../../hooks/useIndices.js'
import { useTheme } from '../../context/ThemeContext.jsx' // 👈 Add this
import { Spinner } from '../shared/ui.jsx'
import { pct } from '../../lib/formatters.js'
import {
  TrendingUp, TrendingDown, RefreshCw, Activity,
  AlertTriangle, Clock, Info, ArrowUpRight, ArrowDownRight,
  BarChart2, Globe, Zap, Shield, DollarSign, Landmark,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = (theme) => `
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes shimmer  { 0%   { transform:translateX(-100%) }            100% { transform:translateX(220%) }     }
  @keyframes gpulse   { 0%,100% { opacity:.2 } 50% { opacity:.5 }                                              }
  @keyframes ticker   { 0%   { transform:translateX(0) }                100% { transform:translateX(-50%) }    }
  @keyframes blink    { 0%,100% { opacity:1 } 50% { opacity:0.3 }                                              }

  .m-index-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .m-watch-grid   { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .m-signals-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .m-header       { display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;
                    margin-bottom:26px; padding-bottom:22px; border-bottom:1px solid ${theme.border}; }

  .m-card:hover .m-card-glow { opacity: 1 !important; }

  @media (max-width:1024px) {
    .m-index-grid   { grid-template-columns:repeat(2,1fr); }
    .m-signals-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:767px) {
    .m-header       { flex-direction:column; align-items:flex-start; }
    .m-index-grid   { grid-template-columns:repeat(2,1fr); gap:10px; }
    .m-watch-grid   { grid-template-columns:1fr; }
    .m-signals-grid { grid-template-columns:1fr; }
  }
  @media (max-width:420px) {
    .m-index-grid   { grid-template-columns:1fr; }
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// GLASS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const glass = (theme, o=0.04, b=20) => ({
  background:           `rgba(255,255,255,${o})`,
  backdropFilter:       `blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
})
const gi    = (theme) => `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.12)`
const shine = { position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', pointerEvents:'none' }

const SL = ({ children, icon:Icon, color }) => {
  const { theme } = useTheme()
  const c = color || theme.accent
  
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
      <div style={{ width:3, height:15, background:c, borderRadius:2, boxShadow:`0 0 10px ${c}80` }}/>
      {Icon && <Icon size={13} style={{color:c}} strokeWidth={2}/>}
      <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:c }}>{children}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEX CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const INDEX_CONFIG = {
  '^NSEI':  { label:'NIFTY 50',  flag:'🇮🇳', region:'India',  desc:'Top 50 Indian large-caps' },
  '^BSESN': { label:'SENSEX',    flag:'🇮🇳', region:'India',  desc:'BSE 30 bellwether index'  },
  '^GSPC':  { label:'S&P 500',   flag:'🇺🇸', region:'USA',    desc:'500 largest US companies' },
  '^IXIC':  { label:'NASDAQ',    flag:'🇺🇸', region:'USA',    desc:'Tech-heavy US benchmark'  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE (last 5 pts implied from price + change — decorative)
// ─────────────────────────────────────────────────────────────────────────────
function MiniSparkline({ up, color }) {
  // Decorative SVG path representing momentum
  const pts = up
    ? '0,18 10,15 20,16 30,10 40,12 50,7 60,5 70,8 80,4 90,2'
    : '0,2  10,5  20,4  30,8  40,6  50,11 60,9 70,13 80,15 90,18'
  return (
    <svg width={90} height={22} style={{ display:'block', opacity:0.6 }}>
      <defs>
        <linearGradient id={`sg-${up?'u':'d'}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEX CARD
// ─────────────────────────────────────────────────────────────────────────────
function IndexCard({ symbol, data, isLoading, index=0 }) {
  const { theme } = useTheme()
  const cfg = INDEX_CONFIG[symbol]
  const up  = data ? data.changePct >= 0 : null
  const c   = up === null ? theme.muted : up ? theme.green : theme.red

  if (isLoading || !data) {
    return (
      <div style={{ ...glass(theme, 0.04, 20), border:`1px solid ${theme.border}`, borderRadius:18, padding:22, position:'relative', overflow:'hidden', boxShadow:gi(theme), animation:`gpulse 1.8s ${index*0.15}s ease-in-out infinite` }}>
        <div style={shine}/>
        <div style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted, marginBottom:8, letterSpacing:'0.1em' }}>{cfg?.label}</div>
        <div style={{ height:32, ...glass(theme, 0.04, 8), borderRadius:8, marginBottom:8, animation:'gpulse 1.8s ease-in-out infinite' }}/>
        <div style={{ height:14, width:'60%', ...glass(theme, 0.04, 8), borderRadius:6, animation:'gpulse 1.8s 0.3s ease-in-out infinite' }}/>
      </div>
    )
  }

  return (
    <div className="m-card"
      style={{ ...glass(theme, 0.05, 22), border:`1px solid ${c}28`, borderRadius:18, padding:22, position:'relative', overflow:'hidden', boxShadow:`${gi(theme)},0 0 0 0 ${c}`, transition:'all 0.3s', animation:`fadeUp 0.4s ${index*0.08}s both`, cursor:'default' }}
    >
      <div style={shine}/>
      {/* Ambient glow */}
      <div className="m-card-glow" style={{ position:'absolute', top:-40, right:-40, width:140, height:140, background:`radial-gradient(circle,${c}18 0%,transparent 70%)`, pointerEvents:'none', opacity:0.5, transition:'opacity 0.3s' }}/>
      {/* Top accent */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${c}80,transparent)` }}/>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:'0.85rem' }}>{cfg.flag}</span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted, letterSpacing:'0.1em', textTransform:'uppercase' }}>{cfg.region}</span>
          </div>
          <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.text, letterSpacing:'0.08em' }}>{cfg.label}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, ...glass(theme, 0.08, 10), border:`1px solid ${c}35`, borderRadius:9, color:c, flexShrink:0 }}>
          {up ? <TrendingUp size={14} strokeWidth={2}/> : <TrendingDown size={14} strokeWidth={2}/>}
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily:theme.display, fontSize:'1.7rem', fontWeight:700, color:theme.text, lineHeight:1, marginBottom:4, textShadow:`0 0 20px ${c}25` }}>
        {data.price != null ? data.price.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }) : '—'}
      </div>

      {/* Change row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:theme.mono, fontSize:'0.7rem', color:c, fontWeight:600 }}>
          {up ? <ArrowUpRight size={13} strokeWidth={2.5}/> : <ArrowDownRight size={13} strokeWidth={2.5}/>}
          {data.changePct != null ? pct(data.changePct) : '—'}
        </span>
        <span style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted }}>
          {data.change != null ? `${up?'+':''}${data.change.toFixed(2)} pts` : '—'}
        </span>
      </div>

      {/* Sparkline */}
      <MiniSparkline up={up} color={c}/>

      {/* Desc + cache */}
      <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, marginTop:8, letterSpacing:'0.05em' }}>{cfg.desc}</div>
      {data.fromCache && (
        <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted, marginTop:6, paddingTop:6, borderTop:`1px solid ${theme.border}` }}>
          <Clock size={9} strokeWidth={2}/> {new Date(data.fetched_at).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET SIGNAL CARD  (actionable insight)
// ─────────────────────────────────────────────────────────────────────────────
function SignalCard({ icon:Icon, color, title, value, note, action, index=0 }) {
  const { theme } = useTheme()
  
  return (
    <div style={{ ...glass(theme, 0.04, 20), border:`1px solid ${color}28`, borderRadius:16, padding:'18px 20px', position:'relative', overflow:'hidden', boxShadow:gi(theme), animation:`fadeUp 0.4s ${0.3+index*0.06}s both` }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color, opacity:0.5 }}/>
      <div style={{ position:'absolute', top:-30, right:-30, width:90, height:90, background:`radial-gradient(circle,${color}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ width:32, height:32, ...glass(theme, 0.08, 10), border:`1px solid ${color}30`, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
          <Icon size={15} strokeWidth={1.8}/>
        </div>
        {value && (
          <span style={{ fontFamily:theme.mono, fontSize:'0.62rem', color, ...glass(theme, 0.08, 8), padding:'3px 9px', border:`1px solid ${color}30`, borderRadius:7 }}>{value}</span>
        )}
      </div>
      <div style={{ fontFamily:theme.sans, fontSize:'0.84rem', color:theme.text, fontWeight:600, marginBottom:5 }}>{title}</div>
      <div style={{ fontFamily:theme.mono, fontSize:'0.6rem', color:theme.muted, lineHeight:1.7, marginBottom:action?12:0 }}>{note}</div>
      {action && (
        <div style={{ fontFamily:theme.mono, fontSize:'0.57rem', color, display:'flex', alignItems:'center', gap:5, ...glass(theme, 0.06, 8), padding:'5px 10px', borderRadius:7, border:`1px solid ${color}25`, width:'fit-content' }}>
          <Zap size={9} strokeWidth={2.5}/>{action}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCH ITEM  (key indicator row)
// ─────────────────────────────────────────────────────────────────────────────
function WatchItem({ icon:Icon, color, label, note, tip }) {
  const { theme } = useTheme()
  const [showTip, setShowTip] = useState(false)
  
  return (
    <div
      style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', ...glass(theme, showTip?0.06:0.03, 12), border:`1px solid ${showTip?color+'35':theme.border}`, borderRadius:12, transition:'all 0.2s', cursor:'default', marginBottom:8 }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div style={{ width:30, height:30, flexShrink:0, ...glass(theme, 0.08, 8), border:`1px solid ${color}30`, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color }}>
        <Icon size={14} strokeWidth={1.8}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:theme.sans, fontSize:'0.83rem', color:theme.text, marginBottom:3 }}>{label}</div>
        <div style={{ fontFamily:theme.mono, fontSize:'0.59rem', color:theme.muted, lineHeight:1.6 }}>{note}</div>
        {showTip && tip && (
          <div style={{ fontFamily:theme.mono, fontSize:'0.57rem', color, marginTop:6, display:'flex', alignItems:'center', gap:5, animation:'fadeIn 0.2s ease' }}>
            <Zap size={9} strokeWidth={2.5}/>{tip}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function MarketsSkeleton() {
  const { theme } = useTheme()
  
  return (
    <div style={{ display:'grid', gap:18 }}>
      <div style={{ ...glass(theme, 0.04, 16), borderRadius:12, height:42, animation:'gpulse 1.8s ease-in-out infinite' }}/>
      <div className="m-index-grid">
        {[0,1,2,3].map(i => (
          <div key={i} style={{ ...glass(theme, 0.04, 16), border:`1px solid ${theme.border}`, borderRadius:18, height:180, animation:`gpulse 1.8s ${i*0.12}s ease-in-out infinite` }}/>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Markets() {
  const { theme } = useTheme()
  const { data:indices={}, isLoading, error, refetch } = useIndices()

  // Update CSS variables when theme changes
  useState(() => {
    const style = document.createElement('style')
    style.textContent = CSS(theme)
    style.id = 'markets-dynamic-styles'
    const oldStyle = document.getElementById('markets-dynamic-styles')
    if (oldStyle) oldStyle.remove()
    document.head.appendChild(style)
    
    return () => style.remove()
  }, [theme])

  if (isLoading) return <><style>{CSS(theme)}</style><MarketsSkeleton /></>

  if (error) return (
    <div style={{ ...glass(theme, 0.06, 20), border:`1px solid ${theme.red}40`, borderRadius:18, padding:40, textAlign:'center' }}>
      <AlertTriangle size={28} strokeWidth={1.5} style={{ color:theme.red, display:'block', margin:'0 auto 14px', opacity:0.6 }}/>
      <div style={{ fontFamily:theme.mono, fontSize:'0.68rem', color:theme.red, marginBottom:20 }}>
        Error loading market data: {error.message}
      </div>
      <button onClick={()=>refetch()} style={{ display:'inline-flex', alignItems:'center', gap:8, ...glass(theme, 0.08, 12), border:`1px solid ${theme.accent}50`, borderRadius:10, color:theme.accent, padding:'10px 22px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.63rem', letterSpacing:'0.16em', textTransform:'uppercase' }}>
        <RefreshCw size={13}/> Retry
      </button>
    </div>
  )

  // Derive market mood from NIFTY
  const nifty = indices['^NSEI']
  const moodUp = nifty ? nifty.changePct >= 0 : null
  const moodStrong = nifty ? Math.abs(nifty.changePct) > 1 : false

  return (
    <div style={{ display:'grid', gap:22, fontFamily:theme.sans }}>
      <style>{CSS(theme)}</style>

      {/* Header */}
      <div className="m-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Activity size={12} style={{color:theme.accent}} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily:theme.display, fontSize:'2rem', fontWeight:700, color:theme.text, margin:0, lineHeight:1 }}>Markets</h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:theme.muted, marginTop:6, letterSpacing:'0.10em' }}>
            Live indices · Signals · What to watch
            {moodUp !== null && (
              <span style={{ marginLeft:10, color:moodUp?theme.green:theme.red }}>
                · Market is {moodStrong?(moodUp?'strongly up':'sharply down'):(moodUp?'up':'down')} today
              </span>
            )}
          </p>
        </div>
        <button onClick={()=>refetch()}
          style={{ display:'inline-flex', alignItems:'center', gap:7, ...glass(theme, 0.06, 12), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:'8px 16px', cursor:'pointer', fontFamily:theme.mono, fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', transition:'all 0.2s' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${theme.accent}60`; e.currentTarget.style.color=theme.accent }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
        >
          <RefreshCw size={11} strokeWidth={2}/> Refresh
        </button>
      </div>

      {/* Index cards */}
      <div className="m-index-grid">
        {['^NSEI','^BSESN','^GSPC','^IXIC'].map((sym,i) => (
          <IndexCard key={sym} symbol={sym} data={indices[sym]} isLoading={false} index={i}/>
        ))}
      </div>

      {/* Actionable signals */}
      <div>
        <SL icon={Zap}>Actionable Signals</SL>
        <div className="m-signals-grid">
          <SignalCard
            icon={BarChart2} color={theme.accent}
            title="Nifty P/E Valuation"
            value="Check Live"
            note="P/E above 25 means the market is expensive — reduce lump-sum buys. Below 18 is a historically strong entry zone for long-term SIPs."
            action="Good time to increase SIP if P/E < 20"
            index={0}
          />
          <SignalCard
            icon={TrendingDown} color={theme.yellow}
            title="FII vs DII Flows"
            note="When FIIs sell heavily, prices drop short-term but DIIs absorb. Don't panic-sell. Watch net flows for 5+ consecutive days before reacting."
            action="FII outflow ≠ crash — stay the course"
            index={1}
          />
          <SignalCard
            icon={DollarSign} color={theme.green}
            title="INR / USD Rate"
            note="Weak rupee boosts IT & pharma exporters. Strong rupee benefits oil importers and aviation. Your US holdings (VOO) gain value in INR when USD rises."
            action="USD > ₹86 → your US stocks worth more in INR"
            index={2}
          />
          <SignalCard
            icon={Landmark} color={theme.purple}
            title="RBI Repo Rate"
            value="6.5%"
            note="Higher repo = costlier loans, lower bond prices. When RBI cuts rates, bond funds and rate-sensitive sectors (banking, real estate) typically rally."
            action="Rate cut cycle → consider debt mutual funds"
            index={3}
          />
          <SignalCard
            icon={Shield} color={theme.red}
            title="Inflation (CPI)"
            note="CPI above 6% constrains RBI from cutting rates. High inflation erodes real returns — your FD at 7% is breakeven if CPI is 7%. Factor this into debt planning."
            action="Real return = Nominal rate − Inflation"
            index={4}
          />
          <SignalCard
            icon={Globe} color='#f59e0b'
            title="Global Risk Signals"
            note="US Fed rate decisions ripple into Indian markets within 24 hours. Oil price spikes hurt India (we import 80%). Keep an eye on Brent crude and Fed meeting dates."
            action="Fed hike → expect short-term FII outflows"
            index={5}
          />
        </div>
      </div>

      {/* What to watch — actionable hover tips */}
      <div style={{ ...glass(theme, 0.04, 20), border:`1px solid ${theme.border}`, borderRadius:18, padding:26, position:'relative', overflow:'hidden', boxShadow:gi(theme), animation:'fadeUp 0.5s 0.5s both' }}>
        <div style={shine}/>
        <div className="m-watch-grid">
          <div>
            <SL icon={Activity} color={theme.accent}>Indian Market Indicators</SL>
            <WatchItem icon={BarChart2}  color={theme.accent} label="Nifty P/E Ratio"     note="Valuations guide when to invest lump-sum vs SIP."    tip="P/E < 18 → great lump-sum opportunity"/>
            <WatchItem icon={TrendingUp} color={theme.blue}   label="FII / DII Activity"  note="Institutional flows predict near-term direction."      tip="5-day DII net buy streak → bullish signal"/>
            <WatchItem icon={Landmark}   color={theme.purple} label="RBI Monetary Policy"  note="Repo rate changes affect your loans and debt funds."   tip="Rate cut → refinance or lock in long-term FDs now"/>
            <WatchItem icon={Activity}   color={theme.yellow} label="Inflation (CPI/WPI)"  note="High inflation erodes fixed-income real returns."      tip="CPI > 6% → RBI unlikely to cut — avoid long bonds"/>
          </div>
          <div>
            <SL icon={Globe} color='#f59e0b'>Global Factors Affecting You</SL>
            <WatchItem icon={DollarSign} color={theme.green}  label="INR / USD Exchange"   note="Directly affects your US equity holdings in INR terms." tip="Every ₹1 weaker rupee = ~1% more value for VOO"/>
            <WatchItem icon={Shield}     color='#f59e0b'      label="Brent Crude Oil"       note="India imports 80% of oil — prices impact inflation."   tip="Crude > $95 → watch for market correction"/>
            <WatchItem icon={Globe}      color={theme.red}    label="US Fed Rate Decisions" note="Fed hikes drain emerging market capital including India." tip="Fed pause/cut → FII inflows likely, markets up"/>
            <WatchItem icon={TrendingUp} color='#a78bfa'      label="Gold (MCX / LBMA)"     note="Hedge against rupee depreciation and uncertainty."     tip="Gold up = risk-off mood globally — hold allocation"/>
          </div>
        </div>
      </div>

      {/* SIP reminder */}
      <div style={{ ...glass(theme, 0.05, 20), border:`1px solid ${theme.green}30`, borderLeft:`2px solid ${theme.green}`, borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14, animation:'fadeUp 0.5s 0.6s both' }}>
        <div style={{ width:36, height:36, flexShrink:0, ...glass(theme, 0.1, 12), border:`1px solid ${theme.green}35`, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', color:theme.green }}>
          <Zap size={16} strokeWidth={2}/>
        </div>
        <div>
          <div style={{ fontFamily:theme.sans, fontSize:'0.88rem', color:theme.text, fontWeight:600, marginBottom:5 }}>SIP beats timing every time</div>
          <div style={{ fontFamily:theme.mono, fontSize:'0.61rem', color:theme.muted, lineHeight:1.8 }}>
            A ₹10,000/month SIP in NIFTY 50 index over 10 years has outperformed most attempts to time the market.
            Red days are discounts — <span style={{ color:theme.green }}>your SIP buys more units when markets fall</span>.
            Volatility is the price of long-term wealth creation.
          </div>
        </div>
      </div>
    </div>
  )
}