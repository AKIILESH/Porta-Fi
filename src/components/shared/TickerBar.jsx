import { useState, useEffect } from 'react'
import theme from '../../lib/theme.js'
import { useIndices } from '../../hooks/useIndices.js'
import { pct } from '../../lib/formatters.js'

export default function TickerBar() {
  const { 
    data: indices, 
    isLoading, 
    error,
    refetch 
  } = useIndices()
  
  const [isPaused, setIsPaused] = useState(false)

  // Handle manual refetch on error
  const handleRetry = () => {
    refetch()
  }

  // If loading and no data yet, show minimal placeholder
  if (isLoading && !indices) {
    return (
      <div style={{ 
        height: 34, 
        background: theme.bg2, 
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}>
        <span style={{ fontSize: 12, fontFamily: theme.mono, color: theme.muted }}>
          Loading market data...
        </span>
      </div>
    )
  }

  // If error, show error state with retry
  if (error) {
    return (
      <div style={{ 
        height: 34, 
        background: theme.bg2, 
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <span style={{ fontSize: 12, fontFamily: theme.mono, color: theme.red }}>
          ⚠️ Failed to load market data
        </span>
        <button
          onClick={handleRetry}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 11,
            fontFamily: theme.mono,
            color: theme.accent,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  // If no data or empty, show placeholder
  if (!indices || Object.keys(indices).length === 0) {
    return (
      <div style={{ 
        height: 34, 
        background: theme.bg2, 
        borderBottom: `1px solid ${theme.border}` 
      }} />
    )
  }

  const items = Object.values(indices)

  // Double the items for continuous scrolling
  const tickers = [...items, ...items].map((q, i) => (
    <span 
      key={i} 
      style={{ 
        padding: '0 28px', 
        fontSize: 12, 
        fontFamily: theme.mono, 
        color: theme.muted,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ color: theme.text, fontWeight: 500 }}>{q.label}</span>
      <span style={{ color: theme.text }}>
        {q.price != null ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
      </span>
      <span style={{ 
        color: q.changePct >= 0 ? theme.accent : theme.red,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}>
        {q.changePct >= 0 ? '▲' : '▼'}
        {q.changePct != null ? pct(Math.abs(q.changePct)) : ''}
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
      position: 'relative',
    }}>
      {/* Gradient fade on edges */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 40,
        background: `linear-gradient(90deg, ${theme.bg2}, transparent)`,
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 40,
        background: `linear-gradient(270deg, ${theme.bg2}, transparent)`,
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Ticker container */}
      <div style={{
        display: 'inline-flex',
        animation: isPaused ? 'none' : 'ticker 40s linear infinite',
        whiteSpace: 'nowrap',
        paddingLeft: 20,
      }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {tickers}
      </div>
    </div>
  )
}