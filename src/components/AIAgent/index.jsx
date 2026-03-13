// src/components/dashboard/AIAgent.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTheme }              from '../../context/ThemeContext.jsx'
import { useFinance }            from '../../context/FinanceContext.jsx'
import { useHoldings }           from '../../hooks/useHoldings'
import { usePortfolioData }      from '../../hooks/usePortfolioData'
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots'
import { useGoals }              from '../../hooks/useGoals'
import { useFlexBudget }         from '../../hooks/useFlexBudget'
import { useTransactionsRange }  from '../../hooks/useTransactions'
import { useDebts }              from '../../hooks/useDebts'
import { inr, inrCompact, currentMonth } from '../../lib/formatters.js'
import {
  TrendingUp, TrendingDown, Wallet, Target, PieChart,
  BarChart3, Shield, Zap, ArrowUp, ArrowDown,
  ChevronRight, Layers, Receipt, Globe, Cpu,
  Scale, Sparkles, Info, AlertTriangle, CheckCircle,
  Home, RefreshCw, CircleDot, Send, Bot,
} from 'lucide-react'

// ─── Glass helpers ─────────────────────────────────────────────────────────
const makeGlass = (isDark, o = 0.04, b = 20) => ({
  background:           isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.7})`,
  backdropFilter:       `blur(${b}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(160%)`,
})
const makeInset = (isDark) => isDark
  ? `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
  : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.04)`
const shine = {
  position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
  pointerEvents: 'none',
}

// ─── Formatters ────────────────────────────────────────────────────────────
function pct(n, plus = true) {
  if (n === undefined || n === null || isNaN(n)) return '0.00%'
  const s = Math.abs(n).toFixed(2) + '%'
  if (plus && n > 0) return '+' + s
  if (n < 0) return '-' + s
  return s
}

// ─── Sub-components ────────────────────────────────────────────────────────

// Stat row — icon · label ·············· value
function StatRow({ icon: Icon, label, value, color, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: theme.muted }}>
        <Icon size={11} strokeWidth={1.8} style={{ flexShrink: 0 }}/>
        <span style={{ fontFamily: theme.mono, fontSize: '0.58rem', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <span style={{
        fontFamily: theme.mono, fontSize: '0.70rem', fontWeight: 500,
        color: color || theme.text,
      }}>{value}</span>
    </div>
  )
}

// Divider
function Div({ theme }) {
  return <div style={{ height: 1, background: theme.border, margin: '2px 0' }}/>
}

// Badge
function Badge({ color, icon: Icon, children, theme }) {
  const map = {
    green:  { bg: '#22c55e', border: '#22c55e' },
    red:    { bg: '#ef4444', border: '#ef4444' },
    yellow: { bg: '#f59e0b', border: '#f59e0b' },
    blue:   { bg: '#3b82f6', border: '#3b82f6' },
  }
  const c = map[color] || map.blue
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: `${c.bg}14`, border: `1px solid ${c.border}28`,
      color: c.bg,
      fontFamily: theme.mono, fontSize: '0.50rem',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      flexShrink: 0,
    }}>
      {Icon && <Icon size={9} strokeWidth={2}/>}
      {children}
    </div>
  )
}

// Info card wrapper
function InfoCard({ icon: Icon, title, badge, children, theme, isDark }) {
  return (
    <div style={{
      ...makeGlass(isDark, 0.04, 16),
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={shine}/>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.border}`,
          color: theme.muted, flexShrink: 0,
        }}>
          <Icon size={12} strokeWidth={1.8}/>
        </div>
        <span style={{
          fontFamily: theme.mono, fontSize: '0.58rem',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: theme.muted, flex: 1,
        }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

// Progress bar — single fill
function ProgressBar({ label, dotColor, spentPct, spent, limit, status, theme, isDark }) {
  const clipped = Math.min(spentPct, 100)
  const fillColor = status === 'over' ? theme.red : status === 'warn' ? theme.yellow : dotColor
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.muted }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: fillColor, flexShrink: 0 }}/>
          <span style={{ fontFamily: theme.mono, fontSize: '0.55rem', letterSpacing: '0.04em' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'over'
            ? <Badge color="red"   icon={AlertTriangle} theme={theme}>Over by {inrCompact(spent - limit)}</Badge>
            : status === 'warn'
            ? <Badge color="yellow" icon={AlertTriangle} theme={theme}>{pct(spentPct, false)} used</Badge>
            : <Badge color="green"  icon={CheckCircle}   theme={theme}>{pct(spentPct, false)} used</Badge>
          }
          <span style={{ fontFamily: theme.mono, fontSize: '0.58rem', color: theme.muted }}>
            {inrCompact(spent)} / {inrCompact(limit)}
          </span>
        </div>
      </div>
      <div style={{
        height: 5, borderRadius: 999,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${clipped}%`, height: '100%', borderRadius: 999,
          background: fillColor,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${fillColor}50`,
        }}/>
      </div>
    </div>
  )
}

// Dual progress bar — current vs target with marker
function AllocationBar({ label, dotColor, currentPct, targetPct, currentValue, theme, isDark }) {
  const drift  = currentPct - targetPct
  const clipped = Math.min(currentPct, 100)
  const markerLeft = Math.min(targetPct, 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }}/>
          <span style={{ fontFamily: theme.mono, fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.04em' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Math.abs(drift) < 0.5
            ? <Badge color="green"  icon={CheckCircle}   theme={theme}>On target</Badge>
            : drift > 0
            ? <Badge color="yellow" icon={AlertTriangle} theme={theme}>+{drift.toFixed(1)}% over</Badge>
            : <Badge color="blue"   icon={Info}          theme={theme}>{drift.toFixed(1)}% under</Badge>
          }
          <span style={{ fontFamily: theme.mono, fontSize: '0.58rem', color: dotColor, fontWeight: 500 }}>
            {pct(currentPct, false)}
          </span>
        </div>
      </div>
      {/* Dual track */}
      <div style={{
        height: 7, borderRadius: 999,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        position: 'relative', overflow: 'visible',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: `${clipped}%`, height: '100%', borderRadius: 999,
          background: dotColor, opacity: 0.85,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }}/>
        {/* Target marker */}
        <div style={{
          position: 'absolute', top: -3, left: `${markerLeft}%`,
          width: 2, height: 13,
          borderRadius: 999,
          background: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.30)',
          transform: 'translateX(-50%)',
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: theme.mono, fontSize: '0.48rem', color: theme.muted }}>{inrCompact(currentValue)}</span>
        <span style={{ fontFamily: theme.mono, fontSize: '0.48rem', color: theme.muted }}>Target {pct(targetPct, false)}</span>
      </div>
    </div>
  )
}

// Reasoning block
function ReasoningBox({ title, items, theme, isDark }) {
  const colorMap = {
    green:  '#22c55e', red: '#ef4444',
    yellow: '#f59e0b', blue: '#3b82f6', purple: '#a78bfa',
  }
  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${theme.border}`,
      borderLeft: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.muted }}>
        <Sparkles size={10} strokeWidth={1.8}/>
        <span style={{ fontFamily: theme.mono, fontSize: '0.50rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      {items.map(([IconComp, color, text], i) => {
        const c = colorMap[color] || color
        return (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${c}16`, border: `1px solid ${c}26`, color: c,
              marginTop: 1,
            }}>
              <IconComp size={10} strokeWidth={2}/>
            </div>
            <p style={{
              fontFamily: theme.sans, fontSize: '0.80rem',
              lineHeight: 1.65, color: theme.muted, margin: 0,
            }}>{text}</p>
          </div>
        )
      })}
    </div>
  )
}

// Trade row
function TradeRow({ action, ticker, detail, amount, theme, isDark }) {
  const isBuy   = action === 'BUY'
  const color   = isBuy ? '#22c55e' : '#ef4444'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9,
      border: `1px solid ${theme.border}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}14`, border: `1px solid ${color}24`, color,
        flexShrink: 0,
      }}>
        {isBuy ? <ArrowUp size={10} strokeWidth={2.5}/> : <ArrowDown size={10} strokeWidth={2.5}/>}
      </div>
      <span style={{ fontFamily: theme.mono, fontSize: '0.65rem', color: theme.text, fontWeight: 500, flex: 1 }}>
        {ticker}
      </span>
      <span style={{ fontFamily: theme.mono, fontSize: '0.55rem', color: theme.muted }}>{detail}</span>
      <span style={{ fontFamily: theme.mono, fontSize: '0.65rem', fontWeight: 500, color, textAlign: 'right' }}>
        {isBuy ? '+' : '-'}{amount}
      </span>
    </div>
  )
}

// Suggestion chips
function Chips({ items, onSelect, theme, isDark }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {items.map(([Icon, label], i) => (
        <button key={i} onClick={() => onSelect(label)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px',
            ...makeGlass(isDark, 0.04, 10),
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            fontFamily: theme.mono, fontSize: '0.58rem',
            color: theme.muted, cursor: 'pointer',
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border;   e.currentTarget.style.color = theme.muted }}
        >
          <Icon size={11} strokeWidth={1.8} style={{ flexShrink: 0 }}/>
          {label}
        </button>
      ))}
    </div>
  )
}

// Thinking indicator
function Thinking({ theme, isDark }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: 'agentIn 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{`@keyframes agentIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...makeGlass(isDark, 0.06, 10),
        border: `1px solid ${theme.border}`,
        color: theme.muted, marginTop: 2,
      }}>
        <Bot size={14} strokeWidth={1.6}/>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        ...makeGlass(isDark, 0.04, 14),
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        fontFamily: theme.mono, fontSize: '0.58rem',
        color: theme.muted, letterSpacing: '0.04em',
      }}>
        <style>{`
          @keyframes td{0%,80%,100%{transform:scale(0.5);opacity:0.2}40%{transform:scale(1);opacity:1}}
        `}</style>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 0.16, 0.32].map((d, i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: theme.muted,
              animation: `td 1.4s ${d}s infinite both`,
            }}/>
          ))}
        </div>
        Analysing your data
      </div>
    </div>
  )
}

// ─── Response builder ──────────────────────────────────────────────────────
function useResponseBuilder(data, theme, isDark, onSelect) {
  const { holdings = [], quotesMap = {}, usdInrRate = 87.5, flexFund = {}, debts = [], goals = [] } = data

  // Compute portfolio metrics
  const portfolio = useMemo(() => {
    let value = 0, cost = 0
    const USD_EX = new Set(['NYSE','NASDAQ','PCX'])
    const list = holdings.filter(h => h.quantity > 0).map(h => {
      const isUSD  = h.asset_class === 'us_equity' || USD_EX.has(h.exchange) || h.currency === 'USD'
      const price  = quotesMap[h.ticker]?.price ?? h.avg_cost ?? 0
      const v      = price * h.quantity * (isUSD ? usdInrRate : 1)
      const c      = (h.avg_cost || 0) * h.quantity * (isUSD ? usdInrRate : 1)
      value += v; cost += c
      return { ...h, value: v, cost: c, gain: v - c, gainPct: c > 0 ? ((v-c)/c)*100 : 0 }
    })
    return { value, cost, gain: value - cost, gainPct: cost > 0 ? ((value-cost)/cost)*100 : 0, list }
  }, [holdings, quotesMap, usdInrRate])

  // by asset class
  const byClass = useMemo(() => {
    const map = {}
    portfolio.list.forEach(h => {
      const k = h.asset_class || 'equity'
      map[k] = (map[k] || 0) + h.value
    })
    return map
  }, [portfolio])

  const buildPortfolio = () => {
    const isUp   = portfolio.gain >= 0
    const topHoldings = [...portfolio.list].sort((a,b) => b.value - a.value).slice(0,5)
    const gainers     = [...portfolio.list].filter(h => h.gainPct > 0).sort((a,b) => b.gainPct - a.gainPct).slice(0,3)
    const losers      = [...portfolio.list].filter(h => h.gainPct < 0).sort((a,b) => a.gainPct - b.gainPct).slice(0,3)

    const allocBuckets = [
      { name: 'Equity',        color: '#3b82f6', classes: ['equity','etf','index_fund','mutual_fund','elss'], target: 60 },
      { name: 'Debt',          color: '#f59e0b', classes: ['debt_fund','liquid_fund','hybrid_fund'], target: 20 },
      { name: 'International', color: '#a78bfa', classes: ['us_equity'], target: 10 },
      { name: 'Commodities',   color: '#f59e0b', classes: ['gold','silver'], target: 5 },
      { name: 'Real Estate',   color: '#22c55e', classes: ['reit','invit'], target: 5 },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', lineHeight: 1.65, color: theme.muted, margin: 0 }}>
          Your portfolio is{' '}
          <strong style={{ color: isUp ? theme.green : theme.red }}>
            {isUp ? 'up' : 'down'} {pct(Math.abs(portfolio.gainPct), false)}
          </strong>{' '}
          against your cost basis.
          {portfolio.list.length === 0 && ' No active holdings found — start by adding your positions.'}
        </p>

        <InfoCard icon={TrendingUp} title="Portfolio Summary"
          badge={<Badge color={isUp ? 'green' : 'red'} icon={isUp ? TrendingUp : TrendingDown} theme={theme}>
            {pct(portfolio.gainPct)}
          </Badge>}
          theme={theme} isDark={isDark}>
          <StatRow icon={Wallet}       label="Current Value"    value={inrCompact(portfolio.value)}              theme={theme}/>
          <Div theme={theme}/>
          <StatRow icon={Scale}        label="Total Invested"   value={inrCompact(portfolio.cost)}               theme={theme}/>
          <StatRow icon={TrendingUp}   label="Unrealised Gain"  value={inrCompact(portfolio.gain)}
            color={portfolio.gain >= 0 ? theme.green : theme.red}                                                theme={theme}/>
          <StatRow icon={Zap}          label="XIRR (approx)"   value="—"                                        theme={theme}/>
          <Div theme={theme}/>
          <StatRow icon={CircleDot}    label="Active Positions" value={`${portfolio.list.length} holdings`}      theme={theme}/>
        </InfoCard>

        {portfolio.list.length > 0 && (
          <InfoCard icon={Layers} title="Asset Allocation vs Target" theme={theme} isDark={isDark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {allocBuckets.map(({ name, color, classes, target }) => {
                const bucketValue = classes.reduce((s, c) => s + (byClass[c] || 0), 0)
                const curPct = portfolio.value > 0 ? (bucketValue / portfolio.value) * 100 : 0
                return (
                  <AllocationBar key={name} label={name} dotColor={color}
                    currentPct={curPct} targetPct={target} currentValue={bucketValue}
                    theme={theme} isDark={isDark}/>
                )
              })}
            </div>
            <p style={{ fontFamily: theme.mono, fontSize: '0.50rem', color: theme.muted, margin: 0 }}>
              Thin white line marks your target. Filled bar is current allocation.
            </p>
          </InfoCard>
        )}

        {gainers.length > 0 && (
          <InfoCard icon={TrendingUp} title="Top Performers" theme={theme} isDark={isDark}>
            {gainers.map(h => (
              <StatRow key={h.ticker} icon={ArrowUp} label={h.name || h.ticker}
                value={pct(h.gainPct)} color={theme.green} theme={theme}/>
            ))}
            {losers.map(h => (
              <StatRow key={h.ticker} icon={ArrowDown} label={h.name || h.ticker}
                value={pct(h.gainPct)} color={theme.red} theme={theme}/>
            ))}
          </InfoCard>
        )}

        <ReasoningBox title="Key Observations" items={[
          [AlertTriangle, 'yellow', portfolio.list.length === 0
            ? 'No holdings found. Add your positions in the Portfolio page to get analysis.'
            : `Your overall ${isUp ? 'gain' : 'loss'} of ${pct(Math.abs(portfolio.gainPct),false)} is calculated against your average cost basis across all positions.`],
          [Info,          'blue',   'The white marker on each allocation bar is your target. Any bar extending past the marker means that bucket is overweight and may need trimming.'],
          [CheckCircle,   'green',  'XIRR requires daily price history — it will populate once the snapshot cron job has been running for at least 7 days.'],
        ]} theme={theme} isDark={isDark}/>

        <Chips items={[[Scale,'Should I rebalance now?'],[Receipt,'Show my recent trades'],[Zap,'Where to invest new money?']]}
          onSelect={onSelect} theme={theme} isDark={isDark}/>
      </div>
    )
  }

  const buildBudget = () => {
    const { categories = {}, totalAllocated = 0, totalSpent = 0 } = flexFund
    const catList = Object.entries(categories).filter(([n]) => n !== 'Flex Reserve')
    const overCount = catList.filter(([,d]) => d.isOver).length
    const hasData   = catList.length > 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', lineHeight: 1.65, color: theme.muted, margin: 0 }}>
          {!hasData
            ? <>No budget categories set up yet. Add limits in the <strong style={{color:theme.text}}>Budget</strong> page to start tracking.</>
            : overCount > 0
            ? <>You are <strong style={{ color: theme.red }}>over budget in {overCount} {overCount === 1 ? 'category' : 'categories'}</strong> this month. Here is the full breakdown.</>
            : <>Budget is on track this month. <strong style={{ color: theme.green }}>All categories within limits.</strong></>
          }
        </p>

        {hasData && (
          <InfoCard icon={Receipt} title={`${currentMonth()} Budget`}
            badge={<Badge color={overCount > 0 ? 'red' : 'green'}
              icon={overCount > 0 ? AlertTriangle : CheckCircle} theme={theme}>
              {inrCompact(totalSpent)} of {inrCompact(totalAllocated)}
            </Badge>}
            theme={theme} isDark={isDark}>
            <StatRow icon={Wallet}      label="Total Allocated" value={inrCompact(totalAllocated)} theme={theme}/>
            <StatRow icon={Receipt}     label="Total Spent"     value={inrCompact(totalSpent)}     theme={theme}/>
            <StatRow icon={TrendingDown} label="Remaining"      value={inrCompact(totalAllocated - totalSpent)}
              color={totalAllocated > totalSpent ? theme.green : theme.red}  theme={theme}/>
          </InfoCard>
        )}

        {hasData && (
          <InfoCard icon={BarChart3} title="Category Breakdown" theme={theme} isDark={isDark}>
            {catList.sort((a,b) => b[1].spent - a[1].spent).map(([name, d]) => (
              <ProgressBar key={name} label={name}
                dotColor={d.isOver ? theme.red : d.percentUsed > 85 ? theme.yellow : theme.blue}
                spentPct={d.percentUsed} spent={d.spent} limit={d.limit}
                status={d.isOver ? 'over' : d.percentUsed > 85 ? 'warn' : 'ok'}
                theme={theme} isDark={isDark}/>
            ))}
          </InfoCard>
        )}

        {hasData && (
          <ReasoningBox title="Spending Insights" items={[
            [AlertTriangle, 'red',    overCount > 0
              ? `${overCount} ${overCount>1?'categories have':'category has'} exceeded the monthly limit. Consider moving surplus from under-used categories to cover the gap using the flex budget controls.`
              : 'All categories are within budget. Keep monitoring as the month progresses.'],
            [Info,          'blue',   `Total spend rate: ${totalAllocated > 0 ? ((totalSpent/totalAllocated)*100).toFixed(1) : 0}% of allocated budget used. At this rate you will ${totalSpent/totalAllocated > 0.9 ? 'likely exceed' : 'finish within'} your total budget this month.`],
            [CheckCircle,   'green',  'Categories with remaining balance can be rolled over to next month using the Flex Budget rollover feature.'],
          ]} theme={theme} isDark={isDark}/>
        )}

        <Chips items={[[Receipt,'Add a transaction'],[Scale,'Move budget between categories'],[Wallet,'Show last month']]}
          onSelect={onSelect} theme={theme} isDark={isDark}/>
      </div>
    )
  }

  const buildDebts = () => {
    const totalDebt  = debts.reduce((s, d) => s + (d.balance || 0), 0)
    const sorted     = [...debts].sort((a,b) => (b.rate||0) - (a.rate||0))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', lineHeight: 1.65, color: theme.muted, margin: 0 }}>
          {debts.length === 0
            ? <><strong style={{ color: theme.green }}>No active debts.</strong> Focus on building your investment portfolio.</>
            : <>You have <strong style={{ color: theme.text }}>{debts.length} active {debts.length>1?'loans':'loan'}</strong> totalling <strong style={{ color: theme.red }}>{inrCompact(totalDebt)}</strong>. Here is the payoff strategy.</>
          }
        </p>

        {debts.length > 0 && (
          <InfoCard icon={Shield} title="Debt Summary"
            badge={<Badge color="red" icon={AlertTriangle} theme={theme}>{inrCompact(totalDebt)} total</Badge>}
            theme={theme} isDark={isDark}>
            {sorted.map((d, i) => (
              <div key={d.id || i}>
                <StatRow icon={i === 0 ? AlertTriangle : CircleDot}
                  label={d.name} value={`${inrCompact(d.balance)} @ ${d.rate}%`}
                  color={i === 0 ? theme.red : theme.text} theme={theme}/>
                {d.min_payment && (
                  <div style={{ paddingLeft: 20, marginTop: -4 }}>
                    <StatRow icon={Receipt} label="Min payment" value={`${inrCompact(d.min_payment)}/mo`} theme={theme}/>
                  </div>
                )}
              </div>
            ))}
          </InfoCard>
        )}

        {debts.length > 0 && sorted.length > 0 && (
          <>
            <InfoCard icon={Target} title="Recommended Payoff — Avalanche Method" theme={theme} isDark={isDark}>
              {sorted.map((d, i) => (
                <div key={d.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? `${theme.red}18` : `${theme.muted}14`,
                    border: `1px solid ${i === 0 ? theme.red+'30' : theme.border}`,
                    fontFamily: theme.mono, fontSize: '0.55rem',
                    color: i === 0 ? theme.red : theme.muted,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: theme.mono, fontSize: '0.65rem', color: theme.text }}>{d.name}</div>
                    <div style={{ fontFamily: theme.mono, fontSize: '0.52rem', color: theme.muted }}>{d.rate}% interest · {inrCompact(d.balance)} remaining</div>
                  </div>
                  {i === 0 && <Badge color="red" icon={Zap} theme={theme}>Pay first</Badge>}
                </div>
              ))}
            </InfoCard>

            <ReasoningBox title="Why Avalanche?" items={[
              [Zap,         'red',    `${sorted[0].name} has the highest interest rate at ${sorted[0].rate}%. Every extra rupee paid here saves the most in interest over time.`],
              [Shield,      'green',  'The Avalanche method (highest rate first) minimises total interest paid. It may feel slower than Snowball (smallest balance first) but costs less overall.'],
              [Info,        'blue',   sorted[0].rate > 15 ? `${sorted[0].rate}% is high-cost debt. Consider pausing non-essential investments until this is paid down.` : 'Your rates are manageable. Continue investing while making minimum payments on lower-rate loans.'],
            ]} theme={theme} isDark={isDark}/>
          </>
        )}

        <Chips items={[[Shield,'Payoff timeline'],[Wallet,'How much to pay monthly?'],[TrendingUp,'Invest vs pay debt?']]}
          onSelect={onSelect} theme={theme} isDark={isDark}/>
      </div>
    )
  }

  const buildGoals = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', lineHeight: 1.65, color: theme.muted, margin: 0 }}>
        {goals.length === 0
          ? <><strong style={{ color: theme.text }}>No goals set yet.</strong> Set financial goals in the Goals page to track your progress here.</>
          : <>You have <strong style={{ color: theme.text }}>{goals.length} financial {goals.length>1?'goals':'goal'}</strong> in progress.</>
        }
      </p>

      {goals.map((g, i) => {
        const progress = g.target > 0 ? Math.min(((g.saved||0)/g.target)*100, 100) : 0
        const remaining = (g.target||0) - (g.saved||0)
        let monthlyNeeded = null
        if (g.target_date && remaining > 0) {
          const d = new Date(g.target_date)
          const t = new Date()
          const months = Math.max(1, (d.getFullYear()-t.getFullYear())*12 + (d.getMonth()-t.getMonth()))
          monthlyNeeded = remaining / months
        }
        return (
          <InfoCard key={g.id || i} icon={Target} title={g.name}
            badge={<Badge color={progress >= 100 ? 'green' : progress > 50 ? 'blue' : 'yellow'}
              icon={progress >= 100 ? CheckCircle : CircleDot} theme={theme}>
              {progress.toFixed(0)}% done
            </Badge>}
            theme={theme} isDark={isDark}>
            <StatRow icon={Target}    label="Target"    value={inrCompact(g.target)}     theme={theme}/>
            <StatRow icon={Wallet}    label="Saved"     value={inrCompact(g.saved||0)}   theme={theme}/>
            <StatRow icon={TrendingUp} label="Remaining" value={inrCompact(remaining)}
              color={remaining > 0 ? theme.yellow : theme.green}                          theme={theme}/>
            {monthlyNeeded && (
              <StatRow icon={Zap} label="Monthly needed"
                value={`${inrCompact(monthlyNeeded)}/mo`} color={theme.blue}             theme={theme}/>
            )}
            <ProgressBar label={g.name} dotColor={theme.blue}
              spentPct={progress} spent={g.saved||0} limit={g.target}
              status={progress > 90 ? 'ok' : progress > 60 ? 'ok' : 'ok'}
              theme={theme} isDark={isDark}/>
          </InfoCard>
        )
      })}

      <Chips items={[[Target,'Add a new goal'],[Wallet,'How much to save monthly?'],[TrendingUp,'Invest for a goal']]}
        onSelect={onSelect} theme={theme} isDark={isDark}/>
    </div>
  )

  const buildHealth = () => {
    const isInProfit = portfolio.gain >= 0
    const debtTotal  = debts.reduce((s,d) => s+(d.balance||0), 0)
    const netWorth   = portfolio.value - debtTotal
    const { totalAllocated = 0, totalSpent = 0 } = flexFund
    const savingsRate = totalAllocated > 0 ? ((totalAllocated-totalSpent)/totalAllocated)*100 : 0

    const checks = [
      { label: 'Investing',      pass: portfolio.value > 0,    note: portfolio.value > 0 ? `${portfolio.list.length} positions, ${pct(portfolio.gainPct)} overall` : 'No holdings found' },
      { label: 'Budget tracking',pass: Object.keys(flexFund?.categories||{}).length > 0, note: 'Monthly limits configured' },
      { label: 'Debt managed',   pass: debtTotal < portfolio.value || debtTotal === 0, note: debtTotal === 0 ? 'Debt free' : `${inrCompact(debtTotal)} outstanding` },
      { label: 'Goals set',      pass: goals.length > 0,       note: goals.length > 0 ? `${goals.length} active goals` : 'No goals configured' },
      { label: 'Savings rate',   pass: savingsRate >= 15,       note: `${savingsRate.toFixed(1)}% of budget saved` },
    ]
    const score = checks.filter(c => c.pass).length

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', lineHeight: 1.65, color: theme.muted, margin: 0 }}>
          Overall financial health score: <strong style={{ color: score >= 4 ? theme.green : score >= 2 ? theme.yellow : theme.red }}>
            {score} / {checks.length}
          </strong>. Here is what is working and what needs attention.
        </p>

        <InfoCard icon={BarChart3} title="Net Worth Overview" theme={theme} isDark={isDark}>
          <StatRow icon={Wallet}    label="Portfolio Value" value={inrCompact(portfolio.value)} theme={theme}/>
          <StatRow icon={Shield}    label="Total Debt"      value={inrCompact(debtTotal)}
            color={debtTotal > 0 ? theme.red : theme.green}                                     theme={theme}/>
          <Div theme={theme}/>
          <StatRow icon={TrendingUp} label="Net Worth"      value={inrCompact(netWorth)}
            color={netWorth >= 0 ? theme.green : theme.red}                                     theme={theme}/>
          <StatRow icon={Zap}        label="Savings Rate"   value={`${savingsRate.toFixed(1)}%`}
            color={savingsRate >= 20 ? theme.green : savingsRate >= 10 ? theme.yellow : theme.red} theme={theme}/>
        </InfoCard>

        <InfoCard icon={CheckCircle} title="Health Checklist" theme={theme} isDark={isDark}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: c.pass ? `${theme.green}14` : `${theme.red}12`,
                border: `1px solid ${c.pass ? theme.green+'28' : theme.red+'22'}`,
                color: c.pass ? theme.green : theme.red,
              }}>
                {c.pass ? <CheckCircle size={10} strokeWidth={2}/> : <AlertTriangle size={10} strokeWidth={2}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.mono, fontSize: '0.62rem', color: theme.text }}>{c.label}</div>
                <div style={{ fontFamily: theme.mono, fontSize: '0.52rem', color: theme.muted }}>{c.note}</div>
              </div>
            </div>
          ))}
        </InfoCard>

        <ReasoningBox title="Priority Actions" items={[
          [Zap,         'yellow', checks.filter(c => !c.pass).length === 0
            ? 'All checks passing. Focus on increasing SIP amounts and reviewing allocation drift quarterly.'
            : `Start with: ${checks.filter(c=>!c.pass).map(c=>c.label).join(', ')}.`],
          [TrendingUp,  'green',  'A savings rate above 20% of income is the single most impactful lever for long-term wealth creation.'],
          [Shield,      'blue',   'Review your allocation drift every quarter. Small corrections early prevent large rebalancing trades later.'],
        ]} theme={theme} isDark={isDark}/>

        <Chips items={[[TrendingUp,'Analyse portfolio'],[Receipt,'Check budget'],[Scale,'Rebalance now']]}
          onSelect={onSelect} theme={theme} isDark={isDark}/>
      </div>
    )
  }

  return { buildPortfolio, buildBudget, buildDebts, buildGoals, buildHealth }
}

// ─── Intent matcher ────────────────────────────────────────────────────────
function matchIntent(q) {
  const l = q.toLowerCase()
  if (l.match(/portfolio|holding|position|invest|performance|gain|loss|xirr|return/)) return 'portfolio'
  if (l.match(/rebalanc|drift|alloc|target|overweight|underweight/))                  return 'rebalance'
  if (l.match(/budget|spend|expense|overspend|category|monthly|bill/))                return 'budget'
  if (l.match(/debt|loan|emi|credit|borrow|pay.?off/))                               return 'debt'
  if (l.match(/goal|target|save for|saving for|when will/))                          return 'goal'
  if (l.match(/health|report|overview|summary|net.?worth|how am i/))                 return 'health'
  if (l.match(/invest.*₹|put.*₹|deploy|where.*invest|new money|₹.*invest/))         return 'invest'
  return 'health'
}

// ─── Welcome prompts ───────────────────────────────────────────────────────
const WELCOME_PROMPTS = [
  { icon: TrendingUp,  title: 'Portfolio Overview',    sub: 'Performance, gains, allocation',  q: 'How is my portfolio doing overall?' },
  { icon: Scale,       title: 'Rebalancing Check',     sub: 'Drift analysis, buy/sell plan',   q: 'Should I rebalance my portfolio?'   },
  { icon: Receipt,     title: 'Budget Analysis',       sub: 'Spending patterns, overspend',    q: 'Where am I overspending this month?'},
  { icon: BarChart3,   title: 'Financial Health',      sub: 'Net worth, savings rate, goals',  q: 'Give me a financial health report'  },
]

// ─── Main component ────────────────────────────────────────────────────────
export default function AIAgent() {
  const { theme, isDark } = useTheme()
  const { userId }        = useFinance()
  const gi                = makeInset(isDark)

  const monthStr = currentMonth()

  // Connect all the hooks
  const { data: holdings = [],   isLoading: l1 } = useHoldings(userId)
  const { data: portfolioData,   isLoading: l2 } = usePortfolioData(userId)
  const { data: goals = [],      isLoading: l3 } = useGoals(userId)
  const { data: debts = [],      isLoading: l4 } = useDebts(userId)
  const { flexFund,              isLoading: l5 } = useFlexBudget(userId, monthStr)
  const { data: txData }                         = useTransactionsRange(userId, `${monthStr}-01`, `${monthStr}-31`)

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const endRef    = useRef(null)
  const inputRef  = useRef(null)
  const textaRef  = useRef(null)

  const isLoading = l1 || l2 || l3 || l4 || l5

  // Combine all data for the advisor
  const advisorData = useMemo(() => ({
    holdings,
    quotesMap:   portfolioData?.quotesMap || {},
    usdInrRate:  portfolioData?.usdInrRate || 87.5,
    goals,
    debts,
    flexFund:    flexFund || {},
    transactions: txData || [],
  }), [holdings, portfolioData, goals, debts, flexFund, txData])

  // Debug log to verify data is flowing
  useEffect(() => {
    console.log('AIAgent Data Loaded:', {
      holdingsCount: holdings.length,
      goalsCount: goals.length,
      debtsCount: debts.length,
      hasFlexFund: !!flexFund,
      hasQuotes: !!portfolioData?.quotesMap,
    })
  }, [holdings, goals, debts, flexFund, portfolioData])

  const handleSelect = useCallback((q) => {
    setInput(q)
    setTimeout(() => sendMessage(q), 0)
  }, [])

  const { buildPortfolio, buildBudget, buildDebts, buildGoals, buildHealth } =
    useResponseBuilder(advisorData, theme, isDark, handleSelect)

  const buildResponse = useCallback((q) => {
    const intent = matchIntent(q)
    switch (intent) {
      case 'portfolio': return buildPortfolio()
      case 'budget':    return buildBudget()
      case 'debt':      return buildDebts()
      case 'goal':      return buildGoals()
      default:          return buildHealth()
    }
  }, [buildPortfolio, buildBudget, buildDebts, buildGoals, buildHealth])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = useCallback(async (q) => {
    const query = (q || input).trim()
    if (!query) return

    setInput('')
    if (textaRef.current) { textaRef.current.style.height = 'auto' }

    setMessages(prev => [...prev, { role: 'user', content: query, id: Date.now() }])
    setThinking(true)

    // Simulate processing time
    await new Promise(r => setTimeout(r, 900 + Math.random() * 500))
    
    try {
      const response = buildResponse(query)
      setThinking(false)
      setMessages(prev => [...prev, { role: 'assistant', content: response, id: Date.now() + 1 }])
    } catch (error) {
      console.error('Error building response:', error)
      setThinking(false)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: <div style={{ color: theme.red }}>Sorry, I encountered an error analyzing your request.</div>, 
        id: Date.now() + 1 
      }])
    }
  }, [input, buildResponse, theme])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleTextInput = (e) => {
    setInput(e.target.value)
    const t = e.target
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 400,
        ...makeGlass(isDark, 0.04, 16),
        border: `1px solid ${theme.border}`, borderRadius: 18,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          <RefreshCw size={22} style={{ color: theme.muted, animation: 'spin 1.2s linear infinite' }}/>
          <span style={{ fontFamily: theme.mono, fontSize: '0.62rem', color: theme.muted, letterSpacing: '0.08em' }}>
            Loading financial data
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', gap: 0 }}>
      <style>{`
        @keyframes agentIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes userIn {from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px 0 12px',
        display: 'flex', flexDirection: 'column', gap: 24,
        scrollBehavior: 'smooth',
      }}>

        {/* Welcome */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{
                fontFamily: theme.display || theme.sans,
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 400, color: theme.text,
                lineHeight: 1.2, margin: 0,
              }}>
                Your portfolio,<br/>understood.
              </h2>
              <p style={{ fontFamily: theme.sans, fontSize: '0.875rem', color: theme.muted, marginTop: 10, lineHeight: 1.6, maxWidth: 440 }}>
                Ask me anything about your investments, rebalancing, budget, or performance.
                I reason through the numbers and show you exactly what to do.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {WELCOME_PROMPTS.map(({ icon: Icon, title, sub, q }) => (
                <button key={q} onClick={() => handleSelect(q)}
                  style={{
                    ...makeGlass(isDark, 0.04, 16),
                    border: `1px solid ${theme.border}`,
                    borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                    boxShadow: gi,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border;   e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={shine}/>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...makeGlass(isDark, 0.06, 10),
                    border: `1px solid ${theme.border}`, color: theme.muted,
                  }}>
                    <Icon size={13} strokeWidth={1.8}/>
                  </div>
                  <div>
                    <div style={{ fontFamily: theme.sans, fontSize: '0.80rem', fontWeight: 500, color: theme.text }}>{title}</div>
                    <div style={{ fontFamily: theme.mono, fontSize: '0.52rem', color: theme.muted, marginTop: 3, letterSpacing: '0.04em' }}>{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id}
            style={{
              display: 'flex', gap: 12,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: msg.role === 'user' ? 'userIn 0.2s ease' : 'agentIn 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...makeGlass(isDark, msg.role === 'user' ? 0.08 : 0.06, 10),
              border: `1px solid ${msg.role === 'user' ? theme.blue+'30' : theme.border}`,
              color: msg.role === 'user' ? theme.blue : theme.muted,
            }}>
              {msg.role === 'user'
                ? <ArrowUp size={13} strokeWidth={2.2}/>
                : <TrendingUp size={13} strokeWidth={1.8}/>
              }
            </div>

            {/* Content */}
            <div style={{ maxWidth: msg.role === 'user' ? '72%' : '100%', flex: msg.role === 'assistant' ? 1 : undefined }}>
              {msg.role === 'user' ? (
                <div style={{
                  ...makeGlass(isDark, 0.06, 12),
                  border: `1px solid ${theme.border}`,
                  borderRadius: '13px 13px 4px 13px',
                  padding: '10px 14px',
                  fontFamily: theme.mono, fontSize: '0.82rem',
                  color: theme.text, lineHeight: 1.5,
                }}>
                  {msg.content}
                </div>
              ) : (
                <div>
                  <div style={{
                    fontFamily: theme.mono, fontSize: '0.50rem',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: theme.muted, marginBottom: 8,
                  }}>
                    PortaFi Agent
                  </div>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && <Thinking theme={theme} isDark={isDark}/>}
        <div ref={endRef}/>
      </div>

      {/* ── Input ── */}
      <div style={{
        ...makeGlass(isDark, 0.05, 20),
        border: `1px solid ${theme.border}`,
        borderRadius: 14, padding: '4px 6px 4px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        position: 'relative', overflow: 'hidden',
        boxShadow: gi,
        transition: 'border-color 0.2s',
      }}>
        <div style={shine}/>
        <textarea
          ref={textaRef}
          value={input}
          onChange={handleTextInput}
          onKeyDown={handleKey}
          placeholder="Ask about your portfolio, budget, or investments…"
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontFamily: theme.mono, fontSize: '0.80rem',
            padding: '10px 0', resize: 'none', overflow: 'hidden',
            lineHeight: 1.5, letterSpacing: '0.02em', minHeight: 38,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || thinking}
          style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: input.trim() && !thinking ? theme.accent : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
            border: `1px solid ${input.trim() && !thinking ? theme.accent : theme.border}`,
            color: input.trim() && !thinking ? (isDark ? '#0a0a0f' : '#fff') : theme.muted,
            cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: input.trim() && !thinking ? `0 0 16px ${theme.accent}25` : 'none',
          }}
          onMouseEnter={e => { if (input.trim() && !thinking) e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Send size={13} strokeWidth={2}/>
        </button>
      </div>
    </div>
  )
}