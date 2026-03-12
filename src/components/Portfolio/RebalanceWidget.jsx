// src/components/portfolio/RebalanceWidget.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme }         from '../../context/ThemeContext.jsx'
import { useFinance }       from '../../context/FinanceContext.jsx'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import { useRebalance }     from '../../hooks/useRebalanceTargets'
import { inr, inrCompact }  from '../../lib/formatters'
import {
  computeCurrentAllocation,
  computeRebalancePlan,
  computeNewMoneyAllocation,
  computeFullRebalance,
  validateTargets,
  REBALANCE_BUCKETS,
} from '../../lib/rebalance'
import {
  TrendingUp, Globe, Shield, Coins, Building2, Zap,
  Settings2, X, Check, AlertTriangle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, PlusCircle
} from 'lucide-react'

// ── Glass helpers ──────────────────────────────────────────────────────────
const makeGlass = (isDark, o = 0.04, b = 20) => ({
  background: isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.7})`,
  backdropFilter: `blur(${b}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(160%)`,
})

const makeInset = (isDark) => isDark
  ? `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
  : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.04)`

const makeShine = (isDark) => ({
  position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
  background: isDark
    ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)'
    : 'linear-gradient(90deg,transparent,rgba(0,0,0,0.06),transparent)',
  pointerEvents: 'none',
})

// ── useWindowWidth Hook ────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return width
}

// ── Icon map ───────────────────────────────────────────────────────────────
const BUCKET_ICONS = {
  equity: TrendingUp,
  international: Globe,
  debt: Shield,
  commodities: Coins,
  real_estate: Building2,
  crypto: Zap,
}

// ── Combined Progress Bar (shows both current and target) ─────────────────
function CombinedBar({ currentPct, targetPct, color, isDark, isMobile, theme }) {
  const displayCurrent = Math.min(currentPct, 100)
  const displayTarget = Math.min(targetPct, 100)
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: isMobile ? 4 : 6, width: '100%' }}>
        {/* Background track */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderRadius: 999,
        }} />
        
        {/* Current fill */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${displayCurrent}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 999,
          boxShadow: `0 0 8px ${color}60`,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 2
        }} />
        
        {/* Target indicator */}
        <div style={{
          position: 'absolute',
          top: -2,
          bottom: -2,
          left: `calc(${displayTarget}% - 1px)`,
          width: 2,
          background: 'white',
          boxShadow: `0 0 8px ${color}`,
          zIndex: 3,
          borderRadius: 1
        }} />
      </div>
      
      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
        fontSize: isMobile ? '0.45rem' : '0.5rem',
        fontFamily: theme.mono,
        color: theme.muted
      }}>
        <span>C: <span style={{ color: theme.text }}>{currentPct.toFixed(1)}%</span></span>
        <span>T: <span style={{ color }}>{targetPct.toFixed(1)}%</span></span>
      </div>
    </div>
  )
}

// ── Drift badge ────────────────────────────────────────────────────────────
function DriftBadge({ driftPct, theme, isMobile }) {
  const abs = Math.abs(driftPct)
  const color = abs < 1 ? theme.green : abs < 3 ? theme.yellow : theme.red
  const label = abs < 1 ? '✓' : abs < 3 ? '∼' : '!'
  const sign = driftPct > 0 ? '+' : ''
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: isMobile ? '2px 4px' : '2px 6px',
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      width: 'fit-content'
    }}>
      <span style={{
        fontFamily: theme.mono,
        fontSize: isMobile ? '0.45rem' : '0.5rem',
        color,
        fontWeight: 600
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: theme.mono,
        fontSize: isMobile ? '0.45rem' : '0.5rem',
        color
      }}>
        {sign}{driftPct.toFixed(1)}%
      </span>
    </div>
  )
}

// ── Action badge ───────────────────────────────────────────────────────────
function ActionBadge({ action, amount, theme, isMobile }) {
  if (action === 'hold') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: theme.muted }}>
      <Minus size={isMobile ? 8 : 10} />
      <span style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.45rem' : '0.5rem' }}>—</span>
    </div>
  )
  
  const isBuy = action === 'buy'
  const color = isBuy ? theme.green : theme.red
  const Icon = isBuy ? ArrowUpRight : ArrowDownRight
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Icon size={isMobile ? 8 : 10} style={{ color }} />
      <span style={{
        fontFamily: theme.mono,
        fontSize: isMobile ? '0.5rem' : '0.55rem',
        fontWeight: 600,
        color
      }}>
        {inrCompact(Math.abs(amount))}
      </span>
    </div>
  )
}

// ── Mobile Card View (Compact) ─────────────────────────────────────────────
function MobilePlanCard({ plan, theme, isDark }) {
  if (!plan.length) return null
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {plan.map(r => {
        const cfg = REBALANCE_BUCKETS[r.bucket]
        const Icon = BUCKET_ICONS[r.bucket]
        if (!cfg) return null
        
        return (
          <div
            key={r.bucket}
            style={{
              ...makeGlass(isDark, 0.05, 10),
              border: `1px solid ${cfg.color}30`,
              borderRadius: 10,
              padding: 10,
            }}
          >
            {/* Header row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon && <Icon size={10} strokeWidth={1.8} style={{ color: cfg.color }} />}
                </div>
                <span style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.text }}>
                  {cfg.label}
                </span>
              </div>
              <DriftBadge driftPct={r.driftPct} theme={theme} isMobile={true} />
            </div>
            
            {/* Progress bar */}
            <CombinedBar
              currentPct={r.currentPct}
              targetPct={r.targetPct}
              color={cfg.color}
              isDark={isDark}
              isMobile={true}
              theme={theme}
            />
            
            {/* Action and value row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6
            }}>
              <span style={{ fontFamily: theme.mono, fontSize: '0.5rem', color: theme.muted }}>
                {inrCompact(r.currentValue)}
              </span>
              <ActionBadge action={r.action} amount={r.gapValue} theme={theme} isMobile={true} />
            </div>
          </div>
        )
      })}
      
      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        marginTop: 2,
        borderTop: `1px solid ${theme.border}`,
      }}>
        <span style={{ fontFamily: theme.mono, fontSize: '0.5rem', color: theme.muted }}>
          Total
        </span>
        <span style={{ fontFamily: theme.display, fontSize: '0.9rem', fontWeight: 700, color: theme.text }}>
          {inrCompact(plan.reduce((sum, r) => sum + r.currentValue, 0))}
        </span>
      </div>
    </div>
  )
}

// ── Desktop Table View ─────────────────────────────────────────────────────
function DesktopTableView({ plan, currentAllocation, theme, isDark }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 2.5fr 0.8fr 0.8fr',
        gap: 8,
        padding: '0 4px 8px',
        borderBottom: `1px solid ${theme.border}`,
        marginBottom: 4,
      }}>
        {['Bucket', 'Allocation', 'Drift', 'Action'].map(h => (
          <div key={h} style={{
            fontFamily: theme.mono,
            fontSize: '0.48rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: theme.muted
          }}>
            {h}
          </div>
        ))}
      </div>

      {plan.map(r => {
        const cfg = REBALANCE_BUCKETS[r.bucket]
        const Icon = BUCKET_ICONS[r.bucket]
        if (!cfg) return null
        
        return (
          <div key={r.bucket} style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 2.5fr 0.8fr 0.8fr',
            gap: 8,
            padding: '8px 4px',
            borderBottom: `1px solid ${theme.border}20`,
            alignItems: 'center',
          }}>
            {/* Bucket */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {Icon && <Icon size={11} strokeWidth={1.8} style={{ color: cfg.color }} />}
              </div>
              <div>
                <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.text }}>
                  {cfg.label}
                </div>
                <div style={{ fontFamily: theme.mono, fontSize: '0.45rem', color: theme.muted }}>
                  {inrCompact(r.currentValue)}
                </div>
              </div>
            </div>

            {/* Combined bar - with theme prop */}
            <CombinedBar
              currentPct={r.currentPct}
              targetPct={r.targetPct}
              color={cfg.color}
              isDark={isDark}
              isMobile={false}
              theme={theme}
            />

            {/* Drift */}
            <DriftBadge driftPct={r.driftPct} theme={theme} isMobile={false} />

            {/* Action */}
            <ActionBadge action={r.action} amount={r.gapValue} theme={theme} isMobile={false} />
          </div>
        )
      })}

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 4px 0',
        borderTop: `1px solid ${theme.border}`,
        marginTop: 4,
      }}>
        <span style={{ fontFamily: theme.mono, fontSize: '0.5rem', color: theme.muted, textTransform: 'uppercase' }}>
          Total
        </span>
        <span style={{ fontFamily: theme.display, fontSize: '1rem', fontWeight: 700, color: theme.text }}>
          {inrCompact(currentAllocation.total)}
        </span>
      </div>
    </div>
  )
}

// ── Slider row (used in setup overlay) ────────────────────────────────────
function SliderRow({ bucket, value, onChange, isDark, theme, isMobile }) {
  const cfg = REBALANCE_BUCKETS[bucket]
  const Icon = BUCKET_ICONS[bucket]
  const c = cfg.color

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
      gap: isMobile ? 8 : 12,
      alignItems: 'center',
      marginBottom: isMobile ? 12 : 16
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: isMobile ? 20 : 24,
              height: isMobile ? 20 : 24,
              borderRadius: 6,
              background: `${c}20`, border: `1px solid ${c}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Icon && <Icon size={isMobile ? 9 : 11} strokeWidth={1.8} style={{ color: c }} />}
            </div>
            <div>
              <div style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.55rem' : '0.6rem', color: theme.text }}>
                {cfg.label}
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: theme.display,
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 700,
            color: c
          }}>
            {value}%
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <style>{`
            .rb-slider-${bucket}::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: ${isMobile ? 14 : 16}px;
              height: ${isMobile ? 14 : 16}px;
              border-radius: 50%;
              background: ${c};
              border: 2px solid ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'};
              box-shadow: 0 0 8px ${c}80;
              cursor: pointer;
              transition: transform 0.15s;
            }
            .rb-slider-${bucket}::-webkit-slider-thumb:hover {
              transform: scale(1.1);
            }
            .rb-slider-${bucket} {
              -webkit-appearance: none;
              width: 100%;
              height: ${isMobile ? 3 : 4}px;
              border-radius: 999px;
              outline: none;
              cursor: pointer;
              background: linear-gradient(
                to right,
                ${c} 0%,
                ${c} ${value}%,
                ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'} ${value}%,
                ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'} 100%
              );
            }
          `}</style>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className={`rb-slider-${bucket}`}
          />
        </div>
      </div>

      {!isMobile && (
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={e => onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
          style={{
            width: 48,
            padding: '4px 6px',
            ...makeGlass(isDark, 0.06, 10),
            border: `1px solid ${c}40`,
            borderRadius: 6,
            color: theme.text,
            fontFamily: theme.mono,
            fontSize: '0.7rem',
            textAlign: 'center',
            outline: 'none',
          }}
        />
      )}
    </div>
  )
}

// ── Setup overlay ──────────────────────────────────────────────────────────
function SetupOverlay({ activeBuckets, existingTargets, onSave, onClose, isSaving, saveError, isDark, theme }) {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth <= 768
  
  const [draft, setDraft] = useState(() => {
    if (Object.keys(existingTargets).length > 0) return { ...existingTargets }
    const equal = Math.floor(100 / activeBuckets.length)
    const remainder = 100 - equal * activeBuckets.length
    const t = {}
    activeBuckets.forEach((b, i) => { t[b] = equal + (i === 0 ? remainder : 0) })
    return t
  })

  const { valid, sum } = validateTargets(draft)
  const remaining = 100 - sum

  const set = (bucket, val) => setDraft(d => ({ ...d, [bucket]: val }))

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
      <div style={{
        ...makeGlass(isDark, 0.12, 24),
        border: `1px solid ${theme.borderHi}`,
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        width: '100%',
        maxWidth: isMobile ? '100%' : 480,
        maxHeight: isMobile ? '80vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: isMobile ? 'slideUp 0.2s ease-out' : 'none',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings2 size={isMobile ? 14 : 16} style={{ color: theme.accent }} />
            <span style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.6rem' : '0.65rem', color: theme.accent }}>
              Set Targets
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={isMobile ? 12 : 14} />
          </button>
        </div>

        {/* Sum indicator */}
        <div style={{
          padding: isMobile ? '8px 20px' : '10px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: theme.mono, fontSize: isMobile ? '0.5rem' : '0.55rem', color: theme.muted }}>
            Total: {sum.toFixed(0)}%
          </span>
          {!valid && remaining !== 0 && (
            <span style={{
              fontFamily: theme.mono,
              fontSize: isMobile ? '0.45rem' : '0.5rem',
              color: remaining > 0 ? theme.yellow : theme.red,
              padding: '2px 6px',
              background: `${remaining > 0 ? theme.yellow : theme.red}10`,
              borderRadius: 4,
            }}>
              {remaining > 0 ? `${remaining}% left` : `${Math.abs(remaining)}% over`}
            </span>
          )}
        </div>

        {/* Sliders */}
        <div style={{
          overflowY: 'auto',
          padding: isMobile ? '16px 20px' : '20px 24px',
          flex: 1,
        }}>
          {activeBuckets.map(bucket => (
            <SliderRow
              key={bucket}
              bucket={bucket}
              value={draft[bucket] ?? 0}
              onChange={val => set(bucket, val)}
              isDark={isDark}
              theme={theme}
              isMobile={isMobile}
            />
          ))}

          {!valid && remaining > 0 && (
            <button
              onClick={() => {
                const largest = activeBuckets.reduce((a, b) =>
                  (draft[a] ?? 0) < (draft[b] ?? 0) ? a : b
                )
                set(largest, (draft[largest] ?? 0) + remaining)
              }}
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                ...makeGlass(isDark, 0.05, 10),
                border: `1px solid ${theme.yellow}40`,
                borderRadius: 8,
                color: theme.yellow,
                fontFamily: theme.mono,
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <PlusCircle size={isMobile ? 12 : 14} />
              Auto-fill remaining {remaining}%
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderTop: `1px solid ${theme.border}`,
        }}>
          {saveError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: theme.red,
              fontSize: isMobile ? '0.5rem' : '0.55rem',
              marginBottom: 10,
              fontFamily: theme.mono,
            }}>
              <AlertTriangle size={isMobile ? 12 : 14} />
              {saveError.message}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={() => onSave(draft)}
              disabled={!valid || isSaving}
              style={{
                flex: 1,
                padding: isMobile ? '10px' : '12px',
                ...makeGlass(isDark, 0.08, 12),
                border: `1px solid ${valid ? theme.accent : theme.border}`,
                borderRadius: 8,
                color: valid ? theme.accent : theme.muted,
                fontFamily: theme.mono,
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                cursor: valid ? 'pointer' : 'not-allowed',
                opacity: isSaving ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {isSaving ? (
                <><RefreshCw size={isMobile ? 12 : 14} style={{ animation: 'spin 1s linear infinite' }} /> Saving</>
              ) : (
                <><Check size={isMobile ? 12 : 14} /> Save</>
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: isMobile ? '10px' : '12px 20px',
                ...makeGlass(isDark, 0.04, 10),
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.muted,
                fontFamily: theme.mono,
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── New Money Panel ────────────────────────────────────────────────────────
function NewMoneyPanel({ currentAllocation, targets, theme, isDark }) {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth <= 768
  const [amount, setAmount] = useState('')
  const parsed = parseFloat(amount) || 0

  const rows = useMemo(() => {
    if (parsed <= 0) return []
    return computeNewMoneyAllocation(currentAllocation, targets, parsed)
  }, [currentAllocation, targets, parsed])

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: theme.mono,
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          color: theme.muted,
          marginBottom: 6
        }}>
          Amount to invest
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: isMobile ? '0.7rem' : '0.8rem',
            color: theme.muted,
          }}>₹</span>
          <input
            type="number"
            min={0}
            placeholder={isMobile ? "50k" : "50,000"}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 10px 8px 22px' : '10px 12px 10px 24px',
              ...makeGlass(isDark, 0.06, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              color: theme.text,
              fontFamily: theme.mono,
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {parsed > 0 && rows.length === 0 && (
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: theme.green,
          padding: '8px 0',
          fontFamily: theme.mono,
        }}>
          ✅ Already at target
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map(r => {
            const cfg = REBALANCE_BUCKETS[r.bucket]
            const Icon = BUCKET_ICONS[r.bucket]
            if (!cfg) return null
            
            return (
              <div key={r.bucket} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '8px' : '10px',
                ...makeGlass(isDark, 0.05, 8),
                border: `1px solid ${cfg.color}30`,
                borderRadius: 8,
              }}>
                <div style={{
                  width: isMobile ? 20 : 24,
                  height: isMobile ? 20 : 24,
                  borderRadius: 6,
                  background: `${cfg.color}18`,
                  border: `1px solid ${cfg.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {Icon && <Icon size={isMobile ? 10 : 12} style={{ color: cfg.color }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: theme.mono,
                    fontSize: isMobile ? '0.55rem' : '0.6rem',
                    color: theme.text
                  }}>
                    {cfg.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: theme.display,
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: 700,
                    color: theme.green
                  }}>
                    +{inrCompact(r.allocate)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Full Rebalance Panel ───────────────────────────────────────────────────
function FullRebalancePanel({ currentAllocation, targets, theme, isDark }) {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth <= 768
  
  const { sells, buys, netCash } = useMemo(
    () => computeFullRebalance(currentAllocation, targets),
    [currentAllocation, targets]
  )

  if (sells.length === 0 && buys.length === 0) return (
    <div style={{
      fontSize: isMobile ? '0.55rem' : '0.6rem',
      color: theme.green,
      padding: '8px 0',
      fontFamily: theme.mono,
    }}>
      ✅ Already at target
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sells.length > 0 && (
        <div>
          <div style={{
            fontFamily: theme.mono,
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            color: theme.red,
            marginBottom: 6,
          }}>
            Sell
          </div>
          {sells.map(r => {
            const cfg = REBALANCE_BUCKETS[r.bucket]
            const Icon = BUCKET_ICONS[r.bucket]
            if (!cfg) return null
            
            return (
              <div key={r.bucket} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '6px 8px' : '8px 10px',
                ...makeGlass(isDark, 0.05, 8),
                border: `1px solid ${theme.red}25`,
                borderRadius: 6,
                marginBottom: 4,
              }}>
                <div style={{
                  width: isMobile ? 18 : 20,
                  height: isMobile ? 18 : 20,
                  borderRadius: 4,
                  background: `${cfg.color}15`,
                  border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon && <Icon size={isMobile ? 8 : 10} style={{ color: cfg.color }} />}
                </div>
                <span style={{
                  flex: 1,
                  fontFamily: theme.mono,
                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                  color: theme.text
                }}>
                  {cfg.label}
                </span>
                <span style={{
                  fontFamily: theme.display,
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: 600,
                  color: theme.red
                }}>
                  -{inrCompact(r.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {sells.length > 0 && buys.length > 0 && (
        <div style={{
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: isMobile ? '0.45rem' : '0.5rem',
          color: theme.muted,
          padding: '2px 0',
        }}>
          {inrCompact(netCash)} freed
        </div>
      )}

      {buys.length > 0 && (
        <div>
          <div style={{
            fontFamily: theme.mono,
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            color: theme.green,
            marginBottom: 6,
          }}>
            Buy
          </div>
          {buys.map(r => {
            const cfg = REBALANCE_BUCKETS[r.bucket]
            const Icon = BUCKET_ICONS[r.bucket]
            if (!cfg) return null
            
            return (
              <div key={r.bucket} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '6px 8px' : '8px 10px',
                ...makeGlass(isDark, 0.05, 8),
                border: `1px solid ${theme.green}25`,
                borderRadius: 6,
                marginBottom: 4,
              }}>
                <div style={{
                  width: isMobile ? 18 : 20,
                  height: isMobile ? 18 : 20,
                  borderRadius: 4,
                  background: `${cfg.color}15`,
                  border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon && <Icon size={isMobile ? 8 : 10} style={{ color: cfg.color }} />}
                </div>
                <span style={{
                  flex: 1,
                  fontFamily: theme.mono,
                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                  color: theme.text
                }}>
                  {cfg.label}
                </span>
                <span style={{
                  fontFamily: theme.display,
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: 600,
                  color: theme.green
                }}>
                  +{inrCompact(r.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Widget ────────────────────────────────────────────────────────────
export default function RebalanceWidget() {
  const { theme, isDark } = useTheme()
  const { userId } = useFinance()
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolioData(userId)
  const { targets, isConfigured, isLoading: targetsLoading, saveTargets, isSaving, saveError } = useRebalance(userId)

  const windowWidth = useWindowWidth()
  const isMobile = windowWidth <= 768

  const [showSetup, setShowSetup] = useState(false)
  const [activeMode, setActiveMode] = useState('table')

  // Build current allocation
  const { currentAllocation, activeBuckets } = useMemo(() => {
    if (!portfolioData?.holdings) {
      return { currentAllocation: { byBucket: {}, total: 0, buckets: [] }, activeBuckets: [] }
    }

    const holdings = portfolioData.holdings.map(h => {
      const livePrice = portfolioData.quotesMap?.[h.ticker]?.price
      const usdInrRate = portfolioData.usdInrRate ?? 87.5
      const isUSD = h.asset_class === 'us_equity' || ['NYSE', 'NASDAQ', 'PCX'].includes(h.exchange) || h.currency === 'USD'
      const priceINR = livePrice ?? (isUSD ? h.avg_cost * usdInrRate : h.avg_cost)
      return { ...h, currentValueINR: h.quantity * priceINR }
    })

    const alloc = computeCurrentAllocation(holdings)
    return { currentAllocation: alloc, activeBuckets: alloc.buckets }
  }, [portfolioData])

  // Rebalance plan
  const plan = useMemo(() => {
    if (!isConfigured || !currentAllocation.total) return []
    return computeRebalancePlan(currentAllocation, targets)
  }, [currentAllocation, targets, isConfigured])

  const handleSave = async (draft) => {
    await saveTargets(draft)
    setShowSetup(false)
  }

  // Loading state
  if (portfolioLoading || targetsLoading) {
    return (
      <div style={{
        ...makeGlass(isDark, 0.04, 16),
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: isMobile ? 16 : 20,
        height: isMobile ? 120 : 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          animation: 'pulse 1.5s infinite',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          borderRadius: 8,
        }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }`}</style>
      </div>
    )
  }

  // Not configured
  if (!isConfigured) {
    return (
      <>
        <div style={{
          ...makeGlass(isDark, 0.04, 16),
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: isMobile ? 16 : 20,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 12 : 16,
        }}>
          <div>
            <div style={{
              fontFamily: theme.mono,
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: theme.accent,
              marginBottom: 4,
            }}>
              Rebalancing
            </div>
            <div style={{
              fontFamily: theme.display,
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: 600,
              color: theme.text,
              marginBottom: 4,
            }}>
              Set Your Targets
            </div>
            <div style={{
              fontFamily: theme.mono,
              fontSize: isMobile ? '0.5rem' : '0.55rem',
              color: theme.muted,
            }}>
              Define your target allocation
            </div>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: isMobile ? '8px 12px' : '10px 16px',
              ...makeGlass(isDark, 0.06, 10),
              border: `1px solid ${theme.accent}50`,
              borderRadius: 8,
              color: theme.accent,
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              fontFamily: theme.mono,
              cursor: 'pointer',
            }}
          >
            <Settings2 size={isMobile ? 12 : 14} />
            Set Targets
          </button>
        </div>

        {showSetup && (
          <SetupOverlay
            activeBuckets={activeBuckets}
            existingTargets={targets}
            onSave={handleSave}
            onClose={() => setShowSetup(false)}
            isSaving={isSaving}
            saveError={saveError}
            isDark={isDark}
            theme={theme}
          />
        )}
      </>
    )
  }

  // Configured
  const maxDrift = plan.length ? Math.max(...plan.map(r => Math.abs(r.driftPct))) : 0
  const needsRebalance = maxDrift >= 3

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{
        ...makeGlass(isDark, 0.04, 16),
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '16px 20px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: theme.mono,
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: theme.accent,
            }}>
              Rebalancing
            </span>
            {needsRebalance && (
              <span style={{
                fontSize: isMobile ? '0.45rem' : '0.5rem',
                padding: '2px 6px',
                background: `${theme.red}15`,
                border: `1px solid ${theme.red}30`,
                borderRadius: 12,
                color: theme.red,
                fontFamily: theme.mono,
              }}>
                Action
              </span>
            )}
          </div>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              padding: '4px 8px',
              ...makeGlass(isDark, 0.05, 8),
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              color: theme.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Settings2 size={isMobile ? 10 : 12} />
            <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontFamily: theme.mono }}>Edit</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 2,
          padding: isMobile ? '8px 16px 0' : '10px 20px 0',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          {[
            { id: 'table', label: 'Overview' },
            { id: 'new_money', label: 'New Money' },
            { id: 'full', label: 'Full' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id)}
              style={{
                padding: isMobile ? '4px 10px' : '6px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeMode === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: activeMode === tab.id ? theme.accent : theme.muted,
                fontFamily: theme.mono,
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 20px' }}>
          {activeMode === 'table' && (
            isMobile ? (
              <MobilePlanCard plan={plan} theme={theme} isDark={isDark} />
            ) : (
              <DesktopTableView 
                plan={plan} 
                currentAllocation={currentAllocation} 
                theme={theme} 
                isDark={isDark} 
              />
            )
          )}

          {activeMode === 'new_money' && (
            <NewMoneyPanel
              currentAllocation={currentAllocation}
              targets={targets}
              theme={theme}
              isDark={isDark}
            />
          )}

          {activeMode === 'full' && (
            <FullRebalancePanel
              currentAllocation={currentAllocation}
              targets={targets}
              theme={theme}
              isDark={isDark}
            />
          )}
        </div>
      </div>

      {/* Setup overlay */}
      {showSetup && (
        <SetupOverlay
          activeBuckets={activeBuckets}
          existingTargets={targets}
          onSave={handleSave}
          onClose={() => setShowSetup(false)}
          isSaving={isSaving}
          saveError={saveError}
          isDark={isDark}
          theme={theme}
        />
      )}
    </>
  )
}