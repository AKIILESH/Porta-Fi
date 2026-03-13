// src/components/Markets/index.jsx
import { useState } from 'react'
import { useIndices }     from '../../hooks/useIndices.js'
import { useMarketNews }  from '../../hooks/useMarketNews.js'
import { useTheme }       from '../../context/ThemeContext.jsx'
import { pct }            from '../../lib/formatters.js'
import {
  TrendingUp, TrendingDown, RefreshCw, Activity,
  AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
  Zap, BarChart2, Globe, DollarSign,
  Landmark, Newspaper,
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
  position:'absolute', top:0, left:'8%', right:'8%', height:1,
  background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
  pointerEvents:'none',
}

// ─── Index config ──────────────────────────────────────────────────────────
const INDEX_CONFIG = {
  '^NSEI':  { label:'NIFTY 50', flag:'🇮🇳', desc:'Top 50 Indian large-caps' },
  '^BSESN': { label:'SENSEX',   flag:'🇮🇳', desc:'BSE 30 bellwether index'  },
  '^GSPC':  { label:'S&P 500',  flag:'🇺🇸', desc:'500 largest US companies' },
  '^IXIC':  { label:'NASDAQ',   flag:'🇺🇸', desc:'Tech-heavy US benchmark'  },
}

// ─── Category config ───────────────────────────────────────────────────────
const CAT_CONFIG = {
  indices:     { label:'Indices',    color:'#3b82f6', icon: BarChart2   },
  macro:       { label:'Macro',      color:'#a78bfa', icon: Landmark    },
  flows:       { label:'FII/DII',    color:'#22c55e', icon: TrendingUp  },
  currency:    { label:'Currency',   color:'#f59e0b', icon: DollarSign  },
  commodities: { label:'Commodities',color:'#f97316', icon: Globe       },
  earnings:    { label:'Earnings',   color:'#06b6d4', icon: Activity    },
  ipo:         { label:'IPO',        color:'#ec4899', icon: Zap         },
  mf:          { label:'Mutual Fund',color:'#8b5cf6', icon: BarChart2   },
  general:     { label:'Markets',    color:'#6b7280', icon: Newspaper   },
}

const ALL_CATS = ['all', 'indices', 'macro', 'flows', 'currency', 'commodities', 'earnings', 'mf', 'ipo']

// ─── Sparkline ─────────────────────────────────────────────────────────────
function MiniSparkline({ up, color }) {
  const pts = up
    ? '0,18 10,15 20,16 30,10 40,12 50,7 60,5 70,8 80,4 90,2'
    : '0,2  10,5  20,4  30,8  40,6  50,11 60,9 70,13 80,15 90,18'
  return (
    <svg width={90} height={22} style={{ display:'block', opacity:0.5 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Index card ────────────────────────────────────────────────────────────
function IndexCard({ symbol, data, index = 0, theme, isDark }) {
  const cfg = INDEX_CONFIG[symbol]
  const up  = data ? data.changePct >= 0 : null
  const c   = up === null ? theme.muted : up ? theme.green : theme.red
  const gi  = makeInset(isDark)

  if (!data) {
    return (
      <div style={{
        ...makeGlass(isDark, 0.04, 20),
        border:`1px solid ${theme.border}`,
        borderRadius:18, padding:22,
        position:'relative', overflow:'hidden',
        boxShadow: gi,
        animation:`gpulse 1.8s ${index*0.15}s ease-in-out infinite`,
      }}>
        <div style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted, marginBottom:8 }}>{cfg?.label}</div>
        <div style={{ height:32, ...makeGlass(isDark,0.04,8), borderRadius:8, marginBottom:8 }}/>
        <div style={{ height:14, width:'60%', ...makeGlass(isDark,0.04,8), borderRadius:6 }}/>
      </div>
    )
  }

  return (
    <div style={{
      ...makeGlass(isDark, 0.05, 22),
      border:`1px solid ${c}28`,
      borderRadius:18, padding:22,
      position:'relative', overflow:'hidden',
      boxShadow:`${gi},0 4px 24px ${c}08`,
      animation:`fadeUp 0.4s ${index*0.08}s both`,
      transition:'all 0.3s',
    }}>
      <div style={shine}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${c}80,transparent)` }}/>
      <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, background:`radial-gradient(circle,${c}12 0%,transparent 70%)`, pointerEvents:'none' }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:'0.85rem' }}>{cfg.flag}</span>
            <span style={{ fontFamily:theme.mono, fontSize:'0.55rem', color:theme.muted, letterSpacing:'0.1em', textTransform:'uppercase' }}>{cfg.label}</span>
          </div>
        </div>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:30, height:30,
          ...makeGlass(isDark,0.08,10),
          border:`1px solid ${c}35`, borderRadius:9,
          color:c, flexShrink:0,
        }}>
          {up ? <ArrowUpRight size={14} strokeWidth={2}/> : <ArrowDownRight size={14} strokeWidth={2}/>}
        </div>
      </div>

      <div style={{ fontFamily:theme.display||theme.sans, fontSize:'1.7rem', fontWeight:700, color:theme.text, lineHeight:1, marginBottom:4 }}>
        {data.price != null
          ? data.price.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
          : '—'}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:theme.mono, fontSize:'0.7rem', color:c, fontWeight:600 }}>
          {up ? <ArrowUpRight size={13} strokeWidth={2.5}/> : <ArrowDownRight size={13} strokeWidth={2.5}/>}
          {data.changePct != null ? pct(data.changePct) : '—'}
        </span>
        <span style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted }}>
          {data.change != null ? `${up?'+':''}${data.change.toFixed(2)} pts` : '—'}
        </span>
      </div>

      <MiniSparkline up={up} color={c}/>
      <div style={{ fontFamily:theme.mono, fontSize:'0.52rem', color:theme.muted, marginTop:8 }}>{cfg.desc}</div>

      {data.fromCache && (
        <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted, marginTop:6, paddingTop:6, borderTop:`1px solid ${theme.border}` }}>
          <Clock size={9} strokeWidth={2}/>
          {new Date(data.fetched_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
        </div>
      )}
    </div>
  )
}

// ─── News card ─────────────────────────────────────────────────────────────
function NewsCard({ item, index = 0, theme, isDark }) {
  const cat     = CAT_CONFIG[item.category] || CAT_CONFIG.general
  const CatIcon = cat.icon

  return (
    <div style={{
      ...makeGlass(isDark, 0.03, 16),
      border:`1px solid ${theme.border}`,
      borderLeft:`2px solid ${cat.color}`,
      borderRadius:12,
      padding:'16px 18px',
      animation:`fadeUp 0.35s ${index * 0.04}s both`,
      transition:'border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${cat.color}35` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border }}
    >
      {/* Category pill + time */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'2px 7px', borderRadius:999,
          background:`${cat.color}14`, border:`1px solid ${cat.color}28`,
          color:cat.color,
          fontFamily:theme.mono, fontSize:'0.46rem',
          letterSpacing:'0.08em', textTransform:'uppercase',
        }}>
          <CatIcon size={8} strokeWidth={2}/>
          {cat.label}
        </div>
        <span style={{ fontFamily:theme.mono, fontSize:'0.48rem', color:theme.muted }}>
          {item.timeAgo}
        </span>
      </div>

      {/* Headline */}
      <div style={{
        fontFamily:theme.sans, fontSize:'0.85rem',
        color:theme.text, lineHeight:1.5,
        fontWeight:500, marginBottom: item.desc ? 10 : 0,
      }}>
        {item.title}
      </div>

      {/* Full description — always visible */}
      {item.desc && (
        <div style={{
          fontFamily:theme.sans, fontSize:'0.78rem',
          color:theme.muted, lineHeight:1.75,
          paddingTop:8, borderTop:`1px solid ${theme.border}`,
        }}>
          {item.desc}
        </div>
      )}
    </div>
  )
}

// ─── News skeleton ─────────────────────────────────────────────────────────
function NewsSkeleton({ theme, isDark }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          ...makeGlass(isDark, 0.03, 12),
          border:`1px solid ${theme.border}`,
          borderLeft:`2px solid ${theme.border}`,
          borderRadius:12, padding:'14px 16px',
          animation:`gpulse 1.8s ${i*0.1}s ease-in-out infinite`,
        }}>
          <div style={{ height:10, width:'30%', background:theme.border, borderRadius:4, marginBottom:10 }}/>
          <div style={{ height:14, width:'90%', background:theme.border, borderRadius:4, marginBottom:6 }}/>
          <div style={{ height:14, width:'60%', background:theme.border, borderRadius:4 }}/>
        </div>
      ))}
    </div>
  )
}

// ─── Category filter pills ─────────────────────────────────────────────────
function FilterPills({ active, onChange, counts, theme, isDark }) {
  return (
    <div style={{
      display:'flex', gap:6, flexWrap:'wrap',
      marginBottom:16,
    }}>
      {ALL_CATS.map(cat => {
        const cfg   = cat === 'all' ? { label:'All', color:theme.accent } : CAT_CONFIG[cat]
        const count = cat === 'all'
          ? Object.values(counts).reduce((a,b) => a+b, 0)
          : (counts[cat] || 0)
        const isActive = active === cat

        return (
          <button key={cat} onClick={() => onChange(cat)}
            style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'5px 12px',
              ...makeGlass(isDark, isActive ? 0.10 : 0.03, 10),
              border:`1px solid ${isActive ? cfg.color+'60' : theme.border}`,
              borderRadius:999,
              color: isActive ? cfg.color : theme.muted,
              fontFamily:theme.mono, fontSize:'0.52rem',
              letterSpacing:'0.06em',
              cursor:'pointer', transition:'all 0.15s',
              boxShadow: isActive ? `0 0 12px ${cfg.color}20` : 'none',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = `${cfg.color}40`; e.currentTarget.style.color = cfg.color } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted } }}
          >
            {cfg.label}
            {count > 0 && (
              <span style={{
                fontFamily:theme.mono, fontSize:'0.46rem',
                padding:'1px 5px', borderRadius:999,
                background: isActive ? `${cfg.color}20` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                color: isActive ? cfg.color : theme.muted,
              }}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Markets() {
  const { theme, isDark }                     = useTheme()
  const { data:indices={}, isLoading:l1, refetch:refetchIndices } = useIndices()
  const { data:news=[],    isLoading:l2, error:newsError, refetch:refetchNews } = useMarketNews()
  const [activeFilter, setActiveFilter]       = useState('all')
  const gi = makeInset(isDark)

  const handleRefresh = () => { refetchIndices(); refetchNews() }

  // Filter news
  const filteredNews = activeFilter === 'all'
    ? news
    : news.filter(n => n.category === activeFilter)

  // Count per category
  const counts = news.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1
    return acc
  }, {})

  // Derive mood from Nifty
  const nifty     = indices['^NSEI']
  const moodUp    = nifty ? nifty.changePct >= 0 : null
  const moodStrong= nifty ? Math.abs(nifty.changePct) > 1 : false

  return (
    <div style={{ display:'grid', gap:24, fontFamily:theme.sans }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes gpulse  { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:14, paddingBottom:22, borderBottom:`1px solid ${theme.border}` }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:3, height:14, background:theme.accent, borderRadius:2 }}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.54rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>
              PortaFi
            </span>
          </div>
          <h1 style={{ fontFamily:theme.display||theme.sans, fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:400, color:theme.text, margin:0, lineHeight:1.1 }}>
            Markets
          </h1>
          <p style={{ fontFamily:theme.mono, fontSize:'0.57rem', color:theme.muted, marginTop:6, letterSpacing:'0.08em' }}>
            Live indices · ET Markets news feed
            {moodUp !== null && (
              <span style={{ marginLeft:10, color: moodUp ? theme.green : theme.red }}>
                · Market {moodStrong ? (moodUp ? 'strongly up' : 'sharply down') : (moodUp ? 'up' : 'down')} today
              </span>
            )}
          </p>
        </div>
        <button onClick={handleRefresh}
          style={{
            display:'inline-flex', alignItems:'center', gap:7,
            ...makeGlass(isDark, 0.06, 12),
            border:`1px solid ${theme.border}`,
            borderRadius:9, color:theme.muted,
            padding:'8px 16px', cursor:'pointer',
            fontFamily:theme.mono, fontSize:'0.60rem',
            letterSpacing:'0.12em', textTransform:'uppercase',
            transition:'all 0.2s', boxShadow:gi,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=`${theme.accent}60`; e.currentTarget.style.color=theme.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
        >
          <RefreshCw size={11} strokeWidth={2}/> Refresh
        </button>
      </div>

      {/* ── Index cards ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
        gap:14,
      }}>
        {['^NSEI','^BSESN','^GSPC','^IXIC'].map((sym, i) => (
          <IndexCard key={sym} symbol={sym} data={indices[sym]}
            index={i} theme={theme} isDark={isDark}/>
        ))}
      </div>

      {/* ── News feed ── */}
      <div style={{
        ...makeGlass(isDark, 0.04, 20),
        border:`1px solid ${theme.border}`,
        borderRadius:18, padding:24,
        position:'relative', overflow:'hidden',
        boxShadow:gi,
        animation:'fadeUp 0.4s 0.2s both',
      }}>
        <div style={shine}/>

        {/* Section header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:14, background:theme.accent, borderRadius:2 }}/>
            <Newspaper size={13} style={{ color:theme.accent }} strokeWidth={2}/>
            <span style={{ fontFamily:theme.mono, fontSize:'0.57rem', letterSpacing:'0.22em', textTransform:'uppercase', color:theme.accent }}>
              ET Markets · Live Feed
            </span>
            {!l2 && news.length > 0 && (
              <span style={{
                fontFamily:theme.mono, fontSize:'0.48rem',
                padding:'2px 7px', borderRadius:999,
                background:`${theme.green}14`, border:`1px solid ${theme.green}28`,
                color:theme.green,
              }}>
                {news.length} stories
              </span>
            )}
          </div>

        </div>

        {/* Category filters */}
        {!l2 && news.length > 0 && (
          <FilterPills
            active={activeFilter}
            onChange={setActiveFilter}
            counts={counts}
            theme={theme}
            isDark={isDark}
          />
        )}

        {/* News list */}
        {l2 ? (
          <NewsSkeleton theme={theme} isDark={isDark}/>
        ) : newsError ? (
          <div style={{
            padding:'32px 16px', textAlign:'center',
            display:'flex', flexDirection:'column', alignItems:'center', gap:12,
          }}>
            <AlertTriangle size={22} style={{ color:theme.red, opacity:0.6 }}/>
            <div style={{ fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted }}>
              Could not load news feed. Check your connection.
            </div>
            <button onClick={refetchNews} style={{
              display:'inline-flex', alignItems:'center', gap:6,
              ...makeGlass(isDark, 0.06, 10),
              border:`1px solid ${theme.accent}40`,
              borderRadius:8, color:theme.accent,
              padding:'7px 14px', cursor:'pointer',
              fontFamily:theme.mono, fontSize:'0.58rem',
            }}>
              <RefreshCw size={11} strokeWidth={2}/> Retry
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div style={{ padding:'32px 16px', textAlign:'center', fontFamily:theme.mono, fontSize:'0.62rem', color:theme.muted }}>
            No {activeFilter === 'all' ? '' : activeFilter} news at the moment
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filteredNews.map((item, i) => (
              <NewsCard key={item.id} item={item} index={i} theme={theme} isDark={isDark}/>
            ))}
          </div>
        )}

        {/* Footer */}
        {!l2 && news.length > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            marginTop:20, paddingTop:16,
            borderTop:`1px solid ${theme.border}`,
            fontFamily:theme.mono, fontSize:'0.50rem', color:theme.muted,
          }}>
            <Clock size={9} strokeWidth={2}/>
            Source: Economic Times Markets · Updates every 10 minutes
          </div>
        )}
      </div>
    </div>
  )
}