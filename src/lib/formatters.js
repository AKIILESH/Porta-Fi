// ── INR Formatters ────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees (₹)
 * Uses en-IN locale for proper lakh/crore formatting
 */
export const inr = (n, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n ?? 0)

/**
 * Compact format: ₹1.2L, ₹3.5Cr
 */
export const inrCompact = (n) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  return inr(n)
}

/**
 * Format percentage with +/- sign
 */
export const pct = (n) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`

/**
 * Color based on positive/negative value
 */
export const gainColor = (n, theme) => (n >= 0 ? theme.accent : theme.red)

/**
 * Format date to Indian format DD/MM/YYYY
 */
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Today's date as YYYY-MM-DD
 */
export const todayISO = () => new Date().toISOString().split('T')[0]

/**
 * Current month as YYYY-MM
 */
export const currentMonth = () => new Date().toISOString().slice(0, 7)
