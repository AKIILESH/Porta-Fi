// src/components/Landing/PersonaSection.jsx
// Drop this between <TrackerSection /> and <AISection /> in your landing page
// Also add: import PersonaSection from './PersonaSection' at the top

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Persona data ──────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'salaried',
    tag: '01',
    label: 'Salaried Professionals',
    headline: 'Your salary works harder than you think — are you sure it\'s working hard enough?',
    body: 'PF, NPS, SIPs, home loan EMI, insurance — all running in the background. PortaFi pulls every thread together so you can see your actual net worth, not just your bank balance.',
    stats: [
      { val: '₹0', note: 'left untracked across PF + investments' },
      { val: '₹36K', note: 'avg tax saved via ELSS users find' },
      { val: '11min', note: 'to get a complete picture' },
    ],
    accent: '#3b82f6',
    insight: 'Your EPF is ₹4.2L you\'re not counting as net worth.',
    tags: ['PF / NPS', 'ELSS Tax Saving', 'SIP Tracker', 'Home Loan vs Invest'],
  },
  {
    id: 'founder',
    tag: '02',
    label: 'Founders & Freelancers',
    headline: 'Irregular income doesn\'t mean irregular investing.',
    body: 'Your cash flow is lumpy — big months, dry months. PortaFi\'s flex budget adjusts in real time, and the AI agent tells you exactly how much to deploy when a good month hits.',
    stats: [
      { val: '₹0', note: 'sitting idle in current account on avg' },
      { val: '2.4×', note: 'more invested by users with a plan' },
      { val: '30%', note: 'tax bracket — every rupee of deduction counts' },
    ],
    accent: '#f59e0b',
    insight: 'You have ₹80K idle. Liquid fund earns ₹420 more per month.',
    tags: ['Flex Budget', 'Irregular Income', 'Tax Planning', 'Deploy on Surplus'],
  },
  {
    id: 'investor',
    tag: '03',
    label: 'Active Investors',
    headline: 'You track stocks. You don\'t track the total picture.',
    body: 'Zerodha shows you P&L. Groww shows you NAV. But your actual XIRR across everything? The tax you\'ll owe in March? The allocation drift that crept in over 6 months? That\'s what PortaFi shows.',
    stats: [
      { val: '68%', note: 'of investors are equity overweight without knowing' },
      { val: '₹1.25L', note: 'LTCG exemption most investors never fully use' },
      { val: '4.2%', note: 'avg drag from exit loads and expense ratios' },
    ],
    accent: '#22c55e',
    insight: 'You\'re 8% overweight equity. Nifty is up 12% — good time to rebalance.',
    tags: ['XIRR Tracker', 'LTCG / STCG', 'Exit Load Watch', 'Rebalancing'],
  },
  {
    id: 'family',
    tag: '04',
    label: 'Family Finance',
    headline: 'Managing money for two is twice the complexity.',
    body: 'Spouse\'s SIPs, joint FDs, kids\' education goals, parents\' health cover — PortaFi lets you see the family portfolio in one view, with goals that track against real timelines.',
    stats: [
      { val: '3.1×', note: 'more likely to hit goals with joint tracking' },
      { val: '₹12L', note: 'avg untracked across family members' },
      { val: '2031', note: 'goal year most families aren\'t on track for' },
    ],
    accent: '#a78bfa',
    insight: 'Education goal is ₹3.2L short at current SIP rate. Needs ₹2,400 more/month.',
    tags: ['Joint Goals', 'Education Fund', 'Family Net Worth', 'Goal Timelines'],
  },
]

// ─── Tag pill ──────────────────────────────────────────────────────────────
function TagPill({ label, accent, theme }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 999,
      background: `${accent}14`,
      border: `1px solid ${accent}30`,
      fontFamily: theme.mono,
      fontSize: '0.50rem',
      letterSpacing: '0.08em',
      color: accent,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Stat item ─────────────────────────────────────────────────────────────
function StatItem({ val, note, accent, theme, isDark, delay }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.5s ${delay}s ease, transform 0.5s ${delay}s ease`,
    }}>
      <div style={{
        fontFamily: theme.display || theme.sans,
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 300,
        color: accent,
        lineHeight: 1,
        marginBottom: 6,
        letterSpacing: '-0.02em',
      }}>
        {val}
      </div>
      <div style={{
        fontFamily: theme.mono,
        fontSize: '0.55rem',
        color: theme.muted,
        lineHeight: 1.5,
        letterSpacing: '0.04em',
        maxWidth: 120,
      }}>
        {note}
      </div>
    </div>
  )
}

// ─── Main section ──────────────────────────────────────────────────────────
export default function PersonaSection() {
  const { theme, isDark } = useTheme()
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState(null)
  const [animDir, setAnimDir] = useState(1) // 1 = forward, -1 = back
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [headerRef, headerInView] = useInView(0.1)

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const isMobile = windowWidth <= 768

  function select(i) {
    if (i === active) return
    setAnimDir(i > active ? 1 : -1)
    setPrev(active)
    setActive(i)
    setTimeout(() => setPrev(null), 400)
  }

  const p = PERSONAS[active]

  return (
    <section style={{
      padding: isMobile ? '60px 20px 80px' : '120px 60px',
      borderTop: `1px solid ${theme.border}`,
      borderBottom: `1px solid ${theme.border}`,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Ambient glow follows active persona */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: active < 2 ? '-10%' : '40%',
        width: 600,
        height: 600,
        background: `radial-gradient(circle, ${p.accent}10 0%, transparent 65%)`,
        pointerEvents: 'none',
        transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* Header */}
      <div ref={headerRef} style={{ marginBottom: isMobile ? 40 : 64 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: theme.mono,
          fontSize: '0.62rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: theme.accent,
          marginBottom: 18,
        }}>
          <span style={{ width: 24, height: 1, background: theme.accent, display: 'inline-block' }} />
          Built for you
        </div>
        <h2 style={{
          fontFamily: theme.display || theme.sans,
          fontSize: isMobile ? '2rem' : 'clamp(2.4rem,4vw,3.6rem)',
          fontWeight: 300,
          lineHeight: 1.08,
          color: theme.text,
          maxWidth: 540,
          margin: 0,
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          Designed for{' '}
          <em style={{ fontStyle: 'italic', color: p.accent, transition: 'color 0.4s ease' }}>
            your
          </em>{' '}
          financial life
        </h2>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: isMobile ? 8 : 0,
        marginBottom: isMobile ? 32 : 48,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        borderBottom: isMobile ? 'none' : `1px solid ${theme.border}`,
      }}>
        {PERSONAS.map((persona, i) => {
          const isActive = i === active
          return (
            <button
              key={persona.id}
              onClick={() => select(i)}
              style={{
                padding: isMobile ? '10px 16px' : '16px 28px',
                background: isMobile
                  ? isActive ? `${persona.accent}15` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
                  : 'transparent',
                border: isMobile
                  ? `1px solid ${isActive ? persona.accent + '40' : theme.border}`
                  : 'none',
                borderBottom: isMobile ? undefined : isActive ? `2px solid ${persona.accent}` : '2px solid transparent',
                borderRadius: isMobile ? 10 : 0,
                color: isActive ? persona.accent : theme.muted,
                fontFamily: theme.mono,
                fontSize: isMobile ? '0.58rem' : '0.62rem',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = theme.text }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = theme.muted }}
            >
              <span style={{
                fontFamily: theme.mono,
                fontSize: '0.44rem',
                opacity: 0.5,
                letterSpacing: '0.04em',
              }}>
                {persona.tag}
              </span>
              {persona.label}
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div
        key={active}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 80,
          alignItems: 'start',
          animation: `personaIn 0.4s cubic-bezier(0.4,0,0.2,1) both`,
        }}
      >
        <style>{`
          @keyframes personaIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Left — copy */}
        <div>
          {/* Number + label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}>
            <span style={{
              fontFamily: theme.mono,
              fontSize: '0.50rem',
              letterSpacing: '0.14em',
              color: p.accent,
              padding: '3px 8px',
              borderRadius: 999,
              background: `${p.accent}14`,
              border: `1px solid ${p.accent}28`,
            }}>
              {p.tag}
            </span>
            <span style={{
              fontFamily: theme.mono,
              fontSize: '0.55rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: theme.muted,
            }}>
              {p.label}
            </span>
          </div>

          {/* Headline */}
          <h3 style={{
            fontFamily: theme.display || theme.sans,
            fontSize: isMobile ? '1.4rem' : 'clamp(1.5rem,2.5vw,2rem)',
            fontWeight: 300,
            lineHeight: 1.25,
            color: theme.text,
            marginBottom: 18,
            maxWidth: 440,
          }}>
            {p.headline}
          </h3>

          {/* Body */}
          <p style={{
            fontFamily: theme.sans,
            fontSize: isMobile ? '0.85rem' : '0.90rem',
            color: theme.muted,
            lineHeight: 1.82,
            marginBottom: 28,
            maxWidth: 440,
          }}>
            {p.body}
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 32 }}>
            {p.tags.map(tag => (
              <TagPill key={tag} label={tag} accent={p.accent} theme={theme} />
            ))}
          </div>

          {/* AI insight callout */}
          <div style={{
            display: 'flex',
            gap: 10,
            padding: '14px 18px',
            borderRadius: 10,
            background: isDark ? `${p.accent}10` : `${p.accent}08`,
            border: `1px solid ${p.accent}25`,
            borderLeft: `2px solid ${p.accent}`,
            maxWidth: 440,
          }}>
            <span style={{ color: p.accent, fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>✦</span>
            <div>
              <span style={{ fontFamily: theme.mono, fontSize: '0.50rem', color: p.accent, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                AI Insight
              </span>
              <span style={{ fontFamily: theme.sans, fontSize: '0.78rem', color: theme.text, lineHeight: 1.6 }}>
                {p.insight}
              </span>
            </div>
          </div>
        </div>

        {/* Right — stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 24 : 0,
        }}>
          {/* Stat blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: isMobile ? 0 : 28,
          }}>
            {p.stats.map((s, i) => (
              <div key={i} style={{
                padding: isMobile ? '20px 14px' : '28px 24px',
                borderRight: i < 2 ? `1px solid ${theme.border}` : 'none',
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Top accent line */}
                {i === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg,${p.accent}80,transparent)`,
                    transition: 'all 0.4s ease',
                  }} />
                )}
                <StatItem
                  val={s.val} note={s.note}
                  accent={p.accent} theme={theme} isDark={isDark}
                  delay={0.1 + i * 0.1}
                />
              </div>
            ))}
          </div>

          {/* Visual: use-case illustration as a mini card */}
          <div style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}>
            {/* Card header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: theme.mono, fontSize: '0.54rem', color: theme.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Portfolio snapshot
              </span>
              <span style={{
                fontFamily: theme.mono, fontSize: '0.48rem',
                padding: '2px 8px', borderRadius: 999,
                background: `${p.accent}14`, border: `1px solid ${p.accent}28`,
                color: p.accent,
              }}>
                Live
              </span>
            </div>

            {/* Mini allocation rows */}
            {[
              { label: 'Equity', pct: p.id === 'investor' ? 68 : p.id === 'family' ? 55 : 60, target: 60 },
              { label: 'Debt', pct: p.id === 'investor' ? 12 : p.id === 'family' ? 25 : 20, target: 20 },
              { label: 'Gold', pct: p.id === 'salaried' ? 10 : 8, target: 10 },
              { label: 'Cash', pct: p.id === 'founder' ? 18 : p.id === 'investor' ? 10 : 10, target: 10 },
            ].map((row, i) => {
              const drift = row.pct - row.target
              const driftCol = Math.abs(drift) > 5
                ? (drift > 0 ? '#f59e0b' : '#3b82f6')
                : '#22c55e'
              return (
                <div key={row.label} style={{
                  padding: '12px 20px',
                  borderBottom: i < 3 ? `1px solid ${theme.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: theme.mono, fontSize: '0.55rem', color: theme.muted, letterSpacing: '0.06em' }}>
                      {row.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {Math.abs(drift) > 5 && (
                        <span style={{
                          fontFamily: theme.mono, fontSize: '0.46rem',
                          padding: '1px 6px', borderRadius: 999,
                          background: `${driftCol}14`, border: `1px solid ${driftCol}28`,
                          color: driftCol,
                        }}>
                          {drift > 0 ? '+' : ''}{drift}%
                        </span>
                      )}
                      <span style={{ fontFamily: theme.mono, fontSize: '0.58rem', color: theme.text, fontWeight: 500 }}>
                        {row.pct}%
                      </span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div style={{
                    height: 8, borderRadius: 999,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    position: 'relative', overflow: 'visible',
                  }}>
                    <div style={{
                      width: `${Math.min(row.pct, 100)}%`,
                      height: '100%', borderRadius: 999,
                      background: p.accent, opacity: 0.8,
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: `0 0 8px ${p.accent}30`,
                    }} />
                    {/* Target marker */}
                    <div style={{
                      position: 'absolute', top: -3,
                      left: `${row.target}%`,
                      width: 2, height: 14, borderRadius: 999,
                      background: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
                      transform: 'translateX(-50%)',
                    }} />
                  </div>
                  <div style={{
                    fontFamily: theme.mono, fontSize: '0.44rem', color: theme.muted,
                    marginTop: 4, textAlign: 'right',
                  }}>
                    Target {row.target}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}