import { useState, useRef, useEffect ,useMemo} from "react"
import { supabase } from "../../lib/supabase.js"
import { useFinance } from "../../context/FinanceContext.jsx"
import { usePortfolioData } from "../../hooks/usePortfolioData"
import { useHoldings } from "../../hooks/useHoldings"
import { useTrades, useAddTrade } from "../../hooks/useTrades"
import { useDeleteHolding } from "../../hooks/useHoldings"
import RebalanceWidget from './RebalanceWidget'
import { useTheme } from "../../context/ThemeContext.jsx" // 👈 Add this
import { Spinner } from "../shared/ui.jsx"
import { inr, inrCompact, pct, todayISO } from "../../lib/formatters.js"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import PerformanceChart from './PerformanceChart'

import {
  Search, TrendingUp, TrendingDown, BarChart2,
  Repeat2, ChevronDown, Check, X, ShoppingCart,
  ArrowDownCircle, Trash2, RefreshCw, Activity,Wallet,LayoutGrid,Settings2
} from "lucide-react"

// ── Glass helpers ─────────────────────────────────────────────────────────────
const glass = (o = 0.04, b = 20) => ({
  background: `rgba(255,255,255,${o})`,
  backdropFilter: `blur(${b}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
})
const gi = (theme) => `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
const shine = {
  position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
  background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)",
  pointerEvents: "none",
}

// ── Asset config ──────────────────────────────────────────────────────────────
export const ASSET_CLASSES = [
  { value: "equity",      label: "Equity",       exchange: "NSE",   color: "#2563EB" },
  { value: "us_equity",   label: "US Equity",    exchange: "NYSE",  color: "#0EA5E9" },
  { value: "etf",         label: "ETF",          exchange: "NSE",   color: "#60A5FA" },
  { value: "mutual_fund", label: "Mutual Fund",  exchange: "AMFI",  color: "#8B5CF6" },
  { value: "index_fund",  label: "Index Fund",   exchange: "AMFI",  color: "#A78BFA" },
  { value: "elss",        label: "ELSS",         exchange: "AMFI",  color: "#C4B5FD" },
  { value: "debt_fund",   label: "Debt Fund",    exchange: "AMFI",  color: "#10B981" },
  { value: "liquid_fund", label: "Liquid Fund",  exchange: "AMFI",  color: "#34D399" },
  { value: "hybrid_fund", label: "Hybrid Fund",  exchange: "AMFI",  color: "#6EE7B7" },
  { value: "gold",        label: "Gold",         exchange: "NSE",   color: "#F59E0B" },
  { value: "silver",      label: "Silver",       exchange: "NSE",   color: "#94A3B8" },
  { value: "reit",        label: "REIT",         exchange: "NSE",   color: "#EC4899" },
  { value: "invit",       label: "InvIT",        exchange: "NSE",   color: "#F97316" },
  { value: "crypto",      label: "Crypto",       exchange: "OTHER", color: "#A855F7" },
  { value: "other",       label: "Other",        exchange: "OTHER", color: "#6B7280" },
]

const CATEGORY_GROUPS = [
  { key: "equity",      label: "Equity",       color: "#2563EB", includes: ["equity","etf"] },
  { key: "us_equity",   label: "US Equity",    color: "#0EA5E9", includes: ["us_equity","index"] },
  { key: "mutual_fund", label: "Mutual Funds", color: "#8B5CF6", includes: ["mutual_fund","index_fund","elss"] },
  { key: "debt",        label: "Debt",         color: "#10B981", includes: ["debt_fund","liquid_fund","hybrid_fund"] },
  { key: "commodity",   label: "Commodity",    color: "#F59E0B", includes: ["gold","silver"] },
  { key: "other",       label: "Other",        color: "#6B7280", includes: ["reit","invit","crypto","other"] },
]

const assetColor = (theme, k) => ASSET_CLASSES.find(a => a.value === k)?.color || theme.muted
const assetLabel = k => ASSET_CLASSES.find(a => a.value === k)?.label || k

// ── Shared primitives ─────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => {
  const { theme } = useTheme() // 👈 Add this
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
      <div style={{ width: 3, height: 14, background: theme.accent, borderRadius: 2, boxShadow: `0 0 8px ${theme.accent}` }} />
      <span style={{ fontFamily: theme.mono, fontSize: "0.57rem", letterSpacing: "0.22em", textTransform: "uppercase", color: theme.accent }}>
        {children}
      </span>
    </div>
  )
}

const FieldLabel = ({ children }) => {
  const { theme } = useTheme() // 👈 Add this
  
  return (
    <div style={{ fontFamily: theme.mono, fontSize: "0.51rem", letterSpacing: "0.18em", textTransform: "uppercase", color: theme.muted, marginBottom: 5 }}>
      {children}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PortfolioSkeleton() {
  const { theme } = useTheme() // 👈 Add this
  
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`@keyframes gpulse{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:110, animation:`gpulse 1.8s ${i*0.15}s infinite` }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1,2].map(i => (
          <div key={i} style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:280, animation:`gpulse 1.8s ${i*0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ ...glass(0.04,16), border:`1px solid ${theme.border}`, borderRadius:14, height:360, animation:"gpulse 1.8s 0.4s infinite" }} />
    </div>
  )
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, allData }) => {
  const { theme } = useTheme() // 👈 Add this
  
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const total = allData?.reduce((s, i) => s + i.value, 0) || 0
  const p = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  return (
    <div style={{ ...glass(0.15,20), border:`1px solid ${theme.borderHi}`, padding:"10px 14px", borderRadius:10, boxShadow:`0 8px 24px rgba(0,0,0,0.4),0 0 16px ${theme.accentGlow}` }}>
      <div style={{ fontFamily:theme.mono, fontSize:"0.58rem", color:theme.muted, marginBottom:4 }}>{d.name}</div>
      <div style={{ fontFamily:theme.display, fontSize:"1.1rem", color:theme.accentLt }}>{inr(d.value)}</div>
      <div style={{ fontFamily:theme.mono, fontSize:"0.54rem", color:theme.muted, marginTop:2 }}>{p}% of portfolio</div>
      {d.changePct != null && (
        <div style={{ fontFamily:theme.mono, fontSize:"0.54rem", color:d.changePct >= 0 ? theme.green : theme.red, marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
          {d.changePct >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {pct(d.changePct)} today
        </div>
      )}
    </div>
  )
}

// ── Input base style ──────────────────────────────────────────────────────────
const inputStyle = (theme) => ({
  ...glass(0.05, 14),
  border: `1px solid ${theme.border}`,
  borderRadius: 9,
  color: theme.text,
  fontFamily: theme.mono,
  fontSize: "0.73rem",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2)`,
})

const readonlyStyle = (theme) => ({
  ...inputStyle(theme),
  background: "rgba(0,0,0,0.25)",
  color: theme.muted,
  cursor: "not-allowed",
  opacity: 0.7,
})

// ── Trade Form ────────────────────────────────────────────────────────────────
function TradeForm({ mode, onDone, prefilledHolding }) {
  const { theme } = useTheme() // 👈 Add this
  const { userId } = useFinance()
  const addTrade = useAddTrade(userId)
  const { data: holdings = [] } = useHoldings(userId)
  const isB = mode === "buy"
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const accentC = isB ? theme.green : theme.red
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  useEffect(() => {
    const fn = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const [form, setForm] = useState({
    ticker: prefilledHolding?.ticker || "",
    name: prefilledHolding?.name || "",
    exchange: prefilledHolding?.exchange || "NSE",
    asset_class: prefilledHolding?.asset_class || "equity",
    sub_category: prefilledHolding?.sub_category || "",
    trade_date: todayISO(),
    trade_type: isB ? "buy" : "sell",
    quantity: "", price: "", brokerage: "", stt: "", gst: "", notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  const set = k => v => setForm(f => {
    const u = { ...f, [k]: v }
    if (k === "asset_class") {
      u.exchange = ASSET_CLASSES.find(a => a.value === v)?.exchange || "NSE"
      u.sub_category = ""
    }
    return u
  })

  useEffect(() => {
    const search = async () => {
      if (!form.name || form.name.length < 2) { setSearchResults([]); return }
      setSearchLoading(true)
      try {
        const { data } = await supabase.from("instruments").select("*")
          .or(`name.ilike.%${form.name}%,symbol.ilike.%${form.name}%`).limit(10)
        setSearchResults(data || [])
        setShowSearch(true)
      } finally { setSearchLoading(false) }
    }
    const t = setTimeout(search, 300)
    return () => clearTimeout(t)
  }, [form.name])

  const selectInstrument = ins => {
    setForm(f => ({ ...f, ticker: ins.symbol, name: ins.name, exchange: ins.exchange, asset_class: ins.asset_class, sub_category: ins.sub_category || "" }))
    setShowSearch(false)
  }

  const holding = holdings.find(h => h.ticker === form.ticker.toUpperCase() && h.exchange === form.exchange)
  const maxSell = holding?.quantity || 0

  const submit = async () => {
    if (!form.ticker || !form.quantity || !form.price) { setErr("Ticker, quantity and price are required"); return }
    if (!isB && Number(form.quantity) > maxSell) { setErr(`You only hold ${maxSell} units of ${form.ticker}`); return }
    setSaving(true); setErr("")
    try {
      await addTrade.mutateAsync({
        ticker: form.ticker, name: form.name || form.ticker,
        exchange: form.exchange, asset_class: form.asset_class,
        sub_category: form.sub_category || null, trade_date: form.trade_date,
        trade_type: form.trade_type, quantity: Number(form.quantity),
        price: Number(form.price), brokerage: Number(form.brokerage) || 0,
        stt: Number(form.stt) || 0, gst: Number(form.gst) || 0,
        notes: form.notes || null,
      })
      onDone()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{
      ...glass(0.06, 20),
      border: `1px solid ${accentC}30`,
      borderLeft: `2px solid ${accentC}`,
      borderRadius: 14,
      padding: isMobile ? "16px" : "24px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
      boxShadow: `${gi}, 0 0 32px ${accentC}10`,
    }}>
      <div style={shine} />
      <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, background:`radial-gradient(circle,${accentC}0c 0%,transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        {isB ? <ShoppingCart size={14} style={{ color:accentC }} strokeWidth={2}/> : <ArrowDownCircle size={14} style={{ color:accentC }} strokeWidth={2}/>}
        <span style={{ fontFamily:theme.mono, fontSize:"0.58rem", letterSpacing:"0.18em", textTransform:"uppercase", color:accentC }}>
          {isB ? "Record Buy / SIP" : "Record Sell / Switch Out"}
        </span>
      </div>

      {/* Row 1 */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={{ gridColumn: isMobile ? "1" : "span 2", position:"relative" }} ref={searchRef}>
          <FieldLabel>Search Instrument</FieldLabel>
          <div style={{ position:"relative" }}>
            <input value={form.name} onChange={e => set("name")(e.target.value)}
              placeholder="Search by name or symbol…"
              style={{ ...inputStyle(theme), paddingLeft:36 }}
              onFocus={e => { e.target.style.borderColor=`${theme.accent}70`; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}` }}
              onBlur={e => { e.target.style.borderColor=theme.border; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2)` }}
            />
            <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:theme.muted, pointerEvents:"none" }}/>
          </div>
          {showSearch && (searchResults.length > 0 || searchLoading) && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, ...glass(0.14,20), border:`1px solid ${theme.borderHi}`, borderRadius:10, maxHeight:240, overflowY:"auto", zIndex:1000, boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
              {searchLoading ? (
                <div style={{ padding:16, textAlign:"center" }}><Spinner size={14}/></div>
              ) : searchResults.map(ins => (
                <button key={ins.id} onClick={() => selectInstrument(ins)}
                  style={{ width:"100%", padding:"11px 14px", background:"transparent", border:"none", borderBottom:`1px solid ${theme.border}`, cursor:"pointer", textAlign:"left" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <div style={{ fontFamily:theme.sans, fontSize:"0.83rem", color:theme.text, marginBottom:3 }}>{ins.name}</div>
                  <div style={{ display:"flex", gap:10, fontFamily:theme.mono, fontSize:"0.57rem", color:theme.muted, flexWrap:"wrap" }}>
                    <span style={{ color:theme.accent }}>{ins.symbol}</span>
                    <span>·</span><span>{ins.exchange}</span>
                    <span>·</span><span>{assetLabel(ins.asset_class)}</span>
                    {ins.sector && <><span>·</span><span>{ins.sector}</span></>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {!isMobile && (
          <>
            <div>
              <FieldLabel>Ticker / Symbol</FieldLabel>
              <input value={form.ticker} readOnly style={{ ...readonlyStyle(theme), textTransform:"uppercase" }} placeholder="Auto-filled"/>
            </div>
            <div>
              <FieldLabel>Asset Class</FieldLabel>
              <input value={assetLabel(form.asset_class)} readOnly style={readonlyStyle(theme)}/>
            </div>
          </>
        )}
      </div>

      {/* Mobile — ticker + asset class */}
      {isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <FieldLabel>Ticker / Symbol</FieldLabel>
            <input value={form.ticker} readOnly style={{ ...readonlyStyle(theme), textTransform:"uppercase" }} placeholder="Auto-filled"/>
          </div>
          <div>
            <FieldLabel>Asset Class</FieldLabel>
            <input value={assetLabel(form.asset_class)} readOnly style={readonlyStyle(theme)}/>
          </div>
        </div>
      )}

      {/* Row 2 */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <FieldLabel>Sub-Category</FieldLabel>
          <input value={form.sub_category ? form.sub_category.replace(/_/g," ") : "—"} readOnly style={readonlyStyle(theme)}/>
        </div>
        <div>
          <FieldLabel>Exchange</FieldLabel>
          <input value={form.exchange} readOnly style={readonlyStyle(theme)}/>
        </div>
        {!isMobile && (
          <>
            <div>
              <FieldLabel>Trade Type</FieldLabel>
              <select value={form.trade_type} onChange={e => set("trade_type")(e.target.value)}
                style={{ ...inputStyle(theme), appearance:"none", cursor:"pointer",
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7fa5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:30 }}
                onFocus={e => e.target.style.borderColor=`${theme.accent}70`}
                onBlur={e => e.target.style.borderColor=theme.border}
              >
                {isB
                  ? [["buy","Buy"],["sip","SIP"],["switch_in","Switch In"],["dividend_reinvest","Div Reinvest"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                  : [["sell","Sell"],["switch_out","Switch Out"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                }
              </select>
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input value={form.trade_date} onChange={e => set("trade_date")(e.target.value)} type="date"
                style={inputStyle(theme)}
                onFocus={e => e.target.style.borderColor=`${theme.accent}70`}
                onBlur={e => e.target.style.borderColor=theme.border}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile — trade type + date */}
      {isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <FieldLabel>Trade Type</FieldLabel>
            <select value={form.trade_type} onChange={e => set("trade_type")(e.target.value)}
              style={{ ...inputStyle(theme), appearance:"none", cursor:"pointer",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7fa5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:30 }}
              onFocus={e => e.target.style.borderColor=`${theme.accent}70`}
              onBlur={e => e.target.style.borderColor=theme.border}
            >
              {isB
                ? [["buy","Buy"],["sip","SIP"],["switch_in","Switch In"],["dividend_reinvest","Div Reinvest"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)
                : [["sell","Sell"],["switch_out","Switch Out"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)
              }
            </select>
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <input value={form.trade_date} onChange={e => set("trade_date")(e.target.value)} type="date"
              style={inputStyle(theme)}
              onFocus={e => e.target.style.borderColor=`${theme.accent}70`}
              onBlur={e => e.target.style.borderColor=theme.border}
            />
          </div>
        </div>
      )}

      {/* Row 3 */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <FieldLabel>{!isB ? `Quantity (max: ${maxSell})` : "Quantity / Units"}</FieldLabel>
          <input value={form.quantity} onChange={e => set("quantity")(e.target.value)} placeholder="0" type="number" min="0" step="0.0001"
            style={inputStyle(theme)}
            onFocus={e => { e.target.style.borderColor=`${theme.accent}70`; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}` }}
            onBlur={e => { e.target.style.borderColor=theme.border; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2)` }}
          />
        </div>
        <div>
          <FieldLabel>Price / NAV (₹)</FieldLabel>
          <input value={form.price} onChange={e => set("price")(e.target.value)} placeholder="0.00" type="number" min="0" step="0.01"
            style={inputStyle(theme)}
            onFocus={e => { e.target.style.borderColor=`${theme.accent}70`; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}` }}
            onBlur={e => { e.target.style.borderColor=theme.border; e.target.style.boxShadow=`inset 0 2px 4px rgba(0,0,0,0.2)` }}
          />
        </div>
      </div>

      {/* Calc summary */}
      {form.quantity && form.price && (
        <div style={{
          ...glass(0.06,12),
          border:`1px solid ${theme.border}`,
          borderLeft:`2px solid ${theme.accent}`,
          borderRadius:10,
          padding:"10px 16px",
          marginBottom:14,
          display:"flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 8 : 28,
        }}>
          <span style={{ fontFamily:theme.mono, fontSize:"0.64rem", color:theme.muted }}>
            Total <strong style={{ color:theme.accentLt, fontFamily:theme.display, fontSize:"1rem" }}>{inr(Number(form.quantity)*Number(form.price))}</strong>
          </span>
          {!isB && holding && (
            <span style={{ fontFamily:theme.mono, fontSize:"0.64rem", color:theme.muted }}>
              Avg cost <strong style={{ color:theme.text }}>{inr(holding.avg_cost)}</strong>
              {"  "}Est P&L <strong style={{ color:Number(form.price) >= holding.avg_cost ? theme.green : theme.red }}>
                {inr((Number(form.price) - holding.avg_cost) * Number(form.quantity))}
              </strong>
            </span>
          )}
        </div>
      )}

      {err && <div style={{ color:theme.red, fontFamily:theme.mono, fontSize:"0.61rem", marginBottom:10, letterSpacing:"0.06em" }}>{err}</div>}

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button onClick={submit} disabled={saving || addTrade.isPending} style={{
          display:"inline-flex", alignItems:"center", gap:8,
          ...glass(0.08,12),
          border:`1px solid ${accentC}50`,
          borderRadius:9, color:accentC, padding: isMobile ? "8px 16px" : "10px 24px",
          cursor:saving ? "not-allowed" : "pointer",
          fontFamily:theme.mono, fontSize:"0.63rem", letterSpacing:"0.16em", textTransform:"uppercase",
          opacity:saving ? 0.6 : 1, transition:"all 0.2s",
          boxShadow:`0 0 16px ${accentC}18`,
          width: isMobile ? "100%" : "auto",
          justifyContent:"center",
        }}>
          {saving ? <Spinner size={12}/> : isB ? <><ShoppingCart size={12}/> Confirm Buy</> : <><ArrowDownCircle size={12}/> Confirm Sell</>}
        </button>
        <button onClick={onDone} style={{
          ...glass(0.03,12),
          border:`1px solid ${theme.border}`, borderRadius:9,
          color:theme.muted, padding: isMobile ? "8px 16px" : "10px 20px",
          cursor:"pointer", fontFamily:theme.mono, fontSize:"0.63rem",
          letterSpacing:"0.13em", textTransform:"uppercase", transition:"all 0.2s",
          width: isMobile ? "100%" : "auto",
          justifyContent:"center",
          display:"flex", alignItems:"center",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=theme.borderHi; e.currentTarget.style.color=theme.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Filter Pill (scroll / swipe to cycle) ─────────────────────────────────────
function FilterPill({ allClasses, filterClass, setFilterClass }) {
  const { theme } = useTheme() // 👈 Add this
  const scrollAccRef = useRef(0)
  const scrollTimeoutRef = useRef(null)
  const touchStartX = useRef(null)
  const selected = allClasses.find(c => c.value === filterClass)

  const cycleFilter = (dir) => {
    const currentIndex = allClasses.findIndex(c => c.value === filterClass)
    const nextIndex = (currentIndex + dir + allClasses.length) % allClasses.length
    setFilterClass(allClasses[nextIndex].value)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    scrollAccRef.current += e.deltaY
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => { scrollAccRef.current = 0 }, 300)
    const step = 40
    if (Math.abs(scrollAccRef.current) >= step) {
      const dir = scrollAccRef.current > 0 ? 1 : -1
      scrollAccRef.current = 0
      cycleFilter(dir)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 30) {
      cycleFilter(dx > 0 ? 1 : -1)
    }
    touchStartX.current = null
  }

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        ...glass(0.07, 18),
        border: `1px solid ${theme.borderHi}`,
        borderRadius: 999,
        padding: "6px 14px",
        userSelect: "none",
        boxShadow: "0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor: "ew-resize",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gloss sheen */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)",
        borderRadius: "999px 999px 0 0", pointerEvents: "none",
      }}/>

      {/* Color dot */}
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: selected?.color || theme.accent,
        display: "inline-block", flexShrink: 0,
        boxShadow: `0 0 6px ${selected?.color || theme.accent}`,
        transition: "background 0.2s, box-shadow 0.2s",
        position: "relative",
      }}/>

      {/* Animated label */}
      <div style={{ position: "relative", overflow: "hidden", minWidth: 64, height: 16 }}>
        <span
          key={filterClass}
          style={{
            position: "absolute", left: 0, right: 0,
            fontFamily: theme.mono, fontSize: "0.61rem",
            color: theme.text, letterSpacing: "0.08em",
            whiteSpace: "nowrap", textAlign: "center",
            animation: "slideInPill 0.2s cubic-bezier(0.4,0,0.2,1) forwards",
          }}
        >
          {selected?.label || "Filter"}
        </span>
      </div>
    </div>
  )
}

// ── Trade History ─────────────────────────────────────────────────────────────
function TradeRow({ trade, index, total }) {
  const { theme } = useTheme() // 👈 Add this
  const [hov, setHov] = useState(false)
  const isSell = ["sell","switch_out"].includes(trade.trade_type)
  const c = isSell ? theme.red : theme.green
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  if (isMobile) {
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ ...glass(0.04,10), border:`1px solid ${theme.border}`, borderRadius:10, padding:12, marginBottom:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontFamily:theme.mono, fontSize:"0.6rem", color:theme.muted }}>{trade.trade_date}</div>
          <span style={{ fontFamily:theme.mono, fontSize:"0.55rem", letterSpacing:"0.06em", background:`${c}18`, color:c, padding:"3px 8px", border:`1px solid ${c}28`, borderRadius:6 }}>
            {trade.trade_type}
          </span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontFamily:theme.sans, fontWeight:500, fontSize:"0.9rem", color:theme.text }}>{trade.ticker}</div>
          <div style={{ fontFamily:theme.mono, fontSize:"0.65rem", color:theme.text }}>{Number(trade.quantity).toFixed(3)} units</div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:`1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.5rem", color:theme.muted }}>Price</div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.7rem", color:theme.text }}>{inr(trade.price)}</div>
          </div>
          <div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.5rem", color:theme.muted }}>Total</div>
            <div style={{ fontFamily:theme.display, fontSize:"0.85rem", color:theme.text }}>{inr(trade.total_value)}</div>
          </div>
          <div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.5rem", color:theme.muted }}>P&L</div>
            <div style={{ fontFamily:theme.display, fontSize:"0.85rem", color:trade.realised_pnl>=0?theme.green:theme.red }}>
              {trade.realised_pnl != null ? inr(trade.realised_pnl) : "—"}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 0.9fr 0.7fr 1fr 1fr 1fr", gap:8, padding:"11px 14px", borderBottom:index<total-1?`1px solid ${theme.border}`:"none", alignItems:"center", background:hov?"rgba(255,255,255,0.025)":"transparent", transition:"background 0.2s" }}
    >
      <div style={{ fontFamily:theme.mono, fontSize:"0.63rem", color:theme.muted }}>{trade.trade_date}</div>
      <div style={{ fontFamily:theme.sans, fontWeight:500, fontSize:"0.82rem", color:theme.text }}>{trade.ticker}</div>
      <span style={{ fontFamily:theme.mono, fontSize:"0.57rem", letterSpacing:"0.06em", background:`${c}18`, color:c, padding:"3px 8px", border:`1px solid ${c}28`, borderRadius:6, width:"fit-content" }}>
        {trade.trade_type}
      </span>
      <div style={{ fontFamily:theme.mono, fontSize:"0.68rem", color:theme.text }}>{Number(trade.quantity).toFixed(3)}</div>
      <div style={{ fontFamily:theme.mono, fontSize:"0.68rem", color:theme.text }}>{inr(trade.price)}</div>
      <div style={{ fontFamily:theme.display, fontSize:"0.95rem", color:theme.text }}>{inr(trade.total_value)}</div>
      <div>
        {trade.realised_pnl != null ? (
          <>
            <div style={{ fontFamily:theme.display, fontSize:"0.95rem", color:trade.realised_pnl>=0?theme.green:theme.red, textShadow:`0 0 10px ${(trade.realised_pnl>=0?theme.green:theme.red)+"35"}` }}>
              {inr(trade.realised_pnl)}
            </div>
            {trade.is_ltcg != null && (
              <div style={{ fontFamily:theme.mono, fontSize:"0.50rem", color:theme.muted, marginTop:2 }}>
                {trade.is_ltcg ? "LTCG" : "STCG"}
              </div>
            )}
          </>
        ) : <span style={{ fontFamily:theme.mono, fontSize:"0.63rem", color:theme.muted }}>—</span>}
      </div>
    </div>
  )
}

function TradeHistory() {
  const { theme } = useTheme() // 👈 Add this
  const { userId } = useFinance()
  const { data: trades = [], isLoading } = useTrades(userId)
  const [show, setShow] = useState(10)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  if (isLoading) return <div style={{ padding:"40px", textAlign:"center" }}><Spinner/></div>
  if (!trades.length) return <div style={{ textAlign:"center", color:theme.muted, fontFamily:theme.mono, fontSize:"0.7rem", padding:"40px 0", opacity:0.5 }}>No trade history yet.</div>

  return (
    <>
      {!isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 0.9fr 0.7fr 1fr 1fr 1fr", gap:8, padding:"6px 14px", borderBottom:`1px solid ${theme.border}`, marginBottom:2 }}>
          {["Date","Ticker","Type","Units","Price","Total","Realised P&L"].map(h => (
            <div key={h} style={{ fontFamily:theme.mono, fontSize:"0.50rem", letterSpacing:"0.16em", textTransform:"uppercase", color:theme.muted }}>{h}</div>
          ))}
        </div>
      )}
      {trades.slice(0,show).map((t,i) => <TradeRow key={t.id} trade={t} index={i} total={Math.min(trades.length,show)}/>)}
      {trades.length > show && (
        <div style={{ textAlign:"center", marginTop:16, paddingTop:12, borderTop:`1px solid ${theme.border}` }}>
          <button onClick={() => setShow(s => s+20)} style={{ ...glass(0.05,12), border:`1px solid ${theme.border}`, borderRadius:9, color:theme.muted, padding:"8px 20px", fontFamily:theme.mono, fontSize:"0.59rem", letterSpacing:"0.13em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=theme.borderHi; e.currentTarget.style.color=theme.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
          >
            Load more · {trades.length - show} remaining
          </button>
        </div>
      )}
    </>
  )
}

function UnifiedPortfolioChart({ selectedAsset, onAssetChange }) {
  const { theme, isDark } = useTheme()
  const { userId } = useFinance()
  const { data: portfolioData } = usePortfolioData(userId)
  const { data: holdings = [] } = useHoldings(userId)
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  // Wheel/touch interaction refs
  const scrollAccRef = useRef(0)
  const scrollTimeout = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  useEffect(() => {
    const fn = e => { 
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false) 
      }
    }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const byAssetClass = portfolioData?.byAssetClass || {}
  const quotesMap = portfolioData?.quotesMap || {}

  // Prepare data based on selection
  const chartData = useMemo(() => {
    if (selectedAsset === "all") {
      // Overall asset allocation - use ASSET_CLASSES directly
      return Object.entries(byAssetClass)
        .map(([key, value]) => {
          const assetClass = ASSET_CLASSES.find(a => a.value === key)
          return {
            name: assetClass?.label || key,
            value,
            color: assetClass?.color || theme.muted,
            originalKey: key
          }
        })
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)
    } else {
      // Individual asset class view
      const assetClass = ASSET_CLASSES.find(a => a.value === selectedAsset)
      if (!assetClass) return []
      
      return holdings
        .filter(h => h.asset_class === selectedAsset && h.quantity > 0)
        .map(h => {
          const price = quotesMap[h.ticker]?.price || h.avg_cost
          const value = price * h.quantity
          const displayName = (h.name || h.ticker).length > 22 ? (h.name || h.ticker).slice(0, 22) + "…" : h.name || h.ticker
          return {
            name: displayName,
            fullName: h.name || h.ticker,
            ticker: h.ticker,
            value,
            color: assetClass.color,
            changePct: quotesMap[h.ticker]?.changePct,
            assetClass: h.asset_class
          }
        })
        .sort((a, b) => b.value - a.value)
    }
  }, [selectedAsset, byAssetClass, holdings, quotesMap, theme])

  const total = chartData.reduce((s, d) => s + d.value, 0)
  
  // Dropdown options - only show asset classes that have holdings
  const options = useMemo(() => {
    // Get unique asset classes that have holdings
    const assetClassesWithHoldings = new Set()
    holdings.forEach(h => {
      if (h.quantity > 0 && h.asset_class) {
        assetClassesWithHoldings.add(h.asset_class)
      }
    })

    return [
      { value: "all", label: "All Assets", color: theme.accent, icon: LayoutGrid },
      ...ASSET_CLASSES
        .filter(ac => assetClassesWithHoldings.has(ac.value))
        .map(ac => ({
          value: ac.value,
          label: ac.label,
          color: ac.color,
          icon: LayoutGrid // You might want different icons per asset class
        }))
    ]
  }, [holdings, theme])

  const currentIndex = Math.max(0, options.findIndex(o => o.value === selectedAsset))
  const selected = options[currentIndex] || options[0]
  const SelIcon = selected?.icon || LayoutGrid
  const c = selected?.color || theme.accent

  // Wheel/touch handlers
  const cycleFilter = (dir) => {
    const next = (currentIndex + dir + options.length) % options.length
    onAssetChange(options[next].value)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    scrollAccRef.current += e.deltaY + e.deltaX
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => { scrollAccRef.current = 0 }, 300)
    if (Math.abs(scrollAccRef.current) >= 40) {
      cycleFilter(scrollAccRef.current > 0 ? 1 : -1)
      scrollAccRef.current = 0
    }
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 28) cycleFilter(dx > 0 ? 1 : -1)
    touchStartX.current = null
  }

  // Handle selection change
  const handleSelect = (value) => {
    onAssetChange(value)
    setShowDrop(false)
  }

  // Custom glass function for pills
  const mkGlass = (o = 0.07, b = 18) => ({
    background: isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.55})`,
    backdropFilter: `blur(${b}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${b}px) saturate(180%)`,
  })

  // Don't return null if no data, show empty state
  if (!chartData.length) {
    return (
      <div style={{ 
        ...glass(theme, 0.04, 20), 
        border: `1px solid ${theme.border}`, 
        borderRadius: 16, 
        padding: isMobile ? "16px" : "24px", 
        position: "relative", 
        overflow: "hidden", 
        boxShadow: gi(theme) 
      }}>
        <div style={shine} />
        <SectionLabel>
          {selectedAsset === "all" ? "Asset Allocation" : `${selected?.label || 'Selected'} Holdings`}
        </SectionLabel>
        <div style={{ 
          height: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: theme.mono,
          fontSize: '0.8rem',
          color: theme.muted,
          textAlign: 'center',
          padding: '0 20px'
        }}>
          {selectedAsset === "all" 
            ? "No assets in your portfolio" 
            : `No holdings in ${selected?.label || 'this category'}`}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE — single cycling pill (like FilterBar)
  // ══════════════════════════════════════════════════════════════════════════
if (isMobile) {
  return (
    <div style={{ 
      ...glass(theme, 0.04, 20), 
      border: `1px solid ${theme.border}`, 
      borderRadius: 16, 
      padding: "16px", 
      position: "relative", 
      overflow: "hidden", 
      boxShadow: gi(theme) 
    }}>
      <div style={shine} />
      
      <style>{`
        @keyframes slideInPill {
          from { opacity:0; transform:translateY(6px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
        @keyframes iconPop {
          0%   { transform: scale(0.65) rotate(-10deg); opacity:0; }
          60%  { transform: scale(1.18) rotate( 2deg);  opacity:1; }
          100% { transform: scale(1)    rotate( 0deg);  opacity:1; }
        }
      `}</style>

      {/* Header with cycling pill - FIXED ALIGNMENT */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <SectionLabel>
          {selectedAsset === "all" ? "Asset Allocation" : `${selected?.label} Holdings`}
        </SectionLabel>

        {/* Cycling Pill - FIXED ALIGNMENT */}
        <div
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            ...mkGlass(0.07, 22),
            border: `1px solid ${theme.borderHi}`,
            borderRadius: 999,
            padding: "6px 16px", // Reduced vertical padding
            userSelect: "none",
            cursor: "ew-resize",
            position: "relative",
            overflow: "hidden",
            boxShadow: isDark
              ? `0 2px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.14), 0 0 0 1px ${c}1a`
              : `0 2px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 0 rgba(0,0,0,0.04), 0 0 0 1px ${c}12`,
            transition: "box-shadow 0.25s ease",
            WebkitTapHighlightColor: "transparent",
            width: "auto",
            minWidth: 160,
            height: 28, // Fixed height for consistency
          }}
        >
          {/* Top specular sheen */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "46%",
            background: isDark
              ? "linear-gradient(180deg,rgba(255,255,255,0.10) 0%,transparent 100%)"
              : "linear-gradient(180deg,rgba(255,255,255,0.78) 0%,transparent 100%)",
            borderRadius: "999px 999px 0 0",
            pointerEvents: "none",
          }}/>
          {/* Bottom depth shadow */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
            background: isDark
              ? "linear-gradient(0deg,rgba(0,0,0,0.16) 0%,transparent 100%)"
              : "linear-gradient(0deg,rgba(0,0,0,0.04) 0%,transparent 100%)",
            borderRadius: "0 0 999px 999px",
            pointerEvents: "none",
          }}/>

          {/* Icon - centered vertically */}
          <span
            key={`icon-${selectedAsset}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "iconPop 0.34s cubic-bezier(0.34,1.56,0.64,1)",
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
              width: 20,
              height: 20,
            }}
          >
            {SelIcon && (
              <SelIcon 
                size={14} 
                strokeWidth={2.2}
                style={{ 
                  color: c, 
                  filter: `drop-shadow(0 0 5px ${c}90)`,
                  display: 'block',
                }}
              />
            )}
          </span>

          {/* Label - centered vertically */}
          <div style={{ 
            position: "relative", 
            overflow: "hidden", 
            height: 20,
            display: "flex",
            alignItems: "center",
          }}>
            <span
              key={selectedAsset}
              style={{
                position: "relative",
                fontFamily: theme.mono, 
                fontSize: "0.65rem",
                color: theme.text, 
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                animation: "slideInPill 0.22s cubic-bezier(0.4,0,0.2,1) forwards",
                display: "inline-block",
                lineHeight: 1,
              }}
            >
              {selected?.value === "all"
                ? `All Assets`
                : `${selected?.label}`}
            </span>
          </div>       
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie 
            data={chartData} 
            cx="50%" 
            cy="50%" 
            innerRadius={65} 
            outerRadius={85} 
            paddingAngle={3} 
            dataKey="value" 
            strokeWidth={0} 
            startAngle={90} 
            endAngle={-270}
          >
            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-0.6em" style={{ fontFamily: theme.mono, fontSize: "0.5rem", fill: theme.muted }}>TOTAL</tspan>
            <tspan x="50%" dy="1.4em" style={{ 
              fontFamily: theme.display, 
              fontSize: "0.9rem", 
              fill: theme.text, 
              fontWeight: 600 
            }}>
              ₹{total.toFixed(2)}
            </tspan>
          </text>
          <Tooltip content={<GlassTooltip allData={chartData} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{
        display: "grid", 
        gridTemplateColumns: "1fr", 
        gap: "6px", 
        marginTop: 16,
        maxHeight: 200, 
        overflowY: "auto", 
        paddingRight: 4,
      }}>
        {chartData.map((d, i) => {
          const percentage = ((d.value / total) * 100).toFixed(1)
          return (
            <div key={i} style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "6px 8px", 
              borderBottom: i < chartData.length - 1 ? `1px solid ${theme.border}30` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: "50%", 
                  background: d.color, 
                  flexShrink: 0,
                }}/>
                <span style={{ 
                  fontFamily: theme.mono, 
                  fontSize: "0.65rem", 
                  color: theme.text, 
                  whiteSpace: "normal", 
                  wordBreak: "break-word",
                }}>
                  {d.name}
                  {d.changePct !== undefined && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: "0.65rem",
                      color: d.changePct >= 0 ? theme.green : theme.red,
                    }}>
                      {d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
              <span style={{ 
                fontFamily: theme.mono, 
                fontSize: "0.55rem", 
                color: theme.accent, 
                fontWeight: 600, 
                marginLeft: 8, 
                whiteSpace: "nowrap" 
              }}>
                {percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP — glass dropdown
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ 
      ...glass(theme, 0.04, 20), 
      border: `1px solid ${theme.border}`, 
      borderRadius: 16, 
      padding: "24px", 
      position: "relative", 
      overflow: "hidden", 
      boxShadow: gi(theme) 
    }}>
      <div style={shine} />

      <style>{`
        @keyframes ddOpen {
          from { opacity:0; transform:translateY(-6px) scale(0.98) }
          to   { opacity:1; transform:translateY(0)    scale(1)    }
        }
      `}</style>

      {/* Header with dropdown */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        marginBottom: 18, 
        flexDirection: "row", 
        gap: 0 
      }}>
        <SectionLabel>
          {selectedAsset === "all" ? "Asset Allocation" : `${selected?.label} Holdings`}
        </SectionLabel>
        
        <div style={{ 
          position: "relative", 
          alignSelf: "auto", 
          width: "auto" 
        }} ref={dropRef}>
          <button 
            onClick={() => setShowDrop(v => !v)} 
            style={{
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              gap: 8,
              padding: "6px 14px", 
              ...mkGlass(showDrop ? 0.08 : 0.05, 18),
              border: `1px solid ${showDrop ? theme.borderHi : theme.border}`,
              borderRadius: 9, 
              fontFamily: theme.mono, 
              fontSize: "0.59rem", 
              color: theme.text,
              cursor: "pointer", 
              letterSpacing: "0.08em", 
              transition: "border-color 0.2s",
              width: "auto",
              minWidth: 160,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Sheen */}
            <div style={{
              position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
              background: isDark
                ? "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)"
                : "linear-gradient(90deg,transparent,rgba(255,255,255,0.80),transparent)",
              pointerEvents: "none",
            }}/>

            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                background: selected?.color, 
                display: "inline-block", 
                borderRadius: "50%" 
              }}/>
              {selected?.label}
            </span>
            <ChevronDown size={11} style={{ color: theme.muted }}/>
          </button>
          
          {showDrop && (
            <div style={{ 
              position: "absolute", 
              top: "100%", 
              right: 0, 
              marginTop: 4, 
              ...mkGlass(0.14, 26),
              border: `1px solid ${theme.borderHi}`, 
              borderRadius: 12, 
              width: 180, 
              zIndex: 100, 
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              animation: "ddOpen 0.18s cubic-bezier(0.4,0,0.2,1)",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
                background: isDark
                  ? "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)"
                  : "linear-gradient(90deg,transparent,rgba(255,255,255,0.90),transparent)",
                pointerEvents: "none",
              }}/>

              {options.map((opt, i) => {
                const active = selectedAsset === opt.value
                return (
                  <button 
                    key={opt.value} 
                    onClick={() => handleSelect(opt.value)}
                    style={{ 
                      width: "100%", 
                      padding: "9px 14px", 
                      background: active ? `${theme.accent}15` : "transparent", 
                      border: "none", 
                      borderBottom: i < options.length - 1 ? `1px solid ${theme.border}` : "none", 
                      color: active ? theme.accent : theme.text, 
                      fontFamily: theme.mono, 
                      fontSize: "0.59rem", 
                      textAlign: "left", 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { 
                      if(!active) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" 
                    }}
                    onMouseLeave={e => { 
                      if(!active) e.currentTarget.style.background = "transparent" 
                    }}
                  >
                    <span style={{ 
                      width: 6, 
                      height: 6, 
                      background: opt.color, 
                      display: "inline-block", 
                      flexShrink: 0, 
                      borderRadius: "50%" 
                    }}/>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {active && <Check size={11} style={{ color: theme.accent }}/>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie 
            data={chartData} 
            cx="50%" 
            cy="50%" 
            innerRadius={70} 
            outerRadius={90} 
            paddingAngle={3} 
            dataKey="value" 
            strokeWidth={0} 
            startAngle={90} 
            endAngle={-270}
          >
            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-0.6em" style={{ fontFamily: theme.mono, fontSize: "0.6rem", fill: theme.muted }}>TOTAL</tspan>
            <tspan x="50%" dy="1.4em" style={{ 
              fontFamily: theme.display, 
              fontSize: "1.2rem", 
              fill: theme.text, 
              fontWeight: 600 
            }}>
              ₹{total.toFixed(2)}
            </tspan>
          </text>
          <Tooltip content={<GlassTooltip allData={chartData} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Desktop Legend */}
      <div style={{
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", 
        gap: "8px 16px", 
        marginTop: 20,
        maxHeight: 200, 
        overflowY: "auto", 
        paddingRight: 4,
        scrollbarWidth: "thin", 
        scrollbarColor: `${theme.accent}40 ${theme.bg2}`,
      }}>
        {chartData.map((d, i) => {
          const percentage = ((d.value / total) * 100).toFixed(1)
          return (
            <div key={i} style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "6px 8px", 
              borderBottom: i < chartData.length - 1 ? `1px solid ${theme.border}30` : "none",
              ...glass(theme, 0.02, 8),
              borderRadius: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: "50%", 
                  background: d.color, 
                  flexShrink: 0, 
                  boxShadow: `0 0 8px ${d.color}` 
                }}/>
                <span style={{ 
                  fontFamily: theme.mono, 
                  fontSize: "0.65rem", 
                  color: theme.text, 
                  whiteSpace: "normal", 
                  wordBreak: "break-word", 
                  lineHeight: 1.4 
                }}>
                  {d.name}
                  {d.changePct !== undefined && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: "0.55rem",
                      color: d.changePct >= 0 ? theme.green : theme.red,
                    }}>
                      {d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
              <span style={{ 
                fontFamily: theme.mono, 
                fontSize: "0.65rem", 
                color: theme.accent, 
                fontWeight: 600, 
                marginLeft: 8, 
                whiteSpace: "nowrap" 
              }}>
                {percentage}%
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${theme.bg2}; borderRadius:4px; }
        ::-webkit-scrollbar-thumb { background:${theme.accent}60; borderRadius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:${theme.accent}; }
      `}</style>
    </div>
  )
}

// ── Holdings Table ────────────────────────────────────────────────────────────
function HoldingsTable({ onSell, selectedAsset }) {
  const { theme } = useTheme()
  const { userId } = useFinance()
  const { data: holdings = [], isLoading } = useHoldings(userId)
  const deleteHolding = useDeleteHolding(userId)
  const { data: portfolioData } = usePortfolioData(userId)
  const quotesMap = portfolioData?.quotesMap || {}
  const usdInrRate = portfolioData?.usdInrRate || 86.5

  const [hovered, setHovered] = useState(null)
  const [globalViewMode, setGlobalViewMode] = useState('value') // Single global state
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768
  const isTablet = windowWidth > 768 && windowWidth <= 1024

  // Filter holdings based on selected asset class from chart
  const filtered = useMemo(() => {
    return holdings.filter(h => 
      h.quantity > 0 && 
      (selectedAsset === "all" || h.asset_class === selectedAsset)
    )
  }, [holdings, selectedAsset])

  // Cycle through view modes globally
  const cycleGlobalView = () => {
    setGlobalViewMode(prev => {
      const next = prev === 'value' ? 'change' : prev === 'change' ? 'returns' : 'value'
      return next
    })
  }

  const getCardContent = (holding, viewMode) => {
    const q = quotesMap[holding.ticker]
    const isUS = ["NYSE","NASDAQ","PCX"].includes(holding.exchange)
    const currentPrice = q?.price ?? holding.avg_cost ?? 0
    const value = currentPrice * (holding.quantity || 0)
    const costInINR = isUS ? (holding.avg_cost || 0) * (holding.quantity || 0) * usdInrRate : (holding.avg_cost || 0) * (holding.quantity || 0)
    const gain = value - costInINR
    const gainP = costInINR > 0 ? (gain / costInINR) * 100 : 0
    const changePct = q?.changePct || 0

    const totalFiltered = filtered.reduce((sum, h) => {
      const hValue = (quotesMap[h.ticker]?.price ?? h.avg_cost ?? 0) * (h.quantity || 0)
      return sum + hValue
    }, 0)

    switch (viewMode) {
      case 'value':
        return {
          main: `₹${value ? value.toFixed(2) : '0.00'}`,
          sub: `${totalFiltered > 0 ? ((value / totalFiltered) * 100).toFixed(1) : 0}%`,
          label: 'Current Value',
          color: gain >= 0 ? theme.green : theme.red,
        }
      case 'change':
        return {
          main: `${changePct >= 0 ? '+' : ''}${changePct ? changePct.toFixed(2) : '0.00'}%`,
          sub: q ? `₹${(currentPrice * (holding.quantity || 0)).toFixed(2)}` : '—',
          label: "Today's Change",
          color: changePct >= 0 ? theme.green : theme.red,
        }
      case 'returns':
        return {
          main: `${gain >= 0 ? '+' : ''}₹${gain ? gain.toFixed(2) : '0.00'}`,
          sub: `${gainP >= 0 ? '+' : ''}${gainP ? gainP.toFixed(2) : '0.00'}%`,
          label: 'Total Returns',
          color: gain >= 0 ? theme.green : theme.red,
        }
      default:
        return { main: "—", sub: "—", label: "—", color: theme.muted }
    }
  }

  // ── Mobile card view ──────────────────────────────────────────────────────
  if (isMobile) {
    if (isLoading) return <div style={{ padding:"40px", textAlign:"center" }}><Spinner/></div>
    if (!filtered.length) {
      const selectedAssetInfo = selectedAsset === "all" 
        ? "All Assets" 
        : ASSET_CLASSES.find(a => a.value === selectedAsset)?.label || 'Selected'
      
      return (
        <div style={{ 
          textAlign:"center", 
          color:theme.muted, 
          fontFamily:theme.mono, 
          fontSize:"0.7rem", 
          padding:"40px 0", 
          opacity:0.5 
        }}>
          No holdings in {selectedAssetInfo}
        </div>
      )
    }

    return (
      <div>
        {/* Global view mode indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 16,
          fontFamily: theme.mono,
          fontSize: "0.6rem",
          color: theme.muted,
        }}>
          <span style={{
            padding: "4px 12px",
            background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: 20,
            border: `1px solid ${theme.border}`,
          }}>
            Showing: {globalViewMode === 'value' ? 'Value' : globalViewMode === 'change' ? "Today's Change" : 'Total Returns'}
          </span>
        </div>

        {/* Mobile Cards */}
        <div style={{ display:"grid", gap:12 }} onClick={cycleGlobalView}>
          {filtered.map(h => {
            const q = quotesMap[h.ticker]
            const ac = ASSET_CLASSES.find(a => a.value === h.asset_class)
            const content = getCardContent(h, globalViewMode)

            return (
              <div
                key={h.id}
                style={{
                  ...glass(theme, 0.05, 14),
                  border:`1px solid ${theme.border}`,
                  borderRadius:12,
                  padding:16,
                  cursor:"pointer",
                  transition:"all 0.2s ease",
                  position:"relative",
                  overflow:"hidden",
                }}
              >
                {/* Top accent bar */}
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:2,
                  background:`linear-gradient(90deg, ${content.color}60, transparent)`,
                }}/>

                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:theme.sans, fontWeight:600, fontSize:"1rem", color:theme.text, marginBottom:4 }}>
                      {h.name || h.ticker}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{
                        fontFamily:theme.mono, fontSize:"0.55rem", padding:"3px 8px",
                        background:`${ac?.color||theme.muted}18`, color:ac?.color||theme.muted,
                        border:`1px solid ${ac?.color||theme.muted}28`, borderRadius:6,
                      }}>
                        {ac?.label?.split(" ")[0] || h.asset_class}
                      </span>
                      <span style={{ fontFamily:theme.mono, fontSize:"0.55rem", color:theme.accent }}>{h.ticker}</span>
                      <span style={{ fontFamily:theme.mono, fontSize:"0.55rem", color:theme.muted }}>
                        {(h.quantity || 0).toFixed(4)} units
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.confirm("Delete this holding?") && deleteHolding.mutateAsync(h.id) }}
                      style={{
                        padding:"6px", ...glass(theme, 0.04, 8),
                        border:`1px solid ${theme.border}`, borderRadius:6,
                        color:theme.muted, cursor:"pointer",
                      }}
                    ><Trash2 size={12}/></button>
                  </div>
                </div>

                {/* Main content */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <div style={{ fontFamily:theme.mono, fontSize:"0.55rem", color:theme.muted, letterSpacing:"0.03em" }}>
                    {content.label}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:theme.display, fontSize:"1.3rem", fontWeight:700, color:content.color, lineHeight:1.2 }}>
                      {content.main}
                    </div>
                    <div style={{ fontFamily:theme.mono, fontSize:"0.6rem", color:theme.muted }}>
                      {content.sub}
                    </div>
                  </div>
                </div>

                {/* Tap hint */}
                <div style={{ position:"absolute", bottom:6, right:12, fontSize:"0.5rem", color:theme.muted, opacity:0.4 }}>
                  tap to cycle ↻
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  // ── Desktop / Tablet table view ───────────────────────────────────────────
  if (isLoading) return <div style={{ padding:"40px", textAlign:"center" }}><Spinner/></div>
  if (!filtered.length) {
    const selectedAssetInfo = selectedAsset === "all" 
      ? "All Assets" 
      : ASSET_CLASSES.find(a => a.value === selectedAsset)?.label || 'Selected'
    
    return (
      <div style={{ 
        textAlign:"center", 
        color:theme.muted, 
        fontFamily:theme.mono, 
        fontSize:"0.7rem", 
        padding:"40px 0", 
        opacity:0.5 
      }}>
        No holdings in {selectedAssetInfo}
      </div>
    )
  }

  const colGrid = isTablet
    ? "1.5fr 1fr 0.7fr 1fr 1fr 1fr 1.2fr 0.7fr 70px"
    : "1.8fr 1.1fr 0.7fr 1fr 1fr 1fr 1.2fr 0.7fr 76px"
  const headers = ["Instrument","Type","Units","Avg Cost","Live Price","Value","Unrealised P&L","Today",""]

  return (
    <div>
      {/* Table header */}
      <div style={{ display:"grid", gridTemplateColumns:colGrid, gap:8, padding:"6px 14px", borderBottom:`1px solid ${theme.border}`, marginBottom:2 }}>
        {headers.map(h => (
          <div key={h} style={{ fontFamily:theme.mono, fontSize:"0.50rem", letterSpacing:"0.16em", textTransform:"uppercase", color:theme.muted }}>{h}</div>
        ))}
      </div>

      {filtered.map((h, i) => {
        const q = quotesMap[h.ticker]
        const isUS = ["NYSE","NASDAQ","PCX"].includes(h.exchange)
        const currentPrice = q?.price ?? h.avg_cost ?? 0
        const value = currentPrice * (h.quantity || 0)
        const costInINR = isUS ? (h.avg_cost || 0) * (h.quantity || 0) * usdInrRate : (h.avg_cost || 0) * (h.quantity || 0)
        const gain = value - costInINR
        const gainP = costInINR > 0 ? (gain / costInINR) * 100 : 0
        const ac = ASSET_CLASSES.find(a => a.value === h.asset_class)
        const isHov = hovered === h.id

        return (
          <div key={h.id}
            onMouseEnter={() => setHovered(h.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ display:"grid", gridTemplateColumns:colGrid, gap:8, padding:"12px 14px", borderBottom:i<filtered.length-1?`1px solid ${theme.border}`:"none", alignItems:"center", background:isHov?"rgba(255,255,255,0.03)":"transparent", transition:"background 0.2s" }}
          >
            <div style={{ 
              minWidth: 0,
              width: "100%"
            }}>
              <div style={{ 
                fontFamily: theme.sans, 
                fontWeight: 500, 
                fontSize: "0.84rem", 
                color: theme.text,
                wordBreak: "break-word",
                lineHeight: 1.4,
                marginBottom: 2
              }}>
                {h.name || h.ticker}
              </div>
              <div style={{ 
                fontFamily: theme.mono, 
                fontSize: "0.56rem", 
                color: theme.accent, 
                letterSpacing: "0.08em",
                wordBreak: "break-word"
              }}>
                {h.ticker}
              </div>
            </div>
            <div>
              <span style={{ fontFamily:theme.mono, fontSize:"0.58rem", letterSpacing:"0.06em", background:`${ac?.color||theme.muted}18`, color:ac?.color||theme.muted, padding:"3px 8px", border:`1px solid ${ac?.color||theme.muted}28`, borderRadius:6 }}>
                {ac?.label?.split(" ")[0] || h.asset_class || '—'}
              </span>
            </div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.73rem", color:theme.text }}>{(h.quantity || 0).toFixed(4)}</div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.73rem", color:theme.text }}>
              {isUS ? `$${(h.avg_cost || 0).toFixed(2)}` : `₹${(h.avg_cost || 0).toFixed(2)}`}
            </div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.73rem", color:q?theme.text:theme.muted }}>
              {q ? `₹${q.price?.toFixed(2) || '0.00'}` : <span style={{ fontSize:"0.58rem" }}>Cached</span>}
            </div>
<div
  style={{
    fontFamily: theme.display,
    fontSize: "0.98rem",
    color: gain >= 0 ? theme.green : theme.red,
  }}
>
  ₹{value ? value.toFixed(2) : "0.00"}
</div>            <div>
              <div style={{ fontFamily:theme.display, fontSize:"0.98rem", color:gain>=0?theme.green:theme.red, textShadow:`0 0 10px ${(gain>=0?theme.green:theme.red)+"40"}` }}>
                {gain ? `₹${gain.toFixed(2)}` : '₹0.00'}
              </div>
              <div style={{ fontFamily:theme.mono, fontSize:"0.53rem", color:gain>=0?theme.green:theme.red, opacity:0.75 }}>
                {gainP ? `(${gainP.toFixed(2)}%)` : '(0.00%)'}
              </div>
            </div>
            <div style={{ fontFamily:theme.mono, fontSize:"0.63rem", color:q?(q.changePct>=0?theme.green:theme.red):theme.muted }}>
              {q ? `${q.changePct>=0?"+":""}${q.changePct?.toFixed(2) || '0.00'}%` : "—"}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              <button onClick={() => onSell(h)} style={{ padding:"5px 10px", ...glass(theme, 0.06, 10), border:`1px solid ${theme.red}35`, borderRadius:7, color:theme.red, fontFamily:theme.mono, fontSize:"0.55rem", letterSpacing:"0.08em", cursor:"pointer", transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background=`${theme.red}20`}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
              >Sell</button>
              <button onClick={() => window.confirm("Delete this holding?") && deleteHolding.mutateAsync(h.id)} disabled={deleteHolding.isPending}
                style={{ padding:"5px 8px", ...glass(theme, 0.04, 10), border:`1px solid ${theme.border}`, borderRadius:7, color:theme.muted, fontFamily:theme.mono, fontSize:"0.6rem", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=theme.red; e.currentTarget.style.color=theme.red }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.muted }}
              >
                {deleteHolding.isPending ? <Spinner size={11}/> : <Trash2 size={12} strokeWidth={1.5}/>}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Portfolio Page ────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { theme } = useTheme()
  const { userId } = useFinance()
  const { data: portfolioData, isLoading, error, refetch } = usePortfolioData(userId)
  const [mode, setMode] = useState(null)
  const [sellHolding, setSellHolding] = useState(null)
  const [activeTab, setActiveTab] = useState("holdings")
  const [selectedAssetClass, setSelectedAssetClass] = useState("all") // 👈 Add this
    const [showRebalance, setShowRebalance] = useState(false) // 👈 Add this
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768
  const isTablet = windowWidth > 768 && windowWidth <= 1024

  if (isLoading) return <PortfolioSkeleton/>

  if (error) return (
    <div style={{ ...glass(theme, 0.06, 20), border: `1px solid ${theme.red}40`, borderRadius: 16, padding: "40px", textAlign: "center", color: theme.red, fontFamily: theme.mono }}>
      <AlertTriangle size={28} strokeWidth={1.5} style={{ color: theme.red, display: 'block', margin: '0 auto 14px', opacity: 0.6 }}/>
      <div style={{ fontFamily: theme.mono, fontSize: '0.68rem', color: theme.red, marginBottom: 20 }}>
        Error loading portfolio: {error.message}
      </div>
      <button onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...glass(theme, 0.08, 12), border: `1px solid ${theme.accent}50`, borderRadius: 10, color: theme.accent, padding: '10px 22px', cursor: 'pointer', fontFamily: theme.mono, fontSize: '0.63rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        <RefreshCw size={13}/> Retry
      </button>
    </div>
  )

  const {
    portfolioValue = 0,
    portfolioCost  = 0,
    portfolioGain  = 0,
    realisedPnl    = 0,
    xirr           = null,
    trades         = [],
    quotesMap      = {},
  } = portfolioData || {}

  const gainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

  const handleSell = h => { setSellHolding(h); setMode("sell") }
  const closeForm  = () => { setMode(null); setSellHolding(null) }

  const kpis = [
    {
      label: "Unrealised P&L",
      value: inr(portfolioGain),
      color: portfolioGain >= 0 ? theme.green : theme.red,
      sub:   pct(gainPct),
      icon:  portfolioGain >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: "XIRR",
      value: xirr !== null ? pct(xirr) : "—",
      color: xirr === null ? theme.muted : xirr >= 0 ? theme.green : theme.red,
      sub:   "Annualized return",
      icon:  Activity,
    },
    
  ]

  // Extra KPIs for desktop
  if (!isMobile && !isTablet) {
    kpis.push(
      {
      label: "Total Trades",
      value: trades.length,
      color: theme.blue,
      sub:   `${trades.filter(t => ["sell", "switch_out"].includes(t.trade_type)).length} exits`,
      icon:  Repeat2,
    },
      {
        label: "Realised P&L",
        value: inr(realisedPnl),
        color: realisedPnl >= 0 ? theme.green : theme.red,
        sub:   "Booked gains/losses",
        icon:  realisedPnl >= 0 ? TrendingUp : TrendingDown,
      },
    )
  }

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: theme.sans, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideInPill { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

<PerformanceChart />


      {/* ── KPI row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(6,1fr)",
        gap: 12,
      }}>
        {kpis.slice(0, isMobile ? 4 : kpis.length).map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} style={{
              ...glass(theme, 0.05, 20),
              border: `1px solid ${theme.border}`,
              borderRadius: 16,
              padding: isMobile ? "16px" : "18px 20px",
              position: "relative",
              overflow: "hidden",
              boxShadow: gi(theme),
              animation: `fadeUp 0.4s ${i * 0.07}s both`,
            }}>
              <div style={shine}/>
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: `radial-gradient(circle,${k.color}18 0%,transparent 70%)`, pointerEvents: "none" }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 8 : 10 }}>
                <div style={{ fontFamily: theme.mono, fontSize: isMobile ? "0.48rem" : "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: theme.muted }}>
                  {k.label}
                </div>
                <div style={{ width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, ...glass(theme, 0.08, 10), border: `1px solid ${k.color}30`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                  <Icon size={isMobile ? 11 : 12} strokeWidth={1.8}/>
                </div>
              </div>
              <div style={{ fontFamily: theme.display, fontSize: isMobile ? "1.2rem" : "1.5rem", fontWeight: 700, color: theme.text, lineHeight: 1, marginBottom: isMobile ? 4 : 6, textShadow: `0 0 20px ${k.color}35` }}>
                {k.value}
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: isMobile ? "0.5rem" : "0.55rem", color: k.color }}>
                {k.sub}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <UnifiedPortfolioChart 
          selectedAsset={selectedAssetClass}
          onAssetChange={setSelectedAssetClass}
        />
{isMobile ? (
          <div style={{ 
            ...glass(theme, 0.04, 20), 
            border: `1px solid ${theme.border}`, 
            borderRadius: 16, 
            overflow: 'hidden',
          }}>
            {/* Header - always visible */}
            <div 
              onClick={() => setShowRebalance(!showRebalance)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                cursor: 'pointer',
                background: theme.bg3,
                borderBottom: showRebalance ? `1px solid ${theme.border}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={16} style={{ color: theme.accent }} />
                <span style={{ fontFamily: theme.mono, fontSize: '0.65rem', color: theme.accent }}>
                  Portfolio Rebalancing
                </span>
              </div>
              <ChevronDown 
                size={16} 
                style={{ 
                  color: theme.muted,
                  transform: showRebalance ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }} 
              />
            </div>

            {/* Collapsible content */}
            <div style={{
              maxHeight: showRebalance ? '800px' : '0',
              opacity: showRebalance ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
            }}>
              <RebalanceWidget />
            </div>
          </div>
        ) : (
          // Desktop - always expanded
          <RebalanceWidget />
        )}      </div>

      {/* ── Holdings / History ── */}
      <div style={{ ...glass(theme, 0.04, 20), border: `1px solid ${theme.border}`, borderRadius: 16, padding: isMobile ? "16px" : "24px", position: "relative", overflow: "hidden", boxShadow: gi(theme) }}>
        <div style={shine}/>

        {/* Toolbar */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : 0,
          marginBottom: 20,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, ...glass(theme, 0.05, 12), border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden", width: isMobile ? "100%" : "auto" }}>
            {[["holdings", "Holdings"], ["history", "Trade History"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: isMobile ? "10px 0" : "8px 20px",
                border: "none",
                borderRight: id === "holdings" ? `1px solid ${theme.border}` : "none",
                background: activeTab === id ? `${theme.accent}15` : "transparent",
                color: activeTab === id ? theme.accent : theme.muted,
                fontFamily: theme.mono,
                fontSize: "0.61rem",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                borderBottom: activeTab === id ? `1px solid ${theme.accent}` : "1px solid transparent",
                flex: isMobile ? 1 : "none",
                width: isMobile ? "50%" : "auto",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {[
              { label: mode === "buy"  ? "Cancel" : "Buy / SIP", color: theme.green, icon: mode === "buy"  ? X : ShoppingCart,    action: () => { setMode(mode === "buy"  ? null : "buy");  setSellHolding(null) } },
              { label: mode === "sell" ? "Cancel" : "Sell",       color: theme.red,   icon: mode === "sell" ? X : ArrowDownCircle, action: () => { setMode(mode === "sell" ? null : "sell"); setSellHolding(null) } },
            ].map(({ label, color, icon: Icon, action }) => (
              <button key={label} onClick={action} style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: isMobile ? "10px 0" : "8px 16px",
                ...glass(theme, 0.05, 12),
                border: `1px solid ${color}35`,
                borderRadius: 9,
                color,
                fontFamily: theme.mono,
                fontSize: "0.61rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                flex: isMobile ? 1 : "none",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.borderColor = color }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${color}35` }}
              >
                <Icon size={12} strokeWidth={2}/>
                {isMobile
                  ? (label === "Cancel" ? "Cancel" : label.includes("Buy") ? "Buy" : "Sell")
                  : label
                }
              </button>
            ))}
          </div>
        </div>

        {mode === "buy"  && <TradeForm mode="buy"  onDone={closeForm} />}
        {mode === "sell" && <TradeForm mode="sell" onDone={closeForm} prefilledHolding={sellHolding} />}
        
        {activeTab === "holdings" && (
          <HoldingsTable 
            onSell={handleSell} 
            selectedAsset={selectedAssetClass} // 👈 Pass the selected asset
          />
        )}
        
        {activeTab === "history"  && <TradeHistory />}
      </div>
    </div>
  )
}