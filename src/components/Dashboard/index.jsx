import { useState, useEffect, useRef } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { KpiCard } from '../shared/ui.jsx'
import { Card } from '../shared/ui.jsx'
import { Btn } from '../shared/ui.jsx'
import { inr, inrCompact, pct, gainColor, fmtDate } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

// ── GOLD THEME TOKENS ────────────────────────────────────────────────────────
const G = {
  ink:        '#09090e',
  surface:    '#0f0e0a',
  card:       '#131109',
  cardHover:  '#181610',
  border:     'rgba(201,168,76,0.16)',
  borderHi:   'rgba(201,168,76,0.35)',
  gold:       '#c9a84c',
  goldLight:  '#e8c96b',
  goldDim:    'rgba(201,168,76,0.10)',
  goldGlow:   'rgba(201,168,76,0.06)',
  text:       '#f0ebe0',
  muted:      '#6e6558',
  green:      '#5cb87a',
  red:        '#d96b6b',
  mono:       "'DM Mono', 'Courier New', monospace",
  display:    "'Cormorant Garamond', Georgia, serif",
  sans:       "'DM Sans', system-ui, sans-serif",
}

// ── FONT INJECTION ───────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (document.getElementById('portafi-fonts')) return
    const l = document.createElement('link')
    l.id   = 'portafi-fonts'
    l.rel  = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap'
    document.head.appendChild(l)
  }, [])
}

// ── FADE-IN HOOK ─────────────────────────────────────────────────────────────
function useFadeIn(delay = 0) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return [ref, vis]
}

// ── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 20, height: 1, background: G.gold, display: 'inline-block' }} />
      <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.gold }}>
        {children}
      </span>
    </div>
  )
}

// ── METRIC CARD ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent, delay = 0, large = false }) {
  const [, vis] = useFadeIn(delay)
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? G.cardHover : G.card,
        border: `1px solid ${hov ? G.borderHi : G.border}`,
        padding: large ? '28px 28px' : '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease, background 0.3s, border-color 0.3s',
      }}
    >
      {/* top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent || G.gold, opacity: hov ? 1 : 0.4, transition: 'opacity 0.3s' }} />
      {/* ambient glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: `radial-gradient(circle, ${accent || G.gold}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ fontFamily: G.mono, fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: G.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: G.display, fontSize: large ? '2.4rem' : '1.9rem', fontWeight: 300, lineHeight: 1, color: G.text, letterSpacing: '-0.01em', marginBottom: 8 }}>{value}</div>
      <div style={{ fontFamily: G.mono, fontSize: '0.6rem', color: accent || G.gold, letterSpacing: '0.08em' }}>{sub}</div>
    </div>
  )
}

// ── STAT PILL ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, delay = 0 }) {
  const [, vis] = useFadeIn(delay)
  return (
    <div style={{
      background: G.card,
      border: `1px solid ${G.border}`,
      padding: '18px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: G.muted }}>{label}</span>
      <span style={{ fontFamily: G.display, fontSize: '1.3rem', fontWeight: 400, color: color || G.text }}>{value}</span>
    </div>
  )
}

// ── CHART TOOLTIP ────────────────────────────────────────────────────────────
function NWTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: G.card, border: `1px solid ${G.borderHi}`, padding: '10px 14px' }}>
      <div style={{ fontFamily: G.mono, fontSize: '0.58rem', color: G.muted, letterSpacing: '0.1em', marginBottom: 4 }}>{payload[0]?.payload?.month}</div>
      <div style={{ fontFamily: G.display, fontSize: '1.1rem', color: G.goldLight }}>{inr(payload[0]?.value)}</div>
    </div>
  )
}

function PieTooltip({ active, payload, allocationData }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const total = allocationData.reduce((s, i) => s + i.value, 0)
  const pct = ((d.value / total) * 100).toFixed(1)
  return (
    <div style={{ background: G.card, border: `1px solid ${G.borderHi}`, padding: '10px 14px' }}>
      <div style={{ fontFamily: G.mono, fontSize: '0.58rem', color: G.muted, letterSpacing: '0.1em', marginBottom: 4 }}>{d.name}</div>
      <div style={{ fontFamily: G.display, fontSize: '1.1rem', color: G.goldLight }}>{inr(d.value)}</div>
      <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, marginTop: 2 }}>{pct}% of portfolio</div>
    </div>
  )
}

// ── TRANSACTION ROW ──────────────────────────────────────────────────────────
function TxRow({ t, i, total }) {
  const [hov, setHov] = useState(false)
  const isCredit = t.amount >= 0
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 20px',
        borderBottom: i < total - 1 ? `1px solid ${G.border}` : 'none',
        background: hov ? G.goldGlow : 'transparent',
        transition: 'background 0.25s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 34, height: 34,
          background: isCredit ? `${G.green}18` : `${G.red}18`,
          border: `1px solid ${isCredit ? G.green : G.red}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isCredit ? G.green : G.red,
          fontFamily: G.mono, fontSize: '0.8rem',
        }}>
          {isCredit ? '↑' : '↓'}
        </div>
        <div>
          <div style={{ fontFamily: G.sans, fontSize: '0.85rem', color: G.text, marginBottom: 2 }}>{t.description}</div>
          <div style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.muted, letterSpacing: '0.08em' }}>
            {t.category} · {fmtDate(t.date)}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: G.display, fontSize: '1.05rem', color: isCredit ? G.green : G.red }}>
        {isCredit ? '+' : ''}{inr(t.amount)}
      </div>
    </div>
  )
}

// ── QUICK ACTION BTN ─────────────────────────────────────────────────────────
function ActionBtn({ label, icon, href }) {
  const [hov, setHov] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '20px 12px',
        background: hov ? G.goldDim : G.card,
        border: `1px solid ${hov ? G.gold : G.border}`,
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '1.1rem', color: G.gold }}>{icon}</span>
      <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: hov ? G.goldLight : G.muted }}>{label}</span>
    </a>
  )
}

// ── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  useFonts()

  const {
    netWorth, portfolioValue, portfolioCost, portfolioGain,
    monthlyIncome, monthlyExpenses, totalDebt,
    transactions, cashAccounts, byAssetClass, nwHistory,
  } = useFinance()

  const portfolioGainPct  = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0
  const cashBalance        = cashAccounts?.reduce((s, a) => s + Number(a.balance), 0) || 0
  const emergencyMonths    = monthlyExpenses > 0 ? (cashBalance / monthlyExpenses).toFixed(1) : 'N/A'
  const savings            = monthlyIncome - monthlyExpenses
  const savingsRate        = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0

  // Allocation data
  const assetColors = {
    equity: '#00f5a0', us_equity: '#4f8eff', etf: '#ffd93d',
    index_fund: '#a8e6cf', elss: '#9b5cff', mutual_fund: '#ff9f43',
    debt_fund: '#54a0ff', liquid_fund: '#48dbfb', hybrid_fund: '#ff6b81',
    gold: '#f5c400', silver: '#b2bec3', reit: '#fd79a8',
    invit: '#e17055', crypto: '#6c5ce7', other: '#636e72',
  }
  const assetLabels = {
    equity: 'Equity', us_equity: 'US Equity', etf: 'ETF',
    index_fund: 'Index Fund', elss: 'ELSS', mutual_fund: 'Mutual Fund',
    debt_fund: 'Debt Fund', liquid_fund: 'Liquid Fund', hybrid_fund: 'Hybrid Fund',
    gold: 'Gold', silver: 'Silver', reit: 'REIT',
    invit: 'InvIT', crypto: 'Crypto', other: 'Other',
  }

  const allocationData = Object.entries(byAssetClass || {})
    .map(([k, v]) => ({ name: assetLabels[k] || k, value: v, color: assetColors[k] || G.gold, originalKey: k }))
    .filter(d => d.value > 0)
  if (cashBalance > 0) allocationData.push({ name: 'Cash & Bank', value: cashBalance, color: '#fbbf24', originalKey: 'cash' })
  allocationData.sort((a, b) => b.value - a.value)

  const chartData = nwHistory?.length >= 2
    ? nwHistory.map(s => ({ month: new Date(s.snapshot_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), value: Number(s.net_worth) }))
    : [{ month: 'Now', value: netWorth }]

  const totalAlloc = allocationData.reduce((s, i) => s + i.value, 0)

  return (
    <div style={{ fontFamily: G.sans, background: 'transparent', display: 'grid', gap: 24, padding: '4px 0' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 20, borderBottom: `1px solid ${G.border}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ width: 28, height: 1, background: G.gold, display: 'inline-block' }} />
            <span style={{ fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: G.gold }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily: G.display, fontSize: '2.2rem', fontWeight: 300, color: G.text, margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>
            Financial Overview
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.15em', color: G.muted }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.gold, marginTop: 4, letterSpacing: '0.1em' }}>
            ● Live
          </div>
        </div>
      </div>

      {/* ── NET WORTH HERO ── */}
      <div style={{
        background: G.card,
        border: `1px solid ${G.border}`,
        padding: '32px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G.gold}, ${G.goldLight}, ${G.gold})` }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: `radial-gradient(circle, ${G.gold}08 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 48 }}>
          <div>
            <div style={{ fontFamily: G.mono, fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.muted, marginBottom: 8 }}>Total Net Worth</div>
            <div style={{ fontFamily: G.display, fontSize: '3.4rem', fontWeight: 300, color: G.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{inrCompact(netWorth)}</div>
            <div style={{ fontFamily: G.mono, fontSize: '0.62rem', color: netWorth > 0 ? G.green : G.red, marginTop: 8, letterSpacing: '0.08em' }}>
              {netWorth > 0 ? '▲' : '▼'} Assets minus liabilities
            </div>
          </div>
          <div style={{ width: 1, height: 60, background: G.border, margin: '0 auto' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { label: 'Portfolio', val: inrCompact(portfolioValue), sub: `${portfolioGainPct >= 0 ? '+' : ''}${portfolioGainPct.toFixed(1)}% all-time`, col: portfolioGainPct >= 0 ? G.green : G.red },
              { label: 'Savings / mo', val: inr(savings), sub: `${savingsRate.toFixed(1)}% rate`, col: savings >= 0 ? G.green : G.red },
              { label: 'Emergency', val: `${emergencyMonths}m`, sub: 'of expenses', col: parseFloat(emergencyMonths) >= 6 ? G.green : G.goldLight },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: G.mono, fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: G.muted, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: G.display, fontSize: '1.5rem', fontWeight: 300, color: G.text, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontFamily: G.mono, fontSize: '0.57rem', color: s.col, letterSpacing: '0.06em' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <MetricCard label="Net Worth"      value={inrCompact(netWorth)}    sub="Assets minus debts"              accent={G.gold}  delay={60}  />
        <MetricCard label="Portfolio"      value={inrCompact(portfolioValue)} sub={`${portfolioGainPct >= 0 ? '+' : ''}${portfolioGainPct.toFixed(1)}% all-time`} accent={portfolioGainPct >= 0 ? G.green : G.red} delay={120} />
        <MetricCard label="Monthly Savings" value={inr(savings)}           sub={`${savingsRate.toFixed(1)}% of income`} accent={savings >= 0 ? G.green : G.red} delay={180} />
        <MetricCard label="Emergency Fund" value={`${emergencyMonths}m`}   sub="of expenses covered"             accent={parseFloat(emergencyMonths) >= 6 ? G.green : G.goldLight} delay={240} />
      </div>

      {/* ── INCOME / EXPENSES / DEBT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatPill label="Monthly Income"   value={inr(monthlyIncome)}                                       color={G.green}      delay={100} />
        <StatPill label="Monthly Expenses" value={inr(monthlyExpenses)}                                     color={G.red}        delay={160} />
        <StatPill label="Total Debt"       value={inr(totalDebt)}                                           color={G.goldLight}  delay={220} />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>

        {/* Net Worth Trend */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <SectionLabel>Net Worth Trend</SectionLabel>
            <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, letterSpacing: '0.1em' }}>Last {chartData.length} months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.gold} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={G.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: G.muted, fontSize: 9, fontFamily: G.mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: G.muted, fontSize: 9, fontFamily: G.mono }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'k'} />
              <Tooltip content={<NWTooltip />} cursor={{ stroke: G.borderHi, strokeWidth: 1 }} />
              <Area type="monotone" dataKey="value" stroke={G.gold} strokeWidth={1.5} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: G.gold, stroke: G.card, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Allocation */}
        <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <SectionLabel>Allocation</SectionLabel>
            <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted }}>{inrCompact(totalAlloc)}</span>
          </div>

          {allocationData.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted, fontFamily: G.mono, fontSize: '0.7rem' }}>
              No assets to display
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {allocationData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip allocationData={allocationData} />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 10px', marginTop: 12 }}>
                {allocationData.slice(0, 4).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.muted }}>
                      {item.name} <span style={{ color: G.text }}>({((item.value / totalAlloc) * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
              {allocationData.length > 4 && (
                <div style={{ fontFamily: G.mono, fontSize: '0.52rem', color: G.muted, textAlign: 'center', marginTop: 6 }}>
                  +{allocationData.length - 4} more
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div style={{ background: G.card, border: `1px solid ${G.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
          <SectionLabel>Recent Transactions</SectionLabel>
          <span style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, letterSpacing: '0.1em' }}>Last 7</span>
        </div>
        {!transactions?.length ? (
          <div style={{ padding: '40px', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>
            No transactions yet
          </div>
        ) : (
          transactions.slice(0, 7).map((t, i) => (
            <TxRow key={t.id} t={t} i={i} total={Math.min(transactions.length, 7)} />
          ))
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <ActionBtn label="Add Transaction" icon="＋" href="/budget" />
          <ActionBtn label="View Portfolio"  icon="◈" href="/portfolio" />
          <ActionBtn label="Manage Cash"     icon="◎" href="/cash" />
          <ActionBtn label="Check Goals"     icon="◇" href="/goals" />
        </div>
      </div>

    </div>
  )
}