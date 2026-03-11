import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx' // 👈 Add this
import { useFinance } from '../../context/FinanceContext.jsx'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useIndices } from '../../hooks/useIndices'
import { inr, inrCompact, pct, gainColor, fmtDate } from '../../lib/formatters.js'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Target,
  ArrowUpRight, ArrowDownRight, Activity,
  PieChart as PieIcon, RefreshCw, Clock,
  DollarSign, Shield, Zap, BarChart2,
  Home, Briefcase, Landmark, CreditCard,
} from 'lucide-react'

// ── Glass helpers ─────────────────────────────────────────────────────────────
const glass = (opacity = 0.04, blur = 20) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
})

// ── Asset config ──────────────────────────────────────────────────────────────
const ASSET_COLORS = {
  equity: '#2563EB', us_equity: '#0EA5E9', etf: '#60A5FA',
  mutual_fund: '#8B5CF6', index_fund: '#A78BFA', elss: '#C4B5FD',
  debt_fund: '#10B981', liquid_fund: '#34D399', hybrid_fund: '#6EE7B7',
  gold: '#F59E0B', silver: '#94A3B8',
  reit: '#EC4899', invit: '#F97316', crypto: '#A855F7', other: '#6B7280',
}
const ASSET_LABELS = {
  equity: 'Equity', us_equity: 'US Equity', etf: 'ETF',
  index_fund: 'Index Fund', elss: 'ELSS', mutual_fund: 'Mutual Fund',
  debt_fund: 'Debt Fund', liquid_fund: 'Liquid Fund', hybrid_fund: 'Hybrid Fund',
  gold: 'Gold', silver: 'Silver', reit: 'REIT',
  invit: 'InvIT', crypto: 'Crypto', other: 'Other',
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  const { theme } = useTheme() // 👈 Add this
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 14, background: theme.accent, borderRadius: 2, boxShadow: `0 0 8px ${theme.accent}` }} />
      <span style={{
        fontFamily: theme.mono, fontSize: '0.58rem',
        letterSpacing: '0.22em', textTransform: 'uppercase', color: theme.accent,
      }}>
        {children}
      </span>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const { theme } = useTheme() // 👈 Add this
  
  return (
    <div style={{ display: 'grid', gap: 24, padding: '4px 0' }}>
      {[60, 200, 120, 120].map((h, i) => (
        <div key={i} style={{
          height: h,
          ...glass(0.04, 20),
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          animation: 'pulse 1.8s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
    </div>
  )
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
function NWTooltip({ active, payload }) {
  const { theme } = useTheme() // 👈 Add this
  
  if (!active || !payload?.length) return null
  return (
    <div style={{
      ...glass(0.15, 20),
      border: `1px solid ${theme.borderHi}`,
      padding: '10px 14px', borderRadius: 10,
      boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${theme.accentGlow}`,
    }}>
      <div style={{ fontFamily: theme.mono, fontSize: '0.58rem', color: theme.muted, marginBottom: 4 }}>
        {payload[0]?.payload?.month}
      </div>
      <div style={{ fontFamily: theme.display, fontSize: '1.1rem', color: theme.accent }}>
        {inr(payload[0]?.value)}
      </div>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  const { theme } = useTheme() // 👈 Add this
  
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      ...glass(0.15, 20),
      border: `1px solid ${theme.borderHi}`,
      padding: '10px 14px', borderRadius: 10,
      boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
    }}>
      <div style={{ fontFamily: theme.mono, fontSize: '0.58rem', color: theme.muted, marginBottom: 4 }}>{d.name}</div>
      <div style={{ fontFamily: theme.display, fontSize: '1.1rem', color: d.color }}>{inr(d.value)}</div>
      <div style={{ fontFamily: theme.mono, fontSize: '0.55rem', color: theme.muted, marginTop: 2 }}>{d.percentage}%</div>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent, icon: Icon, delay = 0 }) {
  const { theme } = useTheme() // 👈 Add this
  const [hov, setHov] = useState(false)
  const [vis, setVis] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => { 
    const t = setTimeout(() => setVis(true), delay); 
    return () => clearTimeout(t) 
  }, [delay])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const glassInset = useMemo(() => 
    `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12)`
  , [])

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...glass(hov ? 0.08 : 0.04, 20),
        border: `1px solid ${hov ? (accent || theme.accent) + '50' : theme.border}`,
        borderRadius: 16,
        padding: isMobile ? '16px' : '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, background 0.3s',
        boxShadow: hov
          ? `${glassInset}, 0 0 28px ${(accent || theme.accent) + '20'}`
          : `${glassInset}, 0 4px 16px rgba(0,0,0,0.3)`,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top shine */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)`,
      }} />
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        background: `radial-gradient(circle, ${accent || theme.accent}20 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'opacity 0.3s',
        opacity: hov ? 1 : 0.5,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 10 : 14 }}>
        <div style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.5rem' : '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.muted }}>
          {label}
        </div>
        {Icon && (
          <div style={{
            width: isMobile ? 24 : 28,
            height: isMobile ? 24 : 28,
            ...glass(0.08, 12),
            border: `1px solid ${(accent || theme.accent) + '30'}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent || theme.accent,
          }}>
            <Icon size={isMobile ? 12 : 13} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div style={{
        fontFamily: theme.display, fontSize: isMobile ? '1.5rem' : '1.85rem', fontWeight: 700,
        color: theme.text, lineHeight: 1, marginBottom: isMobile ? 6 : 8,
        textShadow: hov ? `0 0 20px ${(accent || theme.accent) + '40'}` : 'none',
        transition: 'text-shadow 0.3s',
        wordBreak: 'break-word',
      }}>
        {value}
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.55rem' : '0.6rem', color: accent || theme.accent, letterSpacing: '0.06em' }}>
        {sub}
      </div>
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, icon: Icon, delay = 0 }) {
  const { theme } = useTheme() // 👈 Add this
  const [vis, setVis] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => { 
    const t = setTimeout(() => setVis(true), delay); 
    return () => clearTimeout(t) 
  }, [delay])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const glassInset = useMemo(() => 
    `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12)`
  , [])

  return (
    <div style={{
      ...glass(0.05, 16),
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      padding: isMobile ? '14px 16px' : '18px 22px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      boxShadow: glassInset,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
        {Icon && (
          <div style={{
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            ...glass(0.08, 12),
            border: `1px solid ${(color || theme.accent) + '30'}`,
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color || theme.accent,
          }}>
            <Icon size={isMobile ? 12 : 14} strokeWidth={1.8} />
          </div>
        )}
        <span style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.52rem' : '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.muted }}>
          {label}
        </span>
      </div>
      <span style={{
        fontFamily: theme.display, fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700,
        color: color || theme.text,
        textShadow: `0 0 16px ${(color || theme.accent) + '40'}`,
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ t, i, total }) {
  const { theme } = useTheme() // 👈 Add this
  const [hov, setHov] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const isCredit = t.amount >= 0
  const color = isCredit ? theme.green : theme.red
  
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '10px 16px' : '13px 20px',
        borderBottom: i < total - 1 ? `1px solid ${theme.border}` : 'none',
        background: hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: isMobile ? 32 : 36,
          height: isMobile ? 32 : 36,
          ...glass(0.06, 12),
          border: `1px solid ${color + '30'}`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
          boxShadow: `0 0 10px ${color + '20'}`,
          flexShrink: 0,
        }}>
          {isCredit
            ? <ArrowUpRight size={isMobile ? 13 : 15} strokeWidth={2} />
            : <ArrowDownRight size={isMobile ? 13 : 15} strokeWidth={2} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: theme.sans, fontSize: isMobile ? '0.8rem' : '0.85rem', color: theme.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.description}
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.5rem' : '0.57rem', color: theme.muted, letterSpacing: '0.06em' }}>
            {t.category} · {fmtDate(t.date)}
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: theme.display, fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700,
        color, textShadow: `0 0 12px ${color + '40'}`,
        marginLeft: 8,
        whiteSpace: 'nowrap',
      }}>
        {isCredit ? '+' : ''}{inr(t.amount)}
      </div>
    </div>
  )
}

// ── Quick action button ───────────────────────────────────────────────────────
function ActionBtn({ label, icon: Icon, onClick, color }) {
  const { theme } = useTheme() // 👈 Add this
  const [hov, setHov] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const c = color || theme.accent

  const glassInset = useMemo(() => 
    `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.12)`
  , [])
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: isMobile ? 6 : 10, padding: isMobile ? '16px 8px' : '22px 12px',
        ...glass(hov ? 0.09 : 0.04, 16),
        border: `1px solid ${hov ? c + '50' : theme.border}`,
        borderRadius: 14,
        textDecoration: 'none',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        boxShadow: hov ? `${glassInset}, 0 0 24px ${c + '20'}` : glassInset,
        position: 'relative', overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        background: 'transparent',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)`,
      }} />
      <div style={{
        width: isMobile ? 34 : 38,
        height: isMobile ? 34 : 38,
        ...glass(0.08, 12),
        border: `1px solid ${c + '30'}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c,
        boxShadow: hov ? `0 0 16px ${c + '40'}` : 'none',
        transition: 'box-shadow 0.25s',
      }}>
        {Icon && <Icon size={isMobile ? 14 : 16} strokeWidth={1.8} />}
      </div>
      <span style={{
        fontFamily: theme.mono, fontSize: isMobile ? '0.5rem' : '0.56rem',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: hov ? theme.text : theme.muted,
        transition: 'color 0.2s',
      }}>
        {label}
      </span>
    </button>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { theme } = useTheme() // 👈 Add this - get dynamic theme
  const { userId } = useFinance()
  const navigate = useNavigate()
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData(userId)
  const { data: indices, isLoading: indicesLoading } = useIndices()
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768
  const isTablet = windowWidth > 768 && windowWidth <= 1024

  // Memoized calculations
const {
  portfolioValue = 0, 
  cashBalance = 0, 
  totalDebt = 0,
  netWorth = 0, 
  byAssetClass = {}, 
  recentTransactions = [], 
  monthTransactions = [], // Add this
  monthlyIncome = 0, // Add this
  monthlyExpenses = 0, // Add this
  nwHistory = []
} = dashboardData || {}



  const savings = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0
  const emergencyMonths = monthlyExpenses > 0 ? (cashBalance / monthlyExpenses).toFixed(1) : 'N/A'
  const portfolioGainPct = 0 // Calculate this from your data

  // Allocation data with percentages
  const allocationData = useMemo(() => {
    const data = [
      ...Object.entries(byAssetClass).map(([k, v]) => ({
        name: ASSET_LABELS[k] || k, value: v,
        color: ASSET_COLORS[k] || theme.accent, originalKey: k,
      })),
      ...(cashBalance > 0 ? [{ name: 'Cash & Bank', value: cashBalance, color: '#fbbf24', originalKey: 'cash' }] : []),
    ].filter(d => d.value > 0).sort((a, b) => b.value - a.value)

    const total = data.reduce((s, d) => s + d.value, 0)
    return data.map(d => ({ ...d, percentage: total > 0 ? ((d.value / total) * 100).toFixed(1) : 0 }))
  }, [byAssetClass, cashBalance, theme.accent])

  // Calculate total allocation
  const totalAlloc = useMemo(() => 
    allocationData.reduce((sum, item) => sum + item.value, 0)
  , [allocationData])

  // Chart data
  const chartData = useMemo(() => 
    nwHistory?.length >= 2
      ? nwHistory.map(s => ({ month: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), value: Number(s.value) }))
      : [{ month: 'Now', value: netWorth }]
  , [nwHistory, netWorth])

  // Navigation handlers
  const handleNavigate = useCallback((path) => {
    navigate(path)
  }, [navigate])

  const glassInset = useMemo(() => 
    `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.12)`
  , [])

  if (isLoading || indicesLoading) return <LoadingSkeleton />

  if (error) return (
    <div style={{
      ...glass(0.06, 20),
      border: `1px solid ${theme.red + '40'}`,
      borderRadius: 16, padding: isMobile ? '30px 20px' : '40px',
      textAlign: 'center', color: theme.red, fontFamily: theme.mono,
    }}>
      Error loading dashboard: {error.message}
      <button onClick={() => refetch()} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        margin: '20px auto 0', padding: '9px 20px',
        ...glass(0.08, 12),
        border: `1px solid ${theme.red + '40'}`,
        borderRadius: 10, color: theme.red, fontFamily: theme.mono,
        fontSize: 12, cursor: 'pointer',
      }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  )

  return (
    <div style={{ 
      fontFamily: theme.sans, 
      background: 'transparent', 
      display: 'grid', 
      gap: isMobile ? 16 : 24, 
      padding: isMobile ? '0' : '4px 0',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: isMobile ? 12 : 0,
        paddingBottom: 20, 
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Activity size={12} style={{ color: theme.accent }} strokeWidth={2} />
            <span style={{ fontFamily: theme.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: theme.accent }}>
              PortaFi
            </span>
          </div>
          <h1 style={{ 
            fontFamily: theme.display, 
            fontSize: isMobile ? '1.8rem' : '2.1rem', 
            fontWeight: 700, 
            color: theme.text, 
            margin: 0, 
            lineHeight: 1,
            wordBreak: 'break-word',
          }}>
            Financial Overview
          </h1>
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <div style={{ fontFamily: theme.mono, fontSize: '0.57rem', letterSpacing: '0.12em', color: theme.muted }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isMobile ? 'flex-start' : 'flex-end', marginTop: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.green, boxShadow: `0 0 8px ${theme.green}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: theme.mono, fontSize: '0.54rem', color: theme.green, letterSpacing: '0.10em' }}>Live</span>
          </div>
        </div>
      </div>

      {/* ── Net Worth Hero ── */}
      <div style={{
        ...glass(0.05, 28),
        border: `1px solid ${theme.border}`,
        borderRadius: 20, 
        padding: isMobile ? '24px' : '32px 36px',
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: `${glassInset}, 0 12px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
      }}>
        {/* shine streak */}
        <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)` }} />
        {/* glow blob */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: `radial-gradient(circle, ${theme.accent}0a 0%, transparent 65%)`, pointerEvents: 'none' }} />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile 
            ? '1fr' 
            : isTablet 
              ? '1fr 1px 1fr' 
              : 'auto 1px 1fr', 
          alignItems: 'center', 
          gap: isMobile ? 24 : 48 
        }}>
          <div>
            <div style={{ fontFamily: theme.mono, fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: theme.muted, marginBottom: 10 }}>
              Total Net Worth
            </div>
            <div style={{ 
              fontFamily: theme.display, 
              fontSize: isMobile ? '2.5rem' : '3.2rem', 
              fontWeight: 700, 
              color: theme.text, 
              letterSpacing: '-0.02em', 
              lineHeight: 1, 
              textShadow: `0 0 40px ${theme.accent + '30'}`,
              wordBreak: 'break-word',
            }}>
              {inrCompact(netWorth)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              {netWorth >= 0
                ? <TrendingUp size={13} style={{ color: theme.green }} strokeWidth={2} />
                : <TrendingDown size={13} style={{ color: theme.red }} strokeWidth={2} />}
              <span style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: netWorth >= 0 ? theme.green : theme.red, letterSpacing: '0.06em' }}>
                Assets minus liabilities
              </span>
            </div>
          </div>

          {!isMobile && (
            <div style={{ height: 64, background: `linear-gradient(180deg, transparent, ${theme.border}, transparent)` }} />
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: isMobile ? 16 : 32 
          }}>
            <div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.53rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.muted, marginBottom: 7 }}>
                Portfolio
              </div>
              <div style={{ fontFamily: theme.display, fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 700, color: theme.text, lineHeight: 1, marginBottom: 5 }}>
                {inrCompact(portfolioValue)}
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.56rem', color: portfolioGainPct >= 0 ? theme.green : theme.red, letterSpacing: '0.05em' }}>
                {portfolioGainPct >= 0 ? '+' : ''}{portfolioGainPct.toFixed(1)}% all-time
              </div>
            </div>
            <div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.53rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.muted, marginBottom: 7 }}>
                Savings / mo
              </div>
              <div style={{ fontFamily: theme.display, fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 700, color: theme.text, lineHeight: 1, marginBottom: 5 }}>
                {inr(savings)}
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.56rem', color: savings >= 0 ? theme.green : theme.red, letterSpacing: '0.05em' }}>
                {savingsRate.toFixed(1)}% rate
              </div>
            </div>
            <div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.53rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.muted, marginBottom: 7 }}>
                Emergency Fund
              </div>
              <div style={{ fontFamily: theme.display, fontSize: isMobile ? '1.3rem' : '1.45rem', fontWeight: 700, color: theme.text, lineHeight: 1, marginBottom: 5 }}>
                {emergencyMonths}m
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: '0.56rem', color: parseFloat(emergencyMonths) >= 6 ? theme.green : theme.yellow, letterSpacing: '0.05em' }}>
                of expenses covered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile 
          ? 'repeat(2, 1fr)' 
          : isTablet 
            ? 'repeat(2, 1fr)' 
            : 'repeat(4, 1fr)', 
        gap: 12 
      }}>
        <MetricCard label="Net Worth"       value={inrCompact(netWorth)}        sub="Assets minus debts"                         icon={BarChart2}   accent={theme.accent}  delay={60}  />
        <MetricCard label="Portfolio"       value={inrCompact(portfolioValue)}  sub={`${portfolioGainPct >= 0 ? '+' : ''}${portfolioGainPct.toFixed(1)}% all-time`} icon={TrendingUp}  accent={portfolioGainPct >= 0 ? theme.green : theme.red} delay={120} />
        {!isMobile && (
          <>
            <MetricCard label="Monthly Savings" value={inr(savings)}                sub={`${savingsRate.toFixed(1)}% of income`}     icon={Wallet}      accent={savings >= 0 ? theme.green : theme.red} delay={180} />
            <MetricCard label="Emergency Fund"  value={`${emergencyMonths}m`}       sub="of expenses covered"                        icon={Shield}      accent={parseFloat(emergencyMonths) >= 6 ? theme.green : theme.yellow} delay={240} />
          </>
        )}
      </div>

      {/* Mobile - Second row of KPI cards */}
      {isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <MetricCard label="Monthly Savings" value={inr(savings)} sub={`${savingsRate.toFixed(1)}% of income`} icon={Wallet} accent={savings >= 0 ? theme.green : theme.red} delay={180} />
          <MetricCard label="Emergency Fund" value={`${emergencyMonths}m`} sub="of expenses covered" icon={Shield} accent={parseFloat(emergencyMonths) >= 6 ? theme.green : theme.yellow} delay={240} />
        </div>
      )}

      {/* ── Income / Expenses / Debt ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : 'repeat(3, 1fr)', 
        gap: 12 
      }}>
        <StatPill label="Monthly Income"   value={inr(monthlyIncome)}   color={theme.green}  icon={ArrowUpRight}   delay={100} />
        <StatPill label="Monthly Expenses" value={inr(monthlyExpenses)} color={theme.red}    icon={ArrowDownRight} delay={160} />
        <StatPill label="Total Debt"       value={inr(totalDebt)}       color={theme.yellow} icon={DollarSign}     delay={220} />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : '1.55fr 1fr', 
        gap: 16 
      }}>

        {/* Net Worth Trend */}
        <div style={{
          ...glass(0.04, 20),
          border: `1px solid ${theme.border}`,
          borderRadius: 16, 
          padding: isMobile ? '20px' : '24px 24px 16px',
          boxShadow: glassInset,
          position: 'relative', 
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <SectionLabel>Net Worth Trend</SectionLabel>
            <span style={{ fontFamily: theme.mono, fontSize: '0.54rem', color: theme.muted, letterSpacing: '0.10em' }}>
              Last {chartData.length} months
            </span>
          </div>
          <div style={{ height: isMobile ? 150 : 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={theme.accent} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: theme.muted, fontSize: 9, fontFamily: theme.mono }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: theme.muted, fontSize: 9, fontFamily: theme.mono }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<NWTooltip />} cursor={{ stroke: theme.borderHi, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke={theme.accent} strokeWidth={1.5} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: theme.accent, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation */}
        <div style={{
          ...glass(0.04, 20),
          border: `1px solid ${theme.border}`,
          borderRadius: 16, 
          padding: isMobile ? '20px' : '24px',
          boxShadow: glassInset,
          position: 'relative', 
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <SectionLabel>Allocation</SectionLabel>
            <span style={{ fontFamily: theme.mono, fontSize: '0.54rem', color: theme.muted }}>
              {inrCompact(totalAlloc)}
            </span>
          </div>

          {allocationData.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontFamily: theme.mono, fontSize: '0.7rem' }}>
              No assets to display
            </div>
          ) : (
            <>
              <div style={{ height: 140, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={isMobile ? 35 : 44} outerRadius={isMobile ? 50 : 64} paddingAngle={2} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {allocationData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-0.6em" style={{ fontFamily: theme.mono, fontSize: '0.5rem', fill: theme.muted }}>TOTAL</tspan>
                      <tspan x="50%" dy="1.4em" style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.65rem' : '0.72rem', fill: theme.text, fontWeight: 600 }}>₹{inrCompact(totalAlloc)}</tspan>
                    </text>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)', 
                gap: '6px 10px', 
                marginTop: 12,
                maxHeight: isMobile ? 'none' : 140,
                overflowY: isMobile ? 'visible' : 'auto',
              }}>
                {allocationData.slice(0, isMobile ? 5 : 6).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 5px ${d.color + '80'}` }} />
                    <span style={{ fontFamily: theme.mono, fontSize: '0.54rem', color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.name} <span style={{ color: theme.text }}>({d.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
              {allocationData.length > (isMobile ? 5 : 6) && (
                <div style={{ fontFamily: theme.mono, fontSize: '0.50rem', color: theme.muted, textAlign: 'center', marginTop: 6 }}>
                  +{allocationData.length - (isMobile ? 5 : 6)} more
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div style={{
        ...glass(0.04, 20),
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        boxShadow: glassInset,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '16px 16px 0' : '20px 20px 0' }}>
          <SectionLabel>Recent Transactions</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={10} style={{ color: theme.muted }} />
            <span style={{ fontFamily: theme.mono, fontSize: '0.53rem', color: theme.muted, letterSpacing: '0.10em' }}>Last 7</span>
          </div>
        </div>
        {!recentTransactions?.length ? (
          <div style={{ padding: isMobile ? '30px 20px' : '40px', textAlign: 'center', fontFamily: theme.mono, fontSize: '0.7rem', color: theme.muted }}>
            No transactions yet
          </div>
        ) : (
          recentTransactions.slice(0, 7).map((t, i) => (
            <TxRow key={t.id} t={t} i={i} total={Math.min(recentTransactions.length, 7)} />
          ))
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile 
            ? 'repeat(2, 1fr)' 
            : 'repeat(4, 1fr)', 
          gap: isMobile ? 8 : 10 
        }}>
          <ActionBtn 
            label="Add Transaction" 
            icon={Zap}       
            onClick={() => handleNavigate('/budget')}    
            color={theme.accent} 
          />
          <ActionBtn 
            label="View Portfolio"  
            icon={PieIcon}   
            onClick={() => handleNavigate('/portfolio')} 
            color={theme.purple} 
          />
          <ActionBtn 
            label="Manage Cash"     
            icon={Wallet}    
            onClick={() => handleNavigate('/cash')}      
            color={theme.green}  
          />
          <ActionBtn 
            label="Check Goals"     
            icon={Target}    
            onClick={() => handleNavigate('/goals')}     
            color={theme.yellow} 
          />
        </div>
      </div>

    </div>
  )
}