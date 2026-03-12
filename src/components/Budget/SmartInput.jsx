// src/components/budget/SmartInput.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme }    from '../../context/ThemeContext.jsx'
import { useFinance }  from '../../context/FinanceContext.jsx'
import { useCashAccounts } from '../../hooks/useCashAccounts'
import { useAddTransaction } from '../../hooks/useTransactions'
import { parseTransaction }  from '../../lib/parseTransaction'
import { todayISO, inr }     from '../../lib/formatters'
import {
  Sparkles, Check, X, AlertTriangle, ChevronDown,
  ArrowUpCircle, ArrowDownCircle, Edit3, Loader, ArrowUp,
} from 'lucide-react'

// ─── Glass helpers (local — same pattern as rest of app) ──────────────────
const makeGlass = (isDark, o = 0.05, b = 18) => ({
  background:           isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.7})`,
  backdropFilter:       `blur(${b}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(160%)`,
})
const makeShine = (isDark) => ({
  position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
  background: isDark
    ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)'
    : 'linear-gradient(90deg,transparent,rgba(0,0,0,0.05),transparent)',
  pointerEvents: 'none',
})
const makeInset = (isDark) => isDark
  ? `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
  : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.04)`

// ─── Category config (mirrors Budget.jsx) ─────────────────────────────────
const EXPENSE_CATS = [
  'Food & Dining','Shopping','Transport','Entertainment',
  'Bills & Utilities','Healthcare','Housing','Education',
  'Travel','Insurance','Investments','Personal Care',
  'Gifts','Electronics','Other',
]
const INCOME_CATS = [
  'Salary','Allowance','Freelance','Business',
  'Investment Returns','Rental Income','Gift','Bonus',
  'Cash Back','Other Income',
]

// ─── Animated placeholder cycling ─────────────────────────────────────────
const PLACEHOLDERS = [
  'zomato 450 lunch today',
  'salary credited 85000',
  'uber 340 yesterday',
  'paid electricity bill 1200',
  'amazon 2300 earphones',
  'petrol 2000 last friday',
  'netflix subscription 649',
  'received freelance payment 15000',
]

function useCyclingPlaceholder() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])
  return PLACEHOLDERS[idx]
}

// ─── Mini field label ──────────────────────────────────────────────────────
function FL({ children, theme }) {
  return (
    <div style={{
      fontFamily: theme.mono, fontSize: '0.50rem', letterSpacing: '0.16em',
      textTransform: 'uppercase', color: theme.muted, marginBottom: 5,
    }}>
      {children}
    </div>
  )
}

// ─── Glass input ───────────────────────────────────────────────────────────
function GInput({ value, onChange, type = 'text', placeholder, theme, isDark, highlight }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '8px 10px',
        ...makeGlass(isDark, 0.05, 12),
        border: `1px solid ${highlight ? '#f59e0b' : theme.border}`,
        borderRadius: 9, color: theme.text,
        fontFamily: theme.mono, fontSize: '0.72rem',
        outline: 'none', transition: 'border-color 0.2s',
        boxShadow: highlight ? `0 0 0 2px #f59e0b20` : 'none',
      }}
      onFocus={e => { if (!highlight) e.target.style.borderColor = theme.borderHi }}
      onBlur={e =>  { if (!highlight) e.target.style.borderColor = theme.border   }}
    />
  )
}

// ─── Category dropdown ─────────────────────────────────────────────────────
function CatDropdown({ value, onChange, type, theme, isDark, highlight }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px',
          ...makeGlass(isDark, 0.05, 12),
          border: `1px solid ${highlight ? '#f59e0b' : open ? theme.borderHi : theme.border}`,
          borderRadius: 9, color: value ? theme.text : theme.muted,
          fontFamily: theme.mono, fontSize: '0.72rem', cursor: 'pointer',
          outline: 'none', transition: 'border-color 0.2s',
          boxShadow: highlight ? `0 0 0 2px #f59e0b20` : 'none',
        }}
      >
        <span>{value || 'Pick a category…'}</span>
        <ChevronDown size={11} style={{ color: theme.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          ...makeGlass(isDark, 0.14, 22),
          border: `1px solid ${theme.borderHi}`,
          borderRadius: 11, zIndex: 200,
          maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}>
          {cats.map((cat, i) => (
            <button key={cat} onClick={() => { onChange(cat); setOpen(false) }}
              style={{
                width: '100%', padding: '9px 12px',
                background: value === cat ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                border: 'none', borderBottom: i < cats.length - 1 ? `1px solid ${theme.border}` : 'none',
                color: value === cat ? theme.accent : theme.text,
                fontFamily: theme.mono, fontSize: '0.63rem',
                textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (value !== cat) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              onMouseLeave={e => { if (value !== cat) e.currentTarget.style.background = 'transparent' }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Account dropdown ──────────────────────────────────────────────────────
function AccountDropdown({ accounts, value, onChange, theme, isDark }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = accounts.find(a => a.id === value)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px',
          ...makeGlass(isDark, 0.05, 12),
          border: `1px solid ${open ? theme.borderHi : theme.border}`,
          borderRadius: 9, color: selected ? theme.text : theme.muted,
          fontFamily: theme.mono, fontSize: '0.72rem', cursor: 'pointer',
        }}
      >
        <span>{selected ? selected.name : 'Select account…'}</span>
        <ChevronDown size={11} style={{ color: theme.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          ...makeGlass(isDark, 0.14, 22),
          border: `1px solid ${theme.borderHi}`,
          borderRadius: 11, zIndex: 200,
          maxHeight: 200, overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}>
          {accounts.map((acc, i) => (
            <button key={acc.id} onClick={() => { onChange(acc.id); setOpen(false) }}
              style={{
                width: '100%', padding: '9px 12px',
                background: value === acc.id ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                border: 'none', borderBottom: i < accounts.length - 1 ? `1px solid ${theme.border}` : 'none',
                color: value === acc.id ? theme.accent : theme.text,
                fontFamily: theme.mono, fontSize: '0.63rem', textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (value !== acc.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              onMouseLeave={e => { if (value !== acc.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ color: theme.text, marginBottom: 1 }}>{acc.name}</div>
              <div style={{ fontSize: '0.52rem', color: theme.muted }}>{acc.type}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Confidence bar ────────────────────────────────────────────────────────
function ConfidenceBar({ confidence, theme, isDark }) {
  const color = confidence >= 0.8 ? theme.green : confidence >= 0.5 ? theme.yellow : theme.red
  const label = confidence >= 0.8 ? 'High confidence' : confidence >= 0.5 ? 'Review suggested' : 'Please check'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 3, borderRadius: 999,
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${confidence * 100}%`, height: '100%',
          borderRadius: 999, background: color,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${color}60`,
        }}/>
      </div>
      <span style={{ fontFamily: theme.mono, fontSize: '0.50rem', color, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main SmartInput component ─────────────────────────────────────────────
export default function SmartInput({ onSuccess }) {
  const { theme, isDark }  = useTheme()
  const { userId }         = useFinance()
  const { data: accounts = [] } = useCashAccounts(userId)
  const addTransaction     = useAddTransaction(userId)

  const placeholder  = useCyclingPlaceholder()
  const inputRef     = useRef(null)
  const gi           = makeInset(isDark)

  // ── State ──────────────────────────────────────────────────────────────
  const [raw,       setRaw]       = useState('')
  const [parsed,    setParsed]    = useState(null)   // result from parseTransaction
  const [editing,   setEditing]   = useState(false)  // expanded edit form
  const [editForm,  setEditForm]  = useState(null)   // editable copy of parsed
  const [submitted, setSubmitted] = useState(false)  // success state
  const [saving,    setSaving]    = useState(false)
  const [saveErr,   setSaveErr]   = useState('')

  // ── Parse on input change (debounced 400ms) ────────────────────────────
  const debounceRef = useRef(null)

  const handleInput = (val) => {
    setRaw(val)
    setParsed(null)
    setEditing(false)
    setSaveErr('')
    setSubmitted(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) return

    debounceRef.current = setTimeout(() => {
      // Phase 1 — use first account as default
      const defaultAccountId = accounts[0]?.id ?? null
      const result = parseTransaction(val.trim(), todayISO(), defaultAccountId)
      if (result) {
        setParsed(result)
        setEditForm({ ...result })
      }
    }, 400)
  }

  // ── Set form field ─────────────────────────────────────────────────────
  const setField = (key, val) => setEditForm(f => ({ ...f, [key]: val }))

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const form = editForm || parsed
    if (!form) return

    if (!form.amount || form.amount <= 0) { setSaveErr('Amount is required'); return }
    if (!form.category) { setSaveErr('Category is required'); return }
    if (!form.account_id) { setSaveErr('Account is required'); return }
    if (!form.description) { setSaveErr('Description is required'); return }

    setSaving(true)
    setSaveErr('')
    try {
      const amount = form.type === 'income'
        ? Math.abs(form.amount)
        : -Math.abs(form.amount)

      await addTransaction.mutateAsync({
        date:        form.date,
        description: form.description,
        amount,
        category:    form.category,
        account_id:  form.account_id,
      })

      setSubmitted(true)
      setTimeout(() => {
        setRaw('')
        setParsed(null)
        setEditing(false)
        setEditForm(null)
        setSubmitted(false)
        if (onSuccess) onSuccess()
      }, 1200)
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Dismiss card ───────────────────────────────────────────────────────
  const dismiss = () => {
    setParsed(null)
    setEditing(false)
    setEditForm(null)
    setSaveErr('')
    setRaw('')
    inputRef.current?.focus()
  }

  const accentC = editForm?.type === 'income' ? theme.green : theme.red
  const missingFields = editForm ? [
    !editForm.amount    && 'amount',
    !editForm.category  && 'category',
    !editForm.account_id && 'account',
  ].filter(Boolean) : []

  return (
    <div style={{ fontFamily: theme.sans }}>
      <style>{`
        @keyframes cardIn   { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes successPop { 0%{transform:scale(0.9);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── Smart Input Box ── */}
      <div style={{
        position: 'relative',
        ...makeGlass(isDark, 0.06, 22),
        border: `1px solid ${parsed ? accentC + '50' : theme.border}`,
        borderRadius: 14,
        padding: '4px 6px 4px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: parsed
          ? `${gi}, 0 0 24px ${accentC}15`
          : gi,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div style={makeShine(isDark)}/>

        {/* Sparkles icon */}
        <Sparkles
          size={15}
          strokeWidth={1.6}
          style={{
            flexShrink: 0,
            color: raw ? accentC : theme.muted,
            filter: raw ? `drop-shadow(0 0 6px ${accentC}70)` : 'none',
            transition: 'all 0.3s',
          }}
        />

        <input
          ref={inputRef}
          value={raw}
          onChange={e => handleInput(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: theme.text, fontFamily: theme.mono, fontSize: '0.82rem',
            outline: 'none', padding: '10px 0',
            letterSpacing: '0.02em',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && parsed && !editing) handleConfirm()
            if (e.key === 'Escape') dismiss()
          }}
        />

        {/* Clear + Send buttons */}
        {raw && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Clear */}
            <button onClick={dismiss} style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...makeGlass(isDark, 0.06, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 8, color: theme.muted, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.borderHi; e.currentTarget.style.color = theme.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border;   e.currentTarget.style.color = theme.muted }}
            >
              <X size={12}/>
            </button>

            {/* Send */}
            <button
              onClick={() => parsed && !missingFields.length && handleConfirm()}
              disabled={!parsed || missingFields.length > 0 || saving}
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 9,
                background: parsed && !missingFields.length
                  ? accentC
                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: `1px solid ${parsed && !missingFields.length ? accentC : theme.border}`,
                color: parsed && !missingFields.length ? '#fff' : theme.muted,
                cursor: parsed && !missingFields.length && !saving ? 'pointer' : 'not-allowed',
                boxShadow: parsed && !missingFields.length ? `0 0 14px ${accentC}50` : 'none',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (parsed && !missingFields.length && !saving) e.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {saving
                ? <Loader size={13} style={{ animation: 'spin 1s linear infinite', color: '#fff' }}/>
                : <ArrowUp size={14} strokeWidth={2.5}/>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Confirmation Card ── */}
      {parsed && !submitted && (
        <div style={{
          marginTop: 10,
          ...makeGlass(isDark, 0.05, 22),
          border: `1px solid ${accentC}35`,
          borderLeft: `2px solid ${accentC}`,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `${gi}, 0 0 28px ${accentC}10`,
          animation: 'cardIn 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={makeShine(isDark)}/>
          {/* Ambient glow */}
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:`radial-gradient(circle,${accentC}0c 0%,transparent 70%)`, pointerEvents:'none' }}/>

          {/* ── Card header ── */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              {/* Type + amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {editForm?.type === 'income'
                  ? <ArrowUpCircle size={14} style={{ color: theme.green }} strokeWidth={2}/>
                  : <ArrowDownCircle size={14} style={{ color: theme.red }} strokeWidth={2}/>
                }
                <span style={{ fontFamily: theme.display, fontSize: '1.5rem', fontWeight: 700, color: accentC, lineHeight: 1 }}>
                  {editForm?.amount ? inr(editForm.amount) : <span style={{ color: theme.muted, fontSize: '1rem' }}>Amount?</span>}
                </span>
              </div>

              {/* Description + category + date */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                {editForm?.category && (
                  <span style={{
                    fontFamily: theme.mono, fontSize: '0.56rem', letterSpacing: '0.08em',
                    padding: '2px 8px', borderRadius: 999,
                    background: `${accentC}18`, border: `1px solid ${accentC}30`, color: accentC,
                  }}>
                    {editForm.category}
                  </span>
                )}
                {editForm?.description && (
                  <span style={{ fontFamily: theme.mono, fontSize: '0.62rem', color: theme.text }}>
                    {editForm.description}
                  </span>
                )}
                <span style={{ fontFamily: theme.mono, fontSize: '0.56rem', color: theme.muted }}>
                  {editForm?.date === todayISO() ? 'Today' : editForm?.date}
                </span>
                {editForm?.account_id && accounts.length > 0 && (
                  <span style={{ fontFamily: theme.mono, fontSize: '0.56rem', color: theme.muted }}>
                    · {accounts.find(a => a.id === editForm.account_id)?.name ?? 'Account'}
                  </span>
                )}
              </div>

              {/* Confidence bar */}
              <div style={{ marginTop: 10 }}>
                <ConfidenceBar confidence={parsed.confidence} theme={theme} isDark={isDark}/>
              </div>
            </div>

            {/* Close */}
            <button onClick={dismiss} style={{
              flexShrink: 0, width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...makeGlass(isDark, 0.06, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 7, color: theme.muted, cursor: 'pointer',
            }}>
              <X size={12}/>
            </button>
          </div>

          {/* ── Warnings ── */}
          {(parsed.warnings.length > 0 || missingFields.length > 0) && (
            <div style={{
              padding: '8px 16px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'flex-start', gap: 7,
            }}>
              <AlertTriangle size={11} style={{ color: theme.yellow, flexShrink: 0, marginTop: 1 }}/>
              <div style={{ fontFamily: theme.mono, fontSize: '0.55rem', color: theme.yellow, lineHeight: 1.6 }}>
                {parsed.warnings.join(' · ')}
              </div>
            </div>
          )}

          {/* ── Expanded edit form ── */}
          {editing && editForm && (
            <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}` }}>

              {/* Type toggle */}
              <div style={{ display: 'flex', ...makeGlass(isDark, 0.05, 12), border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                {[['expense','Expense',theme.red],['income','Income',theme.green]].map(([t, lbl, c]) => (
                  <button key={t} onClick={() => { setField('type', t); setField('category', '') }}
                    style={{
                      flex: 1, padding: '8px 12px', border: 'none',
                      background: editForm.type === t ? `${c}18` : 'transparent',
                      color: editForm.type === t ? c : theme.muted,
                      fontFamily: theme.mono, fontSize: '0.59rem', letterSpacing: '0.12em',
                      textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                      borderBottom: editForm.type === t ? `2px solid ${c}` : '2px solid transparent',
                      borderRight: t === 'expense' ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Row 1 — Description + Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <FL theme={theme}>Description</FL>
                  <GInput
                    value={editForm.description} onChange={v => setField('description', v)}
                    placeholder="What was this?" theme={theme} isDark={isDark}
                  />
                </div>
                <div>
                  <FL theme={theme}>Amount (₹)</FL>
                  <GInput
                    value={editForm.amount ?? ''} onChange={v => setField('amount', v)}
                    type="number" placeholder="0.00" theme={theme} isDark={isDark}
                    highlight={!editForm.amount}
                  />
                </div>
              </div>

              {/* Row 2 — Category + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <FL theme={theme}>Category</FL>
                  <CatDropdown
                    value={editForm.category} onChange={v => setField('category', v)}
                    type={editForm.type} theme={theme} isDark={isDark}
                    highlight={!editForm.category}
                  />
                </div>
                <div>
                  <FL theme={theme}>Date</FL>
                  <GInput
                    value={editForm.date} onChange={v => setField('date', v)}
                    type="date" theme={theme} isDark={isDark}
                  />
                </div>
              </div>

              {/* Row 3 — Account */}
              <div>
                <FL theme={theme}>Account</FL>
                <AccountDropdown
                  accounts={accounts} value={editForm.account_id}
                  onChange={v => setField('account_id', v)}
                  theme={theme} isDark={isDark}
                />
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {saveErr && (
            <div style={{
              padding: '8px 16px',
              borderBottom: `1px solid ${theme.border}`,
              fontFamily: theme.mono, fontSize: '0.59rem', color: theme.red,
            }}>
              {saveErr}
            </div>
          )}

          {/* ── Action row ── */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Edit toggle */}
            <button
              onClick={() => setEditing(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                ...makeGlass(isDark, 0.05, 10),
                border: `1px solid ${editing ? theme.borderHi : theme.border}`,
                borderRadius: 9, color: editing ? theme.text : theme.muted,
                fontFamily: theme.mono, fontSize: '0.59rem', letterSpacing: '0.10em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.borderHi; e.currentTarget.style.color = theme.text }}
              onMouseLeave={e => { if (!editing) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted } }}
            >
              <Edit3 size={11}/> {editing ? 'Close' : 'Edit'}
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }}/>

            {/* Hint */}
            {!editing && (
              <span style={{ fontFamily: theme.mono, fontSize: '0.50rem', color: theme.muted }}>
                Enter ↵ to confirm
              </span>
            )}

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={saving || missingFields.length > 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px',
                ...makeGlass(isDark, 0.08, 12),
                border: `1px solid ${accentC}${missingFields.length ? '30' : '60'}`,
                borderRadius: 9, color: missingFields.length ? theme.muted : accentC,
                fontFamily: theme.mono, fontSize: '0.62rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', cursor: missingFields.length || saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
                boxShadow: !missingFields.length ? `0 0 16px ${accentC}18` : 'none',
              }}
              onMouseEnter={e => { if (!missingFields.length && !saving) e.currentTarget.style.boxShadow = `0 0 24px ${accentC}35` }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = !missingFields.length ? `0 0 16px ${accentC}18` : 'none'}
            >
              {saving
                ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }}/> Saving…</>
                : <><Check size={12}/> Add {editForm?.type === 'income' ? 'Income' : 'Expense'}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Success state ── */}
      {submitted && (
        <div style={{
          marginTop: 10, padding: '16px',
          ...makeGlass(isDark, 0.06, 16),
          border: `1px solid ${theme.green}40`,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          animation: 'successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${theme.green}20`, border: `1px solid ${theme.green}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={14} style={{ color: theme.green }}/>
          </div>
          <span style={{ fontFamily: theme.mono, fontSize: '0.65rem', color: theme.green }}>
            Transaction added!
          </span>
        </div>
      )}
    </div>
  )
}