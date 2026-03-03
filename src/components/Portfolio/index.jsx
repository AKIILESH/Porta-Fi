import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import { useHoldings } from '../../hooks/useHoldings'
import { useTrades } from '../../hooks/useTrades'
import { useAddTrade } from '../../hooks/useTrades'
import { useDeleteHolding } from '../../hooks/useHoldings'
import { Card, Btn, Input, Select, Badge, KpiCard, EmptyState, Spinner } from '../shared/ui.jsx'
import { inr, inrCompact, pct, gainColor, todayISO } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Search } from 'lucide-react'

// ── Gold Tokens ───────────────────────────────────────────────────────────────
const G = {
  ink:        '#09090e',
  surface:    '#0f0e0a',
  card:       '#131109',
  cardHover:  '#181610',
  border:     'rgba(201,168,76,0.16)',
  borderHi:   'rgba(201,168,76,0.36)',
  gold:       '#c9a84c',
  goldLight:  '#e8c96b',
  goldDim:    'rgba(201,168,76,0.10)',
  goldGlow:   'rgba(201,168,76,0.05)',
  text:       '#f0ebe0',
  muted:      '#6e6558',
  green:      '#5cb87a',
  red:        '#d96b6b',
  mono:       "'DM Mono','Courier New',monospace",
  display:    "'Cormorant Garamond',Georgia,serif",
  sans:       "'DM Sans',system-ui,sans-serif",
}

// ── Asset class config ────────────────────────────────────────────────────────
export const ASSET_CLASSES = [
  { value: 'equity',      label: 'Equity',        exchange: 'NSE',   color: '#5cb87a' },
  { value: 'us_equity',   label: 'US Equity',     exchange: 'NYSE',  color: '#4f8eff' },
  { value: 'etf',         label: 'ETF',           exchange: 'NSE',   color: '#e8c96b' },
  { value: 'index_fund',  label: 'Index Fund',    exchange: 'AMFI',  color: '#a8d8b9' },
  { value: 'elss',        label: 'ELSS',          exchange: 'AMFI',  color: '#9b5cff' },
  { value: 'mutual_fund', label: 'Mutual Fund',   exchange: 'AMFI',  color: '#c9a84c' },
  { value: 'debt_fund',   label: 'Debt Fund',     exchange: 'AMFI',  color: '#54a0ff' },
  { value: 'liquid_fund', label: 'Liquid Fund',   exchange: 'AMFI',  color: '#48dbfb' },
  { value: 'hybrid_fund', label: 'Hybrid Fund',   exchange: 'AMFI',  color: '#e17055' },
  { value: 'gold',        label: 'Gold',          exchange: 'NSE',   color: '#f5c400' },
  { value: 'silver',      label: 'Silver',        exchange: 'NSE',   color: '#b2bec3' },
  { value: 'reit',        label: 'REIT',          exchange: 'NSE',   color: '#fd79a8' },
  { value: 'invit',       label: 'InvIT',         exchange: 'NSE',   color: '#e17055' },
  { value: 'crypto',      label: 'Crypto',        exchange: 'OTHER', color: '#6c5ce7' },
  { value: 'other',       label: 'Other',         exchange: 'OTHER', color: '#6e6558' },
]

const SUB_CATEGORIES = {
  equity:      ['large_cap','mid_cap','small_cap','micro_cap'],
  us_equity:   ['large_cap','mid_cap','small_cap','growth','value'],
  etf:         ['index','sectoral','gold','silver','debt','international'],
  mutual_fund: ['large_cap','mid_cap','small_cap','flexi_cap','value','contra','dividend_yield','focused','sectoral'],
  elss:        ['large_cap','flexi_cap','mid_cap'],
  index_fund:  ['nifty_50','nifty_next_50','sensex','midcap','smallcap','international'],
  debt_fund:   ['gilt','corporate_bond','credit_risk','short_duration','ultra_short','dynamic_bond','fmp'],
  liquid_fund: ['liquid','overnight','money_market'],
  hybrid_fund: ['aggressive','conservative','balanced','dynamic_asset_allocation','multi_asset'],
  gold:        ['physical','sgb','gold_etf','gold_fund_of_fund'],
  silver:      ['physical','silver_etf'],
}

const CATEGORY_GROUPS = [
  { key: 'equity',      label: 'Equity',       color: '#5cb87a', includes: ['equity','us_equity'] },
  { key: 'mutual_fund', label: 'Mutual Funds', color: '#c9a84c', includes: ['mutual_fund','index_fund','elss','etf'] },
  { key: 'debt',        label: 'Debt',         color: '#54a0ff', includes: ['debt_fund','liquid_fund','hybrid_fund'] },
  { key: 'commodity',   label: 'Commodity',    color: '#f5c400', includes: ['gold','silver'] },
  { key: 'other',       label: 'Other',        color: '#6e6558', includes: ['reit','invit','crypto','other'] },
]

const assetColor = k => ASSET_CLASSES.find(a => a.value === k)?.color || G.muted
const assetLabel = k => ASSET_CLASSES.find(a => a.value === k)?.label || k

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function PortfolioSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: G.sans }}>
      {/* KPI skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, padding: '22px 24px', height: 120 }} />
        ))}
      </div>
      
      {/* Chart skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1,2].map(i => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px', height: 280 }} />
        ))}
      </div>
      
      {/* Table skeleton */}
      <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px', height: 400 }} />
    </div>
  )
}

// ── Shared label style ────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <div style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: G.muted, marginBottom: 5 }}>
    {children}
  </div>
)

// ── Section heading ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{ width: 18, height: 1, background: G.gold, display: 'inline-block' }} />
    <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: G.gold }}>
      {children}
    </span>
  </div>
)

// ── Custom Tooltips ───────────────────────────────────────────────────────────
const GoldTooltip = ({ active, payload, allData }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const total = allData?.reduce((s, i) => s + i.value, 0) || 0
  const p = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  return (
    <div style={{ background: G.card, border: `1px solid ${G.borderHi}`, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted, letterSpacing: '0.1em', marginBottom: 4 }}>{d.name}</div>
      <div style={{ fontFamily: G.display, fontSize: '1.1rem', color: G.goldLight }}>{inr(d.value)}</div>
      <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: G.muted, marginTop: 2 }}>{p}% of portfolio</div>
      {d.changePct != null && (
        <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: d.changePct >= 0 ? G.green : G.red, marginTop: 2 }}>
          {d.changePct >= 0 ? '▲' : '▼'} {pct(d.changePct)} today
        </div>
      )}
    </div>
  )
}

// ── Trade Form ────────────────────────────────────────────────────────────────
function TradeForm({ mode, onDone, prefilledHolding }) {
  const { userId } = useFinance()
  const addTrade = useAddTrade(userId)
  const { data: holdings = [] } = useHoldings(userId)
  
  const isB = mode === 'buy'
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch]       = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)

  const [form, setForm] = useState({
    ticker:       prefilledHolding?.ticker || '',
    name:         prefilledHolding?.name || '',
    exchange:     prefilledHolding?.exchange || 'NSE',
    asset_class:  prefilledHolding?.asset_class || 'equity',
    sub_category: prefilledHolding?.sub_category || '',
    trade_date:   todayISO(),
    trade_type:   isB ? 'buy' : 'sell',
    quantity:     '',
    price:        '',
    brokerage:    '',
    stt:          '',
    gst:          '',
    notes:        '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  useEffect(() => {
    const fn = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    const search = async () => {
      if (!form.name || form.name.length < 2) { setSearchResults([]); return }
      setSearchLoading(true)
      try {
        const { data } = await supabase.from('instruments').select('*')
          .or(`name.ilike.%${form.name}%,symbol.ilike.%${form.name}%`).limit(10)
        setSearchResults(data || [])
        setShowSearch(true)
      } catch {}
      finally { setSearchLoading(false) }
    }
    const t = setTimeout(search, 300)
    return () => clearTimeout(t)
  }, [form.name])

  const selectInstrument = ins => {
    setForm(f => ({ ...f, ticker: ins.symbol, name: ins.name, exchange: ins.exchange, asset_class: ins.asset_class, sub_category: ins.sub_category || '' }))
    setShowSearch(false)
  }

  const set = k => v => setForm(f => {
    const u = { ...f, [k]: v }
    if (k === 'asset_class') { u.exchange = ASSET_CLASSES.find(a => a.value === v)?.exchange || 'NSE'; u.sub_category = '' }
    return u
  })

  const holding = holdings.find(h => h.ticker === form.ticker.toUpperCase() && h.exchange === form.exchange)
  const maxSell = holding?.quantity || 0

  const submit = async () => {
    if (!form.ticker || !form.quantity || !form.price) { setErr('Ticker, quantity and price are required'); return }
    if (!isB && Number(form.quantity) > maxSell) { setErr(`You only hold ${maxSell} units of ${form.ticker}`); return }
    
    setSaving(true)
    setErr('')
    
    try {
      await addTrade.mutateAsync({
        ticker: form.ticker,
        name: form.name || form.ticker,
        exchange: form.exchange,
        asset_class: form.asset_class,
        sub_category: form.sub_category || null,
        trade_date: form.trade_date,
        trade_type: form.trade_type,
        quantity: Number(form.quantity),
        price: Number(form.price),
        brokerage: Number(form.brokerage) || 0,
        stt: Number(form.stt) || 0,
        gst: Number(form.gst) || 0,
        notes: form.notes || null,
      })
      onDone()
    } catch (e) { 
      setErr(e.message) 
    } finally { 
      setSaving(false) 
    }
  }

  const inputBase = {
    background: G.surface,
    border: `1px solid ${G.border}`,
    color: G.text,
    fontFamily: G.mono,
    fontSize: '0.75rem',
    padding: '9px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const readonlyStyle = { ...inputBase, background: G.ink, color: G.muted, cursor: 'not-allowed', opacity: 0.7 }

  return (
    <div style={{
      background: G.surface,
      border: `1px solid ${isB ? 'rgba(92,184,122,0.3)' : 'rgba(217,107,107,0.3)'}`,
      borderLeft: `2px solid ${isB ? G.green : G.red}`,
      padding: '24px',
      marginBottom: 20,
      position: 'relative',
    }}>
      {/* top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${isB ? G.green : G.red}60, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: isB ? G.green : G.red }}>
          {isB ? '▲ Record Buy / SIP' : '▼ Record Sell / Switch Out'}
        </span>
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Search */}
        <div style={{ gridColumn: 'span 2', position: 'relative' }} ref={searchRef}>
          <FieldLabel>Search Instrument</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input
              value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Search by name or symbol…"
              style={{
                ...inputBase,
                paddingLeft: 36,
                borderColor: showSearch ? G.gold : G.border,
                boxShadow: showSearch ? `0 0 0 1px ${G.goldDim}` : 'none',
              }}
              onFocus={e => e.target.style.borderColor = G.gold}
              onBlur={e => e.target.style.borderColor = G.border}
            />
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: showSearch ? G.gold : G.muted, pointerEvents: 'none' }} />
          </div>
          {showSearch && (searchResults.length > 0 || searchLoading) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: G.card, border: `1px solid ${G.borderHi}`, maxHeight: 260, overflowY: 'auto', zIndex: 1000, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
              {searchLoading
                ? <div style={{ padding: 16, textAlign: 'center' }}><Spinner size={14} /></div>
                : searchResults.map(ins => (
                  <button key={ins.id} onClick={() => selectInstrument(ins)} style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', borderBottom: `1px solid ${G.border}`, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = G.goldGlow}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontFamily: G.sans, fontSize: '0.83rem', color: G.text, marginBottom: 3 }}>{ins.name}</div>
                    <div style={{ display: 'flex', gap: 10, fontFamily: G.mono, fontSize: '0.58rem', color: G.muted }}>
                      <span style={{ color: G.gold }}>{ins.symbol}</span>
                      <span>·</span><span>{ins.exchange}</span>
                      <span>·</span><span>{assetLabel(ins.asset_class)}</span>
                      {ins.sector && <><span>·</span><span>{ins.sector}</span></>}
                    </div>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Ticker / Symbol</FieldLabel>
          <input value={form.ticker} onChange={() => {}} readOnly style={{ ...readonlyStyle, textTransform: 'uppercase' }} placeholder="Auto-filled" />
        </div>
        <div>
          <FieldLabel>Asset Class</FieldLabel>
          <input value={assetLabel(form.asset_class)} onChange={() => {}} readOnly style={readonlyStyle} />
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <FieldLabel>Sub-Category</FieldLabel>
          <input value={form.sub_category ? form.sub_category.replace(/_/g, ' ') : '—'} onChange={() => {}} readOnly style={readonlyStyle} />
        </div>
        <div>
          <FieldLabel>Exchange</FieldLabel>
          <input value={form.exchange} onChange={() => {}} readOnly style={readonlyStyle} />
        </div>
        <div>
          <FieldLabel>Trade Type</FieldLabel>
          <Select value={form.trade_type} onChange={set('trade_type')}>
            {isB
              ? [['buy','Buy'],['sip','SIP'],['switch_in','Switch In'],['dividend_reinvest','Div Reinvest']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
              : [['sell','Sell'],['switch_out','Switch Out']].map(([v,l]) => <option key={v} value={v}>{l}</option>)
            }
          </Select>
        </div>
        <div>
          <FieldLabel>Date</FieldLabel>
          <input value={form.trade_date} onChange={e => set('trade_date')(e.target.value)} type="date" style={inputBase} />
        </div>
      </div>

      {/* Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <FieldLabel>{!isB ? `Quantity (max: ${maxSell})` : 'Quantity / Units'}</FieldLabel>
          <input value={form.quantity} onChange={e => set('quantity')(e.target.value)} placeholder="0" type="number" min="0" step="0.0001" style={inputBase}
            onFocus={e => e.target.style.borderColor = G.gold}
            onBlur={e => e.target.style.borderColor = G.border}
          />
        </div>
        <div>
          <FieldLabel>Price / NAV (₹)</FieldLabel>
          <input value={form.price} onChange={e => set('price')(e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={inputBase}
            onFocus={e => e.target.style.borderColor = G.gold}
            onBlur={e => e.target.style.borderColor = G.border}
          />
        </div>
      </div>

      {/* Calc summary */}
      {form.quantity && form.price && (
        <div style={{ background: G.ink, border: `1px solid ${G.border}`, borderLeft: `2px solid ${G.gold}`, padding: '10px 16px', marginBottom: 14, display: 'flex', gap: 28 }}>
          <span style={{ fontFamily: G.mono, fontSize: '0.65rem', color: G.muted }}>
            Total <strong style={{ color: G.goldLight, fontFamily: G.display, fontSize: '1rem' }}>{inr(Number(form.quantity) * Number(form.price))}</strong>
          </span>
          {!isB && holding && (
            <span style={{ fontFamily: G.mono, fontSize: '0.65rem', color: G.muted }}>
              Avg cost <strong style={{ color: G.text }}>{inr(holding.avg_cost)}</strong>
              {'  '}Est P&L <strong style={{ color: Number(form.price) >= holding.avg_cost ? G.green : G.red }}>{inr((Number(form.price) - holding.avg_cost) * Number(form.quantity))}</strong>
            </span>
          )}
        </div>
      )}

      {err && <div style={{ color: G.red, fontFamily: G.mono, fontSize: '0.62rem', marginBottom: 10, letterSpacing: '0.08em' }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={submit} disabled={saving || addTrade.isPending} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isB ? G.green : G.red, color: G.ink,
          border: 'none', padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: G.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          opacity: saving ? 0.6 : 1, transition: 'opacity 0.2s',
        }}>
          {saving ? <Spinner size={12} /> : isB ? '▲ Confirm Buy' : '▼ Confirm Sell'}
        </button>
        <button onClick={onDone} style={{
          background: 'transparent', border: `1px solid ${G.border}`, color: G.muted,
          padding: '10px 20px', cursor: 'pointer', fontFamily: G.mono,
          fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          transition: 'border-color 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Holdings Table ────────────────────────────────────────────────────────────
function HoldingsTable({ onSell }) {
  const { userId } = useFinance()
  const { data: holdings = [], isLoading: holdingsLoading } = useHoldings(userId)
  const deleteHolding = useDeleteHolding(userId)
const { data: portfolioData } = usePortfolioData(userId)
  const quotesMap = portfolioData?.quotesMap || {}

  const [filterClass, setFilterClass] = useState('all')
  const [showDropdown, setShowDropdown] = useState(false)
  const [rowHoverStates, setRowHoverStates] = useState({})
  const dropdownRef = useRef(null)

  useEffect(() => {
    const fn = e => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const allClasses = [{ value: 'all', label: 'All Classes', color: G.text }, ...ASSET_CLASSES]
  const filtered   = holdings.filter(h => h.quantity > 0 && (filterClass === 'all' || h.asset_class === filterClass))
  const selected   = allClasses.find(c => c.value === filterClass)

  // Handle row hover
  const handleMouseEnter = (id) => {
    setRowHoverStates(prev => ({ ...prev, [id]: true }))
  }
  
  const handleMouseLeave = (id) => {
    setRowHoverStates(prev => ({ ...prev, [id]: false }))
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holding?')) {
      try {
        await deleteHolding.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting holding:', error)
      }
    }
  }

  if (holdingsLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><Spinner /></div>
  }

  if (!holdings.filter(h => h.quantity > 0).length) {
    return <EmptyState icon="◎" message="No open positions. Record your first buy above." />
  }

  const colGrid = '1.8fr 1.1fr 0.7fr 1fr 1fr 1fr 1.2fr 0.7fr 76px'
  const headers = ['Instrument', 'Type', 'Units', 'Avg Cost', 'Live Price', 'Value', 'Unrealised P&L', 'Today', '']

  return (
    <div>
      {/* Filter dropdown */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, position: 'relative' }} ref={dropdownRef}>
        <button onClick={() => setShowDropdown(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: G.surface, border: `1px solid ${showDropdown ? G.borderHi : G.border}`,
          padding: '7px 14px', cursor: 'pointer', fontFamily: G.mono,
          fontSize: '0.62rem', color: G.text, letterSpacing: '0.1em',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected?.color || G.gold, display: 'inline-block' }} />
          {selected?.label || 'Filter'}
          <span style={{ fontSize: '0.5rem', color: G.muted }}>▼</span>
        </button>
        {showDropdown && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: G.card, border: `1px solid ${G.borderHi}`, width: 220, zIndex: 1000, maxHeight: 300, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            {allClasses.map(cls => (
              <button key={cls.value} onClick={() => { setFilterClass(cls.value); setShowDropdown(false) }}
                style={{ width: '100%', padding: '9px 14px', background: filterClass === cls.value ? G.goldDim : 'transparent', border: 'none', borderBottom: `1px solid ${G.border}`, color: filterClass === cls.value ? G.gold : G.text, fontSize: '0.62rem', fontFamily: G.mono, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (filterClass !== cls.value) e.currentTarget.style.background = G.goldGlow }}
                onMouseLeave={e => { if (filterClass !== cls.value) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cls.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{cls.label}</span>
                {filterClass === cls.value && <span style={{ color: G.gold, fontSize: '0.55rem' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: colGrid, gap: 8, padding: '6px 12px', borderBottom: `1px solid ${G.border}`, marginBottom: 2 }}>
        {headers.map(h => (
          <div key={h} style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: G.muted }}>{h}</div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>
          No holdings for this asset class
        </div>
      )}

      {filtered.map((h, i) => {
        const q = portfolioData?.quotesMap?.[h.ticker]
        const price = q?.price ?? h.avg_cost
        const value = price * h.quantity
        const cost = h.avg_cost * h.quantity
        const gain = value - cost
        const gainP = cost > 0 ? (gain / cost) * 100 : 0
        const ac = ASSET_CLASSES.find(a => a.value === h.asset_class)
        const isHovered = rowHoverStates[h.id] || false

        return (
          <div key={h.id}
            onMouseEnter={() => handleMouseEnter(h.id)}
            onMouseLeave={() => handleMouseLeave(h.id)}
            style={{ display: 'grid', gridTemplateColumns: colGrid, gap: 8, padding: '12px 12px', borderBottom: i < filtered.length - 1 ? `1px solid ${G.border}` : 'none', alignItems: 'center', background: isHovered ? G.goldGlow : 'transparent', transition: 'background 0.2s' }}
          >
            <div>
              <div style={{ fontFamily: G.sans, fontWeight: 500, fontSize: '0.85rem', color: G.text }}>{h.name}</div>
              <div style={{ fontFamily: G.mono, fontSize: '0.57rem', color: G.gold, letterSpacing: '0.08em', marginTop: 2 }}>{h.ticker}</div>
            </div>
            <div>
              <span style={{ fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.08em', background: `${ac?.color || G.muted}18`, color: ac?.color || G.muted, padding: '3px 8px', border: `1px solid ${ac?.color || G.muted}30` }}>
                {ac?.label?.split(' ')[0] || h.asset_class}
              </span>
              {h.sub_category && <div style={{ fontFamily: G.mono, fontSize: '0.52rem', color: G.muted, marginTop: 3 }}>{h.sub_category.replace(/_/g,' ')}</div>}
            </div>
            <div style={{ fontFamily: G.mono, fontSize: '0.75rem', color: G.text }}>{Number(h.quantity).toFixed(4)}</div>
            <div style={{ fontFamily: G.mono, fontSize: '0.75rem', color: G.text }}>{inr(h.avg_cost)}</div>
            <div style={{ fontFamily: G.mono, fontSize: '0.75rem', color: q ? G.text : G.muted }}>
              {q ? inr(q.price) : <span style={{ fontSize: '0.6rem' }}>Cached</span>}
            </div>
            <div style={{ fontFamily: G.display, fontSize: '1rem', color: G.text }}>{inr(value)}</div>
            <div>
              <div style={{ fontFamily: G.display, fontSize: '1rem', color: gain >= 0 ? G.green : G.red }}>{inr(gain)}</div>
              <div style={{ fontFamily: G.mono, fontSize: '0.55rem', color: gain >= 0 ? G.green : G.red, opacity: 0.8 }}>({pct(gainP)})</div>
            </div>
            <div style={{ fontFamily: G.mono, fontSize: '0.65rem', color: q ? (q.changePct >= 0 ? G.green : G.red) : G.muted }}>
              {q ? pct(q.changePct) : '—'}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => onSell(h)} style={{ padding: '5px 10px', background: `${G.red}18`, border: `1px solid ${G.red}40`, color: G.red, fontFamily: G.mono, fontSize: '0.57rem', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${G.red}30`}
                onMouseLeave={e => e.currentTarget.style.background = `${G.red}18`}
              >Sell</button>
              <button onClick={() => handleDelete(h.id)} disabled={deleteHolding.isPending} style={{ padding: '5px 8px', background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, fontFamily: G.mono, fontSize: '0.6rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.red; e.currentTarget.style.color = G.red }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
              >
                {deleteHolding.isPending ? <Spinner size={12} /> : '✕'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Trade History ─────────────────────────────────────────────────────────────
function TradeHistory() {
  const { userId } = useFinance()
  const { data: trades = [], isLoading } = useTrades(userId)
  const [show, setShow] = useState(10)

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}><Spinner /></div>
  }

  if (!trades.length) return <EmptyState icon="◌" message="No trade history yet." />

  const colGrid = '1fr 1.2fr 0.9fr 0.7fr 1fr 1fr 1fr'
  const headers  = ['Date', 'Ticker', 'Type', 'Units', 'Price', 'Total', 'Realised P&L']

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: colGrid, gap: 8, padding: '6px 12px', borderBottom: `1px solid ${G.border}`, marginBottom: 2 }}>
        {headers.map(h => (
          <div key={h} style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: G.muted }}>{h}</div>
        ))}
      </div>

      {trades.slice(0, show).map((t, i) => {
        const isSell = ['sell','switch_out'].includes(t.trade_type)
        const [hov, setHov] = useState(false)
        return (
          <div key={t.id}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{ display: 'grid', gridTemplateColumns: colGrid, gap: 8, padding: '11px 12px', borderBottom: i < Math.min(trades.length, show) - 1 ? `1px solid ${G.border}` : 'none', alignItems: 'center', background: hov ? G.goldGlow : 'transparent', transition: 'background 0.2s' }}
          >
            <div style={{ fontFamily: G.mono, fontSize: '0.65rem', color: G.muted }}>{t.trade_date}</div>
            <div style={{ fontFamily: G.sans, fontWeight: 500, fontSize: '0.82rem', color: G.text }}>{t.ticker}</div>
            <span style={{ fontFamily: G.mono, fontSize: '0.58rem', letterSpacing: '0.08em', background: isSell ? `${G.red}18` : `${G.green}18`, color: isSell ? G.red : G.green, padding: '3px 8px', border: `1px solid ${isSell ? G.red : G.green}30`, width: 'fit-content' }}>
              {t.trade_type}
            </span>
            <div style={{ fontFamily: G.mono, fontSize: '0.7rem', color: G.text }}>{Number(t.quantity).toFixed(3)}</div>
            <div style={{ fontFamily: G.mono, fontSize: '0.7rem', color: G.text }}>{inr(t.price)}</div>
            <div style={{ fontFamily: G.display, fontSize: '0.95rem', color: G.text }}>{inr(t.total_value)}</div>
            <div>
              {t.realised_pnl != null
                ? <><div style={{ fontFamily: G.display, fontSize: '0.95rem', color: t.realised_pnl >= 0 ? G.green : G.red }}>{inr(t.realised_pnl)}</div>
                    {t.is_ltcg != null && <div style={{ fontFamily: G.mono, fontSize: '0.52rem', color: G.muted, marginTop: 2 }}>{t.is_ltcg ? 'LTCG' : 'STCG'}</div>}
                  </>
                : <span style={{ fontFamily: G.mono, fontSize: '0.65rem', color: G.muted }}>—</span>
              }
            </div>
          </div>
        )
      })}

      {trades.length > show && (
        <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
          <button onClick={() => setShow(s => s + 20)} style={{ background: 'transparent', border: `1px solid ${G.border}`, color: G.muted, padding: '8px 20px', fontFamily: G.mono, fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted }}
          >
            Load more · {trades.length - show} remaining
          </button>
        </div>
      )}
    </>
  )
}

// ── Allocation Chart ──────────────────────────────────────────────────────────
function AllocationChart() {
  const { userId } = useFinance()
  const { data: portfolioData } = usePortfolioData(userId)
  
  const byAssetClass = portfolioData?.byAssetClass || {}
  
  const data = Object.entries(byAssetClass)
    .map(([k, v]) => ({ name: assetLabel(k), value: v, color: assetColor(k) }))
    .filter(d => d.value > 0)
    
  if (!data.length) return null
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px' }}>
      <SectionLabel>Asset Allocation</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<GoldTooltip allData={data} />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px 12px', marginTop: 16 }}>
        {data.sort((a,b) => b.value - a.value).map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, background: d.color, flexShrink: 0 }} />
              <span style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.text }}>{d.name}</span>
            </div>
            <span style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.muted }}>{((d.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Holdings Breakdown ────────────────────────────────────────────────────────
function HoldingsBreakdown() {
  const { userId } = useFinance()
  const { data: portfolioData } = usePortfolioData(userId)
  const { data: holdings = [] } = useHoldings(userId)
  
  const [selected, setSelected] = useState('equity')
  const [showDrop, setShowDrop]  = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const cat     = CATEGORY_GROUPS.find(c => c.key === selected)
  const quotesMap = portfolioData?.quotesMap || {}
  
  const catData = holdings
    .filter(h => cat?.includes.includes(h.asset_class) && h.quantity > 0)
    .map(h => {
      const price = quotesMap[h.ticker]?.price || h.avg_cost
      const value = price * h.quantity
      const displayName = (h.name || h.ticker).length > 22 ? (h.name || h.ticker).slice(0, 22) + '…' : (h.name || h.ticker)
      return { 
        name: h.ticker, 
        displayName, 
        fullName: h.name || h.ticker, 
        value, 
        color: assetColor(h.asset_class), 
        changePct: quotesMap[h.ticker]?.changePct 
      }
    })
    .sort((a,b) => b.value - a.value)

  const catTotal = catData.reduce((s, d) => s + d.value, 0)

  if (!holdings.filter(h => h.quantity > 0).length) return null

  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <SectionLabel>Holdings Breakdown</SectionLabel>
        {/* Category selector */}
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button onClick={() => setShowDrop(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: G.surface, border: `1px solid ${showDrop ? G.borderHi : G.border}`, fontFamily: G.mono, fontSize: '0.6rem', color: G.text, cursor: 'pointer', letterSpacing: '0.1em', transition: 'border-color 0.2s' }}>
            <span style={{ width: 6, height: 6, background: cat?.color, display: 'inline-block' }} />
            {cat?.label}
            <span style={{ fontSize: '0.48rem', color: G.muted }}>▼</span>
          </button>
          {showDrop && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: G.card, border: `1px solid ${G.borderHi}`, width: 160, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
              {CATEGORY_GROUPS.map(cg => (
                <button key={cg.key} onClick={() => { setSelected(cg.key); setShowDrop(false) }}
                  style={{ width: '100%', padding: '9px 14px', background: selected === cg.key ? G.goldDim : 'transparent', border: 'none', borderBottom: `1px solid ${G.border}`, color: selected === cg.key ? G.gold : G.text, fontFamily: G.mono, fontSize: '0.6rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (selected !== cg.key) e.currentTarget.style.background = G.goldGlow }}
                  onMouseLeave={e => { if (selected !== cg.key) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: 6, height: 6, background: cg.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{cg.label}</span>
                  {selected === cg.key && <span style={{ fontSize: '0.52rem' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {catData.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: G.mono, fontSize: '0.7rem', color: G.muted }}>
          No holdings in {cat?.label}
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {catData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<GoldTooltip allData={catData} />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: G.display, fontSize: '1.3rem', color: G.text }}>{inrCompact(catTotal)}</div>
              <div style={{ fontFamily: G.mono, fontSize: '0.52rem', color: G.muted, letterSpacing: '0.12em', marginTop: 2 }}>Total</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '6px 10px', marginTop: 16, maxHeight: 140, overflowY: 'auto' }}>
            {catData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: G.surface, border: `1px solid ${G.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                  <div style={{ width: 6, height: 6, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: G.mono, fontSize: '0.6rem', color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.fullName}>{d.displayName}</span>
                </div>
                <span style={{ fontFamily: G.mono, fontSize: '0.58rem', color: G.muted, flexShrink: 0, marginLeft: 6 }}>
                  {catTotal > 0 ? ((d.value / catTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Portfolio Page ────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { userId } = useFinance()
  const { 
    data: portfolioData, 
    isLoading, 
    error,
    refetch 
  } = usePortfolioData(userId)
  
  const [mode, setMode] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [activeTab, setActiveTab] = useState('holdings')

  if (isLoading) {
    return <PortfolioSkeleton />
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: G.card, 
        border: `1px solid ${G.border}`,
        color: G.red,
        fontFamily: G.mono
      }}>
        Error loading portfolio: {error.message}
        <button 
          onClick={() => refetch()}
          style={{
            display: 'block',
            margin: '20px auto 0',
            padding: '8px 20px',
            background: G.gold,
            border: 'none',
            color: G.ink,
            fontFamily: G.mono,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const {
    portfolioValue = 0,
    portfolioCost = 0,
    portfolioGain = 0,
    realisedPnl = 0,
    trades = [],
    quotesMap = {}
  } = portfolioData || {}

  const gainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

  const handleSell = h => { setSellHolding(h); setMode('sell') }
  const closeForm  = ()  => { setMode(null); setSellHolding(null) }

  const kpis = [
    { label: 'Portfolio Value',  value: inrCompact(portfolioValue), color: G.gold, sub: 'Current market value' },
    { label: 'Unrealised P&L',   value: inr(portfolioGain),         color: portfolioGain >= 0 ? G.green : G.red, sub: pct(gainPct) },
    { label: 'Realised P&L',     value: inr(realisedPnl),           color: realisedPnl >= 0 ? G.green : G.red, sub: 'All closed trades' },
    { label: 'Total Trades',     value: trades.length,              color: '#4f8eff', sub: `${trades.filter(t => ['sell','switch_out'].includes(t.trade_type)).length} exits` },
  ]

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: G.sans }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.color, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: `radial-gradient(circle, ${k.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ fontFamily: G.mono, fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: G.muted, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: G.display, fontSize: '1.8rem', fontWeight: 300, color: G.text, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontFamily: G.mono, fontSize: '0.6rem', color: k.color }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AllocationChart />
        <HoldingsBreakdown />
      </div>

      {/* Holdings / History card */}
      <div style={{ background: G.card, border: `1px solid ${G.border}`, padding: '24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${G.border}` }}>
            {[['holdings','Holdings'],['history','Trade History']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '8px 20px', border: 'none', borderRight: id === 'holdings' ? `1px solid ${G.border}` : 'none',
                background: activeTab === id ? G.goldDim : 'transparent',
                color: activeTab === id ? G.gold : G.muted,
                fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s',
                borderBottom: activeTab === id ? `1px solid ${G.gold}` : '1px solid transparent',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: mode === 'buy' ? '✕ Cancel' : '▲ Buy / SIP', color: G.green, action: () => { setMode(mode === 'buy' ? null : 'buy'); setSellHolding(null) } },
              { label: mode === 'sell' ? '✕ Cancel' : '▼ Sell',     color: G.red,   action: () => { setMode(mode === 'sell' ? null : 'sell'); setSellHolding(null) } },
            ].map(({ label, color, action }) => (
              <button key={label} onClick={action} style={{
                padding: '8px 18px', background: 'transparent', border: `1px solid ${color}40`,
                color: color, fontFamily: G.mono, fontSize: '0.62rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = color }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${color}40` }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'buy'  && <TradeForm mode="buy"  onDone={closeForm} />}
        {mode === 'sell' && <TradeForm mode="sell" onDone={closeForm} prefilledHolding={sellHolding} />}

        {activeTab === 'holdings' && <HoldingsTable onSell={handleSell} />}
        {activeTab === 'history'  && <TradeHistory />}
      </div>
    </div>
  )
}