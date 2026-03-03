import theme from '../../lib/theme.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import { pct } from '../../lib/formatters.js'

export default function TickerBar() {
  const { indices } = useFinance()
  const items = Object.values(indices)

  if (!items.length) {
    return <div style={{ height: 34, background: theme.bg2, borderBottom: `1px solid ${theme.border}` }} />
  }

  const tickers = [...items, ...items].map((q, i) => (
    <span key={i} style={{ padding: '0 28px', fontSize: 12, fontFamily: theme.mono, color: theme.muted }}>
      <span style={{ color: theme.text, fontWeight: 500 }}>{q.label}</span>
      {'  '}
      <span style={{ color: theme.text }}>
        {q.price != null ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
      </span>
      {'  '}
      <span style={{ color: q.changePct >= 0 ? theme.accent : theme.red }}>
        {q.changePct != null ? pct(q.changePct) : ''}
      </span>
    </span>
  ))

  return (
    <div style={{
      height: 34,
      background: theme.bg2,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'inline-flex',
        animation: 'ticker 40s linear infinite',
        whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
      >
        {tickers}
      </div>
    </div>
  )
}
