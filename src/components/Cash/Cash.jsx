import { useState, useEffect, useRef } from "react"
import { useFinance } from "../../context/FinanceContext.jsx"
import { useCashAccounts, useAddCashAccount, useUpdateCashAccount, useDeleteCashAccount } from "../../hooks/useCashAccounts.js"
import { Spinner } from "../shared/ui.jsx"
import { inr, inrCompact, todayISO } from "../../lib/formatters.js"
import { useTheme } from '../../context/ThemeContext.jsx'
import {
  Landmark, Calendar, Percent, Plus, X, Edit, Trash2,
  Clock, RefreshCw, Banknote, PiggyBank, TrendingUp, Wallet,
  ChevronDown,
} from "lucide-react"

// ── Responsive CSS injected once ──────────────────────────────────────────────
const RESPONSIVE_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes gpulse { 0%,100%{opacity:.3} 50%{opacity:.7} }

  .cash-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .cash-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .cash-form-row-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  .cash-form-row-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  .cash-form-row-notes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 18px;
  }
  .cash-form-span2 { grid-column: span 2; }
  .cash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--theme-border, rgba(255,255,255,0.10));
  }
  .cash-filter-bar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .cash-detail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 14px 0;
    border-top: 1px solid var(--theme-border, rgba(255,255,255,0.10));
    border-bottom: 1px solid var(--theme-border, rgba(255,255,255,0.10));
    margin-bottom: 14px;
  }
  .card-actions { display: flex; gap: 4px; }

  /* Tablet: 768px – 1024px */
  @media (max-width: 1024px) {
    .cash-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .cash-card-grid { grid-template-columns: repeat(2, 1fr); }
    .cash-form-row-4 { grid-template-columns: repeat(2, 1fr); }
    .cash-form-row-notes { grid-template-columns: repeat(2, 1fr); }
    .cash-form-span2 { grid-column: span 2; }
  }

  /* Mobile: up to 767px */
  @media (max-width: 767px) {
    .cash-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .cash-card-grid { grid-template-columns: 1fr; }
    .cash-form-row-4 { grid-template-columns: 1fr; }
    .cash-form-row-2 { grid-template-columns: 1fr; }
    .cash-form-row-notes { grid-template-columns: 1fr; }
    .cash-form-span2 { grid-column: span 1; }
    .cash-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .cash-header-btn { width: 100%; justify-content: center; }
    .cash-filter-bar { gap: 5px; }
    .cash-detail-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Small mobile: up to 480px */
  @media (max-width: 480px) {
    .cash-kpi-grid { grid-template-columns: 1fr; }
  }
`

// ── Glass helpers ─────────────────────────────────────────────────────────────
const glass = (theme, o = 0.04, b = 20) => ({
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

// ── Account config ────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { value: "savings",    label: "Savings Account", icon: Banknote,   color: "#0EA5E9" },
  { value: "current",   label: "Current Account",  icon: Landmark,   color: "#60A5FA" },
  { value: "fd",        label: "Fixed Deposit",    icon: PiggyBank,  color: "#F59E0B" },
  { value: "rd",        label: "Recurring Dep.",   icon: TrendingUp, color: "#10B981" },
  { value: "cash",      label: "Physical Cash",    icon: Banknote,   color: "#34D399" },
  { value: "digital",   label: "Digital Wallet",   icon: Wallet,     color: "#8B5CF6" },
  { value: "investment",label: "Investment A/C",   icon: TrendingUp, color: "#2563EB" },
  { value: "expense",   label: "Expense Account",  icon: Wallet,     color: "#EC4899" },
  { value: "salary",    label: "Salary Account",   icon: Banknote,   color: "#A78BFA" },
]

const BANK_NAMES = [
  "HDFC Bank","ICICI Bank","Axis Bank","State Bank of India (SBI)","Kotak Mahindra Bank",
  "Bank of Baroda","Punjab National Bank (PNB)","Canara Bank","Union Bank of India",
  "Indian Bank","IDBI Bank","Yes Bank","IndusInd Bank","Federal Bank","IDFC FIRST Bank",
  "Bandhan Bank","South Indian Bank","Karur Vysya Bank","City Union Bank","RBL Bank",
  "Bank of India","Slice","Other",
].sort()

const BANK_LOGOS = {
  "HDFC Bank": "/HDFC.png", "IDFC FIRST Bank": "/IDFC.png",
  "Kotak Mahindra Bank": "/KOTAK.png", "Slice": "/SLICE.png",
  "Axis Bank": "/AXIS.png", "ICICI Bank": "/ICICI.png",
  "State Bank of India (SBI)": "/SBI.png", "Indian Bank": "/INDIANBANK.png",
}

const INTEREST_FREQUENCY = ["monthly","quarterly","half_yearly","yearly","maturity"]

const daysBetween = (s, e) => Math.ceil(Math.abs(new Date(e) - new Date(s)) / 86400000)
const calcProgress = (start, end) => {
  if (!start || !end) return 0
  const today = new Date(), s = new Date(start), e = new Date(end)
  if (today >= e) return 100
  if (today <= s) return 0
  return Math.min(100, Math.round((daysBetween(s, today) / daysBetween(s, e)) * 100))
}
const acctType = v => ACCOUNT_TYPES.find(t => t.value === v) || ACCOUNT_TYPES[0]

// ── Primitives ────────────────────────────────────────────────────────────────
const FL = ({ children, required }) => {
  const { theme } = useTheme()
  
  return (
    <div style={{ fontFamily: theme.mono, fontSize: "0.51rem", letterSpacing: "0.18em", textTransform: "uppercase", color: theme.muted, marginBottom: 5, display: "flex", alignItems: "center", gap: 3 }}>
      {children}{required && <span style={{ color: theme.red }}>*</span>}
    </div>
  )
}

const inputSt = (theme) => ({
  ...glass(theme, 0.05, 14),
  border: `1px solid ${theme.border}`, borderRadius: 9,
  color: theme.text, fontFamily: theme.mono, fontSize: "0.72rem",
  padding: "9px 12px", outline: "none", width: "100%",
  boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2)`,
})

const GInput = ({ value, onChange, type = "text", placeholder, min, step, readOnly, style = {} }) => {
  const { theme } = useTheme()
  
  return (
    <input
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      type={type} placeholder={placeholder} min={min} step={step} readOnly={readOnly}
      style={{ ...inputSt(theme), ...(readOnly ? { opacity: 0.6, cursor: "not-allowed", background: "rgba(0,0,0,0.25)" } : {}), ...style }}
      onFocus={e => { if (!readOnly) { e.target.style.borderColor = `${theme.accent}70`; e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px ${theme.accentDim}` } }}
      onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.2)` }}
    />
  )
}

const GSelect = ({ value, onChange, children }) => {
  const { theme } = useTheme()
  
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        ...inputSt(theme), cursor: "pointer", appearance: "none", WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7fa5' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
      }}
      onFocus={e => e.target.style.borderColor = `${theme.accent}70`}
      onBlur={e => e.target.style.borderColor = theme.border}
    >
      {children}
    </select>
  )
}

// ── Bank Logo ─────────────────────────────────────────────────────────────────
function BankLogo({ bankName, size = 40 }) {
  const { theme } = useTheme()
  const [err, setErr] = useState(false)
  const logo = BANK_LOGOS[bankName]
  
  if (!bankName || !logo || err) {
    return (
      <div style={{ width: size, height: size, ...glass(theme, 0.08, 10), border: `1px solid ${theme.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.mono, fontSize: "0.9rem", color: theme.accent, flexShrink: 0 }}>
        {bankName?.[0] || "B"}
      </div>
    )
  }
  return <img src={logo} alt={bankName} onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "cover", background: "white", borderRadius: "50%", flexShrink: 0 }} />
}

// ── Bank Select ───────────────────────────────────────────────────────────────
function BankSelect({ value, onChange }) {
  const { theme } = useTheme()
  const [search, setSearch] = useState("")
  const [show, setShow] = useState(false)
  const ref = useRef(null)
  const filtered = BANK_NAMES.filter(b => b.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={search || value}
          onChange={e => { setSearch(e.target.value); setShow(true); if (!BANK_NAMES.includes(e.target.value)) onChange(e.target.value) }}
          onFocus={() => setShow(true)}
          placeholder="Search bank name"
          style={{ ...inputSt(theme), flex: 1 }}
        />
        <button onClick={() => setShow(v => !v)} style={{ ...glass(theme, 0.06, 10), border: `1px solid ${theme.border}`, borderRadius: 9, color: theme.muted, padding: "0 12px", cursor: "pointer", flexShrink: 0 }}>
          <ChevronDown size={13} />
        </button>
      </div>
      {show && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, ...glass(theme, 0.12, 20), border: `1px solid ${theme.borderHi}`, borderRadius: 10, maxHeight: 200, overflowY: "auto", zIndex: 1000, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          {filtered.map(bank => (
            <button key={bank} onClick={() => { onChange(bank); setSearch(bank); setShow(false) }}
              style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, color: theme.text, textAlign: "left", cursor: "pointer", fontFamily: theme.mono, fontSize: "0.68rem", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {bank}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CashSkeleton() {
  const { theme } = useTheme()
  
  // Update CSS variables for skeleton
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .cash-kpi-grid .skeleton-item {
        border: 1px solid ${theme.border};
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [theme])

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ ...glass(theme, 0.04, 16), border: `1px solid ${theme.border}`, borderRadius: 14, height: 80, animation: "gpulse 1.8s infinite" }} />
      <div className="cash-kpi-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton-item" style={{ ...glass(theme, 0.04, 16), border: `1px solid ${theme.border}`, borderRadius: 14, height: 120, animation: `gpulse 1.8s ${i*0.15}s infinite` }} />)}
      </div>
      <div className="cash-card-grid">
        {[1,2,3].map(i => <div key={i} style={{ ...glass(theme, 0.04, 16), border: `1px solid ${theme.border}`, borderRadius: 16, height: 280, animation: `gpulse 1.8s ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  )
}

// ── Add / Edit Form ───────────────────────────────────────────────────────────
function AddCashAccountForm({ onDone, editAccount = null }) {
  const { theme } = useTheme()
  const { userId } = useFinance()
  const addCashAccount = useAddCashAccount(userId)
  const updateCashAccount = useUpdateCashAccount(userId)
  const isEdit = !!editAccount

  const [form, setForm] = useState({
    name: editAccount?.name || "", type: editAccount?.type || "savings",
    bank_name: editAccount?.bank_name || "", account_number: editAccount?.account_number || "",
    balance: editAccount?.balance || "", currency: editAccount?.currency || "INR",
    interest_rate: editAccount?.interest_rate || "", interest_frequency: editAccount?.interest_frequency || "yearly",
    opening_date: editAccount?.opening_date || todayISO(), maturity_date: editAccount?.maturity_date || "",
    maturity_amount: editAccount?.maturity_amount || "", deposit_amount: editAccount?.deposit_amount || "",
    deposit_frequency: editAccount?.deposit_frequency || "monthly", tenure_months: editAccount?.tenure_months || "",
    nominee: editAccount?.nominee || "", joint_holders: editAccount?.joint_holders || "", notes: editAccount?.notes || "",
  })
  const [err, setErr] = useState("")
  const [editing, setEditing] = useState({ tenure: false, maturity: false })

  const set = k => v => setForm(f => ({ ...f, [k]: v }))
  const isFD = form.type === "fd"
  const isRD = form.type === "rd"
  const isDep = isFD || isRD

  useEffect(() => {
    if (isDep && form.opening_date && form.tenure_months && editing.tenure) {
      const s = new Date(form.opening_date), m = parseFloat(form.tenure_months)
      if (!isNaN(m) && m > 0) {
        const d = new Date(s)
        d.setMonth(s.getMonth() + Math.floor(m))
        const rem = Math.round((m % 1) * 30.44)
        if (rem > 0) d.setDate(d.getDate() + rem)
        const iso = d.toISOString().split("T")[0]
        if (form.maturity_date !== iso) set("maturity_date")(iso)
      }
    }
  }, [form.opening_date, form.tenure_months, isDep, editing.tenure])

  useEffect(() => {
    if (isDep && form.opening_date && form.maturity_date && editing.maturity) {
      const months = (daysBetween(form.opening_date, form.maturity_date) / 30.44).toFixed(2)
      if (form.tenure_months !== months) set("tenure_months")(months)
    }
  }, [form.opening_date, form.maturity_date, isDep, editing.maturity])

  const submit = async () => {
    if (!form.name || !form.type) { setErr("Name and type are required"); return }
    if (!isDep && !form.balance) { setErr("Balance is required"); return }
    if (isDep && !form.deposit_amount) { setErr("Deposit amount is required"); return }
    setErr("")
    try {
      const data = {
        name: form.name, type: form.type, bank_name: form.bank_name, account_number: form.account_number,
        balance: Number(form.balance), current_value: isDep ? Number(form.deposit_amount) : null,
        maturity_amount: form.maturity_amount ? Number(form.maturity_amount) : null,
        currency: form.currency, interest_rate: form.interest_rate ? Number(form.interest_rate) : null,
        interest_frequency: form.interest_frequency, opening_date: form.opening_date || null,
        maturity_date: form.maturity_date || null, deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
        deposit_frequency: form.deposit_frequency, tenure_months: form.tenure_months ? Number(form.tenure_months) : null,
        nominee: form.nominee, joint_holders: form.joint_holders, notes: form.notes,
      }
      if (isEdit) await updateCashAccount.mutateAsync({ id: editAccount.id, updates: data })
      else await addCashAccount.mutateAsync(data)
      onDone()
    } catch (e) { setErr(e.message) }
  }

  const isPending = addCashAccount.isPending || updateCashAccount.isPending
  const at = acctType(form.type)
  const AccIcon = at.icon

  return (
    <div style={{ ...glass(theme, 0.06, 22), border: `1px solid ${at.color}30`, borderLeft: `2px solid ${at.color}`, borderRadius: 16, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden", boxShadow: `${gi(theme)}, 0 0 32px ${at.color}10`, animation: "fadeUp 0.3s ease" }}>
      <div style={shine} />
      <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle,${at.color}0c 0%,transparent 70%)`, pointerEvents: "none" }} />

      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AccIcon size={15} style={{ color: at.color }} strokeWidth={1.8} />
          <span style={{ fontFamily: theme.mono, fontSize: "0.57rem", letterSpacing: "0.20em", textTransform: "uppercase", color: at.color }}>
            {isEdit ? "Edit Cash Account" : "Add New Cash Account"}
          </span>
        </div>
        <button onClick={onDone}
          style={{ ...glass(theme, 0.05, 10), border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.muted, padding: "5px 7px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.red; e.currentTarget.style.borderColor = theme.red + "40" }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.border }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Row 1 — 4 cols → 2 cols on tablet → 1 col on mobile */}
      <div className="cash-form-row-4">
        <div><FL required>Account Name</FL><GInput value={form.name} onChange={set("name")} placeholder="e.g. HDFC Savings" /></div>
        <div>
          <FL required>Account Type</FL>
          <GSelect value={form.type} onChange={set("type")}>
            {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </GSelect>
        </div>
        <div><FL>Bank Name</FL><BankSelect value={form.bank_name} onChange={set("bank_name")} /></div>
        <div><FL>Account Number</FL><GInput value={form.account_number} onChange={set("account_number")} placeholder="Last 4 digits" /></div>
      </div>

      {/* Row 2 */}
      <div className="cash-form-row-4">
        {!isDep ? (
          <div><FL required>Current Balance (₹)</FL><GInput value={form.balance} onChange={set("balance")} type="number" min="0" step="0.01" placeholder="50000" /></div>
        ) : (
          <>
            <div><FL required>{isFD ? "Deposit Amount (₹)" : "Monthly Deposit (₹)"}</FL><GInput value={form.deposit_amount} onChange={set("deposit_amount")} type="number" min="0" step="0.01" placeholder={isFD ? "100000" : "5000"} /></div>
            <div><FL>Interest Rate (%)</FL><GInput value={form.interest_rate} onChange={set("interest_rate")} type="number" step="0.01" min="0" placeholder="7.5" /></div>
            <div><FL>Opening Date</FL><GInput value={form.opening_date} onChange={set("opening_date")} type="date" /></div>
            <div>
              <FL>Currency</FL>
              <GSelect value={form.currency} onChange={set("currency")}>
                {[["INR","INR (₹)"],["USD","USD ($)"],["EUR","EUR (€)"],["GBP","GBP (£)"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </GSelect>
            </div>
          </>
        )}
      </div>

      {/* Deposit-specific */}
      {isDep && (
        <>
          <div className="cash-form-row-4">
            <div>
              <FL>Tenure (Months)</FL>
              <GInput value={form.tenure_months} onChange={v => { setEditing({ tenure: true, maturity: false }); set("tenure_months")(v) }} type="number" step="0.01" min="0" placeholder="12" />
            </div>
            <div>
              <FL>Maturity Date</FL>
              <GInput value={form.maturity_date} onChange={v => { setEditing({ tenure: false, maturity: true }); set("maturity_date")(v) }} type="date" />
            </div>
            <div><FL>Maturity Amount (₹)</FL><GInput value={form.maturity_amount} onChange={set("maturity_amount")} type="number" step="0.01" placeholder="Auto-calc" /></div>
            <div>
              <FL>Interest Frequency</FL>
              <GSelect value={form.interest_frequency} onChange={set("interest_frequency")}>
                {INTEREST_FREQUENCY.map(f => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
              </GSelect>
            </div>
            {isRD && (
              <div>
                <FL>Deposit Frequency</FL>
                <GSelect value={form.deposit_frequency} onChange={set("deposit_frequency")}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </GSelect>
              </div>
            )}
          </div>

          {form.opening_date && form.maturity_date && (
            <div style={{ ...glass(theme, 0.05, 12), border: `1px solid ${theme.border}`, borderLeft: `2px solid ${theme.accent}`, borderRadius: 10, padding: "9px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontFamily: theme.mono, fontSize: "0.61rem", color: theme.muted, flexWrap: "wrap" }}>
              <Calendar size={12} style={{ color: theme.accent }} strokeWidth={1.5} />
              Tenure: <span style={{ color: theme.text }}>{daysBetween(form.opening_date, form.maturity_date)} days</span>
              <span style={{ color: theme.border }}>·</span>
              <span style={{ color: theme.text }}>{form.tenure_months} months</span>
            </div>
          )}
        </>
      )}

      {/* Notes row */}
      <div className="cash-form-row-notes">
        <div><FL>Nominee</FL><GInput value={form.nominee} onChange={set("nominee")} placeholder="Name" /></div>
        <div><FL>Joint Holders</FL><GInput value={form.joint_holders} onChange={set("joint_holders")} placeholder="Comma separated" /></div>
        <div className="cash-form-span2"><FL>Notes</FL><GInput value={form.notes} onChange={set("notes")} placeholder="Additional notes" /></div>
      </div>

      {err && (
        <div style={{ fontFamily: theme.mono, fontSize: "0.61rem", color: theme.red, padding: "8px 12px", ...glass(theme, 0.04, 10), border: `1px solid ${theme.red}30`, borderRadius: 9, marginBottom: 14, letterSpacing: "0.05em" }}>
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={submit} disabled={isPending}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, ...glass(theme, 0.08, 12), border: `1px solid ${at.color}50`, borderRadius: 9, color: at.color, padding: "10px 24px", cursor: isPending ? "not-allowed" : "pointer", fontFamily: theme.mono, fontSize: "0.63rem", letterSpacing: "0.16em", textTransform: "uppercase", opacity: isPending ? 0.6 : 1, transition: "all 0.2s", boxShadow: `0 0 16px ${at.color}18` }}
        >
          {isPending ? <Spinner size={12} /> : <><AccIcon size={13} strokeWidth={2} />{isEdit ? "Update Account" : "Add Account"}</>}
        </button>
        <button onClick={onDone}
          style={{ ...glass(theme, 0.03, 10), border: `1px solid ${theme.border}`, borderRadius: 9, color: theme.muted, padding: "10px 20px", cursor: "pointer", fontFamily: theme.mono, fontSize: "0.63rem", letterSpacing: "0.13em", textTransform: "uppercase", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.borderHi; e.currentTarget.style.color = theme.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete }) {
  const { theme } = useTheme()
  const [hov, setHov] = useState(false)
  const at = acctType(account.type)
  const AccIcon = at.icon
  const isDep = ["fd", "rd"].includes(account.type)
  const display = isDep ? account.current_value || account.deposit_amount || 0 : account.balance
  const progress = calcProgress(account.opening_date, account.maturity_date)

  const matStatus = () => {
    if (!account.maturity_date) return null
    const days = Math.ceil((new Date(account.maturity_date) - new Date()) / 86400000)
    if (days < 0) return { label: "Matured", color: theme.green }
    if (days < 30) return { label: `${days} days left`, color: theme.yellow }
    return { label: `${Math.floor(days / 30)}m ${days % 30}d left`, color: theme.muted }
  }
  const mat = matStatus()

  const estValue = isDep && account.maturity_amount && account.opening_date && account.maturity_date
    ? Math.round(account.deposit_amount + (account.maturity_amount - account.deposit_amount) * (progress / 100))
    : display

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...glass(theme, hov ? 0.08 : 0.04, 20), border: `1px solid ${hov ? at.color + "40" : theme.border}`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden", transition: "all 0.3s ease", boxShadow: hov ? `${gi(theme)}, 0 0 28px ${at.color}15` : gi(theme) }}
    >
      <div style={shine} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: at.color, opacity: hov ? 0.8 : 0.35, transition: "opacity 0.3s" }} />
      <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, background: `radial-gradient(circle,${at.color}12 0%,transparent 70%)`, pointerEvents: "none", opacity: hov ? 1 : 0.5, transition: "opacity 0.3s" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <BankLogo bankName={account.bank_name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: theme.sans, fontWeight: 500, fontSize: "0.88rem", color: theme.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: theme.mono, fontSize: "0.56rem", letterSpacing: "0.05em", background: `${at.color}18`, color: at.color, padding: "2px 8px", border: `1px solid ${at.color}28`, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <AccIcon size={8} strokeWidth={2} />{at.label}
              </span>
              {account.bank_name && <span style={{ fontFamily: theme.mono, fontSize: "0.55rem", color: theme.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.bank_name}</span>}
            </div>
          </div>
        </div>
        <div className="card-actions" style={{ flexShrink: 0, marginLeft: 8 }}>
          {[
            { icon: <Edit size={13} />, action: () => onEdit(account), hc: theme.accent },
            { icon: <Trash2 size={13} />, action: () => onDelete(account.id), hc: theme.red },
          ].map(({ icon, action, hc }, i) => (
            <button key={i} onClick={action}
              style={{ ...glass(theme, 0.04, 10), border: `1px solid transparent`, borderRadius: 8, padding: "6px 7px", cursor: "pointer", color: theme.muted, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}40`; e.currentTarget.style.background = `${hc}12` }}
              onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* Value */}
      <div style={{ marginBottom: 16 }}>
        <FL>{isDep ? "Current Value" : "Balance"}</FL>
        <div style={{ fontFamily: theme.display, fontSize: "2rem", fontWeight: 700, color: theme.text, lineHeight: 1, textShadow: `0 0 20px ${at.color}30` }}>
          {inrCompact(estValue)}
        </div>
        {account.currency !== "INR" && <span style={{ fontFamily: theme.mono, fontSize: "0.58rem", color: theme.muted, letterSpacing: "0.1em" }}>{account.currency}</span>}
        {isDep && account.maturity_amount > 0 && (
          <div style={{ fontFamily: theme.mono, fontSize: "0.57rem", color: theme.muted, marginTop: 5 }}>
            Maturity: <span style={{ color: theme.accentLt }}>{inrCompact(account.maturity_amount)}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isDep && account.opening_date && account.maturity_date && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: theme.mono, fontSize: "0.51rem", letterSpacing: "0.14em", textTransform: "uppercase", color: theme.muted }}>Progress to Maturity</span>
            <span style={{ fontFamily: theme.mono, fontSize: "0.57rem", color: progress >= 100 ? theme.green : at.color }}>{progress}%</span>
          </div>
          <div style={{ height: 3, ...glass(theme, 0.04, 8), border: `1px solid ${theme.border}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg,${at.color}90,${at.color})`, borderRadius: 4, transition: "width 0.6s ease", boxShadow: `0 0 8px ${at.color}60`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)", animation: "shimmer 2s infinite" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: theme.mono, fontSize: "0.49rem", color: theme.muted }}>{new Date(account.opening_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span style={{ fontFamily: theme.mono, fontSize: "0.49rem", color: theme.muted }}>{new Date(account.maturity_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="cash-detail-grid">
        {account.interest_rate > 0 && (
          <div>
            <FL><Percent size={9} /> Interest</FL>
            <div style={{ fontFamily: theme.display, fontSize: "1rem", color: theme.accentLt }}>{account.interest_rate}% p.a.</div>
          </div>
        )}
        {isDep && account.deposit_amount > 0 && (
          <div>
            <FL>{account.type === "fd" ? "Principal" : "Monthly Dep."}</FL>
            <div style={{ fontFamily: theme.display, fontSize: "1rem", color: theme.text }}>{inr(account.deposit_amount)}</div>
          </div>
        )}
        {account.maturity_date && (
          <div>
            <FL><Calendar size={9} /> Maturity</FL>
            <div style={{ fontFamily: theme.mono, fontSize: "0.68rem", color: mat?.color || theme.text }}>
              {new Date(account.maturity_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
        {account.account_number && (
          <div>
            <FL>A/C No.</FL>
            <div style={{ fontFamily: theme.mono, fontSize: "0.68rem", color: theme.text }}>••••{account.account_number.slice(-4)}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        {mat && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={11} style={{ color: mat.color }} strokeWidth={1.5} />
            <span style={{ fontFamily: theme.mono, fontSize: "0.59rem", color: mat.color, letterSpacing: "0.05em" }}>{mat.label}</span>
          </div>
        )}
        {account.nominee && <span style={{ fontFamily: theme.mono, fontSize: "0.56rem", color: theme.muted }}>Nominee: {account.nominee}</span>}
      </div>
    </div>
  )
}

// ── Summary KPIs ──────────────────────────────────────────────────────────────
function CashSummary({ accounts }) {
  const { theme } = useTheme()

  const total = accounts.reduce((s, a) => s + (["fd","rd"].includes(a.type) ? a.current_value || a.deposit_amount || 0 : a.balance), 0)
  const bankTotal = accounts.filter(a => ["savings","current"].includes(a.type)).reduce((s, a) => s + a.balance, 0)
  const fdTotal = accounts.filter(a => a.type === "fd").reduce((s, a) => s + (a.current_value || a.deposit_amount || 0), 0)
  const rdTotal = accounts.filter(a => a.type === "rd").reduce((s, a) => s + (a.current_value || a.deposit_amount || 0), 0)
  const soonMat = accounts.filter(a => { if (!a.maturity_date) return false; const d = daysBetween(new Date(), new Date(a.maturity_date)); return d > 0 && d <= 30 }).length

  const kpis = [
    { label: "Total Cash",      value: inrCompact(total),     color: theme.accent, sub: `${accounts.length} accounts`,                                                                                           icon: Wallet },
    { label: "Bank Accounts",   value: inrCompact(bankTotal), color: "#0EA5E9",    sub: `${accounts.filter(a => ["savings","current"].includes(a.type)).length} accounts`,                                       icon: Landmark },
    { label: "Fixed Deposits",  value: inrCompact(fdTotal),   color: theme.yellow, sub: `${accounts.filter(a => a.type === "fd").length} FDs`,                                                                   icon: PiggyBank },
    { label: "Recurring Dep.",  value: inrCompact(rdTotal),   color: theme.green,  sub: `${accounts.filter(a => a.type === "rd").length} RDs${soonMat ? ` · ${soonMat} maturing soon` : ""}`,                   icon: TrendingUp },
  ]

  return (
    <div className="cash-kpi-grid">
      {kpis.map((k, i) => {
        const Icon = k.icon
        return (
          <div key={i} style={{ ...glass(theme, 0.05, 20), border: `1px solid ${theme.border}`, borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden", boxShadow: gi(theme), animation: `fadeUp 0.4s ${i * 0.07}s both` }}>
            <div style={shine} />
            <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: `radial-gradient(circle,${k.color}18 0%,transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <FL>{k.label}</FL>
              <div style={{ width: 28, height: 28, ...glass(theme, 0.08, 10), border: `1px solid ${k.color}30`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, flexShrink: 0 }}>
                <Icon size={13} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{ fontFamily: theme.display, fontSize: "1.85rem", fontWeight: 700, color: theme.text, lineHeight: 1, marginBottom: 6, textShadow: `0 0 20px ${k.color}30` }}>{k.value}</div>
            <div style={{ fontFamily: theme.mono, fontSize: "0.58rem", color: k.color }}>{k.sub}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Cash() {
  const { theme } = useTheme()
  const { userId } = useFinance()
  const { data: cashAccounts = [], isLoading, error, refetch } = useCashAccounts(userId)
  const deleteCashAccount = useDeleteCashAccount(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [filterType, setFilterType] = useState("all")

  // Update CSS variables when theme changes
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .cash-header {
        border-bottom: 1px solid ${theme.border};
      }
      .cash-detail-grid {
        border-top: 1px solid ${theme.border};
        border-bottom: 1px solid ${theme.border};
      }
    `
    style.id = 'cash-dynamic-styles'
    const oldStyle = document.getElementById('cash-dynamic-styles')
    if (oldStyle) oldStyle.remove()
    document.head.appendChild(style)
    
    return () => style.remove()
  }, [theme])

  const filtered = cashAccounts.filter(a => filterType === "all" || a.type === filterType)
  const handleEdit = a => { setEditingAccount(a); setShowForm(true) }
  const handleDelete = async id => { if (window.confirm("Delete this account?")) { try { await deleteCashAccount.mutateAsync(id) } catch (e) { console.error(e) } } }
  const handleClose = () => { setShowForm(false); setEditingAccount(null) }

  if (isLoading) return <CashSkeleton />
  if (error) return (
    <div style={{ ...glass(theme, 0.06, 20), border: `1px solid ${theme.red}40`, borderRadius: 16, padding: "40px", textAlign: "center", color: theme.red, fontFamily: theme.mono }}>
      Error loading cash accounts: {error.message}
      <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px auto 0", padding: "9px 20px", ...glass(theme, 0.08, 12), border: `1px solid ${theme.red}40`, borderRadius: 10, color: theme.red, fontFamily: theme.mono, fontSize: 12, cursor: "pointer" }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  )

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: theme.sans }}>
      <style>{RESPONSIVE_CSS}</style>

      {/* Header */}
      <div className="cash-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Landmark size={12} style={{ color: theme.accent }} strokeWidth={2} />
            <span style={{ fontFamily: theme.mono, fontSize: "0.57rem", letterSpacing: "0.22em", textTransform: "uppercase", color: theme.accent }}>PortaFi</span>
          </div>
          <h1 style={{ fontFamily: theme.display, fontSize: "2rem", fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1 }}>Cash Management</h1>
          <p style={{ fontFamily: theme.mono, fontSize: "0.58rem", color: theme.muted, marginTop: 6, letterSpacing: "0.10em" }}>Bank accounts · Fixed deposits · Recurring deposits</p>
        </div>
        <button
          className="cash-header-btn"
          onClick={() => { setShowForm(v => !v); if (showForm) setEditingAccount(null) }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...glass(theme, showForm ? 0.04 : 0.08, 14), border: `1px solid ${showForm ? theme.border : theme.accent + "60"}`, borderRadius: 10, color: showForm ? theme.muted : theme.accent, padding: "10px 22px", cursor: "pointer", fontFamily: theme.mono, fontSize: "0.63rem", letterSpacing: "0.16em", textTransform: "uppercase", transition: "all 0.25s", boxShadow: showForm ? "none" : `0 0 20px ${theme.accentGlow}` }}
        >
          {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Account</>}
        </button>
      </div>

      {/* KPIs */}
      <CashSummary accounts={cashAccounts} />

      {/* Form */}
      {showForm && <AddCashAccountForm onDone={handleClose} editAccount={editingAccount} />}

      {/* Filter bar */}
      <div className="cash-filter-bar">
        {[{ value: "all", label: "All", color: theme.text, icon: null }, ...ACCOUNT_TYPES].map(t => {
          const count = t.value === "all" ? cashAccounts.length : cashAccounts.filter(a => a.type === t.value).length
          if (t.value !== "all" && count === 0) return null
          const active = filterType === t.value
          const Icon = t.icon
          return (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", ...glass(theme, active ? 0.08 : 0.04, 12), border: `1px solid ${active ? (t.color || theme.accent) + "60" : theme.border}`, borderRadius: 9, color: active ? (t.color || theme.accent) : theme.muted, fontFamily: theme.mono, fontSize: "0.59rem", letterSpacing: "0.09em", cursor: "pointer", transition: "all 0.2s", boxShadow: active ? `0 0 12px ${(t.color || theme.accent)}25` : "none" }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = theme.borderHi; e.currentTarget.style.color = theme.text } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted } }}
            >
              {Icon && <Icon size={10} strokeWidth={2} />}
              {t.value === "all" ? `All (${count})` : `${t.label} (${count})`}
            </button>
          )
        })}
      </div>

      {/* Card grid — 3 cols desktop, 2 tablet, 1 mobile */}
      {filtered.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", fontFamily: theme.mono, fontSize: "0.7rem", color: theme.muted, letterSpacing: "0.10em", opacity: 0.5 }}>
          No accounts found. Add your first bank account, FD, or RD above.
        </div>
      ) : (
        <div className="cash-card-grid">
          {filtered.map(a => <AccountCard key={a.id} account={a} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}