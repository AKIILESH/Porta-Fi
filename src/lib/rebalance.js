// src/lib/rebalance.js
// Pure functions — no UI, no Supabase, no side effects

// ─── Bucket definitions ────────────────────────────────────────────────────

export const REBALANCE_BUCKETS = {
  equity: {
    label:       'Equity',
    description: 'Stocks, domestic ETFs, equity mutual funds',
    color:       '#2563EB',
    icon:        'TrendingUp',
  },
  international: {
    label:       'International',
    description: 'US stocks, international ETFs, global funds',
    color:       '#0EA5E9',
    icon:        'Globe',
  },
  debt: {
    label:       'Debt',
    description: 'Debt funds, liquid funds, gilt, bonds',
    color:       '#10B981',
    icon:        'Shield',
  },
  commodities: {
    label:       'Commodities',
    description: 'Gold, silver, commodity funds',
    color:       '#F59E0B',
    icon:        'Coins',
  },
  real_estate: {
    label:       'Real Estate',
    description: 'REITs, InvITs',
    color:       '#EC4899',
    icon:        'Building2',
  },
  crypto: {
    label:       'Crypto',
    description: 'Bitcoin, Ethereum, altcoins, stablecoins',
    color:       '#F97316',
    icon:        'Zap',
  },
}

// ─── Lookup sets ───────────────────────────────────────────────────────────

const DEBT_SUBS = new Set([
  'gilt', 'debt', 'liquid', 'overnight', 'ultra_short', 'short_duration',
  'medium_duration', 'long_duration', 'money_market', 'credit_risk',
  'banking_psu', 'corporate_bond', 'dynamic_bond', 'floater',
])

const HYBRID_SUBS = new Set([
  'hybrid', 'balanced_advantage', 'aggressive_hybrid',
  'conservative_hybrid', 'arbitrage', 'multi_asset',
])

const INTL_SUBS = new Set([
  'international', 'global', 'overseas', 'fund_of_fund_intl',
])

const COMMODITY_SUBS = new Set([
  'gold', 'silver', 'commodity', 'gold_fund_of_fund', 'silver_etf',
])

// ─── Core mapping ──────────────────────────────────────────────────────────

/**
 * Maps a holding to one of the 6 rebalance buckets.
 * Covers every asset_class + sub_category combo in the DB.
 */
export function getBucket(holding) {
  const ac  = holding.asset_class
  const sub = (holding.sub_category ?? '').toLowerCase()

  // Crypto (including stablecoins — treat all as speculative)
  if (ac === 'crypto')                          return 'crypto'

  // Hard commodity asset classes
  if (ac === 'gold' || ac === 'silver')         return 'commodities'

  // Real estate
  if (ac === 'reit' || ac === 'invit')          return 'real_estate'

  // US / foreign equity
  if (ac === 'us_equity')                       return 'international'

  // Direct domestic equity
  if (ac === 'equity')                          return 'equity'

  // Debt by asset class
  if (ac === 'debt_fund' || ac === 'liquid_fund') return 'debt'

  // ETF — disambiguate by sub_category
  if (ac === 'etf') {
    if (INTL_SUBS.has(sub))      return 'international'
    if (COMMODITY_SUBS.has(sub)) return 'commodities'
    return 'equity' // sectoral, broad, index, thematic → domestic equity
  }

  // Mutual fund — needs sub_category
  if (ac === 'mutual_fund') {
    if (DEBT_SUBS.has(sub))      return 'debt'
    if (HYBRID_SUBS.has(sub))    return 'equity' // hybrid → equity (simpler)
    if (INTL_SUBS.has(sub))      return 'international'
    if (COMMODITY_SUBS.has(sub)) return 'commodities'
    return 'equity' // large_cap, mid_cap, small_cap, flexi_cap, elss, index
  }

  // Convenience aliases some apps store as separate asset_class
  if (ac === 'index_fund' || ac === 'elss') return 'equity'

  return 'equity' // safe fallback
}

// ─── Current allocation ────────────────────────────────────────────────────

/**
 * Given an array of holdings (each with .quantity, .avg_cost, .asset_class,
 * .sub_category, and a resolved currentValueINR), returns:
 *   {
 *     byBucket:   { equity: 4982, debt: 636, ... }
 *     total:      10342
 *     buckets:    ['equity', 'debt', ...]   ← only buckets user holds
 *   }
 *
 * Holdings must already have currentValueINR computed (by usePortfolioData).
 */
export function computeCurrentAllocation(holdings) {
  const byBucket = {}

  for (const h of holdings) {
    const bucket = getBucket(h)
    const value  = Number(h.currentValueINR ?? h.quantity * h.avg_cost)
    byBucket[bucket] = (byBucket[bucket] ?? 0) + value
  }

  const total   = Object.values(byBucket).reduce((s, v) => s + v, 0)
  const buckets = Object.keys(byBucket).filter(b => byBucket[b] > 0)

  return { byBucket, total, buckets }
}

// ─── Drift ─────────────────────────────────────────────────────────────────

/**
 * Drift threshold:
 *   < 1%   green   "On track"
 *   1–3%   yellow  "Minor drift"
 *   > 3%   red     "Rebalance needed"
 */
export function getDriftStatus(driftPct) {
  const abs = Math.abs(driftPct)
  if (abs < 1) return { label: 'On track',        color: 'green',  severity: 0 }
  if (abs < 3) return { label: 'Minor drift',      color: 'yellow', severity: 1 }
  return        { label: 'Rebalance needed',       color: 'red',    severity: 2 }
}

// ─── Rebalance calculations ────────────────────────────────────────────────

/**
 * Computes the full rebalance plan given:
 *   currentAllocation  — { byBucket, total }  from computeCurrentAllocation()
 *   targets            — { equity: 60, debt: 20, ... }  pct values 0–100
 *
 * Returns array of rows:
 * [
 *   {
 *     bucket,          // 'equity'
 *     targetPct,       // 60
 *     currentPct,      // 67.3
 *     driftPct,        // +7.3  (positive = overweight)
 *     currentValue,    // ₹6,900
 *     targetValue,     // ₹6,205
 *     gapValue,        // -₹695  (negative = sell, positive = buy)
 *     action,          // 'sell' | 'buy' | 'hold'
 *     status,          // { label, color, severity }
 *   },
 *   ...
 * ]
 */
export function computeRebalancePlan(currentAllocation, targets) {
  const { byBucket, total } = currentAllocation

  // All buckets that appear in either current holdings or targets
  const allBuckets = new Set([
    ...Object.keys(byBucket),
    ...Object.keys(targets),
  ])

  const rows = []

  for (const bucket of allBuckets) {
    const targetPct    = Number(targets[bucket] ?? 0)
    const currentValue = byBucket[bucket] ?? 0
    const currentPct   = total > 0 ? (currentValue / total) * 100 : 0
    const targetValue  = (targetPct / 100) * total
    const gapValue     = targetValue - currentValue          // + = buy, - = sell
    const driftPct     = currentPct - targetPct             // + = overweight

    let action = 'hold'
    if      (gapValue >  50) action = 'buy'
    else if (gapValue < -50) action = 'sell'
    // ignore < ₹50 gaps — noise

    rows.push({
      bucket,
      targetPct,
      currentPct,
      driftPct,
      currentValue,
      targetValue,
      gapValue,
      action,
      status: getDriftStatus(driftPct),
    })
  }

  // Sort: most overweight first, then most underweight
  rows.sort((a, b) => b.driftPct - a.driftPct)

  return rows
}

// ─── New money mode ────────────────────────────────────────────────────────

/**
 * Given a new investment amount, calculates how to allocate it
 * to move CLOSEST to target without any selling.
 *
 * Strategy: prioritise underweight buckets proportionally.
 *
 * Returns array of:
 *   { bucket, allocate, newValue, newPct, newDriftPct }
 */
export function computeNewMoneyAllocation(currentAllocation, targets, newMoney) {
  const { byBucket, total } = currentAllocation
  const newTotal = total + newMoney

  // Compute how underweight each bucket is in absolute ₹ terms after new money
  const gaps = {}
  let totalUnderweight = 0

  for (const [bucket, targetPct] of Object.entries(targets)) {
    const targetValue  = (targetPct / 100) * newTotal
    const currentValue = byBucket[bucket] ?? 0
    const gap          = targetValue - currentValue
    if (gap > 0) {
      gaps[bucket]      = gap
      totalUnderweight += gap
    }
  }

  // Distribute new money proportionally across underweight buckets
  // Cap each bucket at its gap (don't overshoot)
  const allocation = {}
  let remaining = newMoney

  // Sort buckets by gap descending — fill biggest gaps first
  const sorted = Object.entries(gaps).sort((a, b) => b[1] - a[1])

  for (const [bucket, gap] of sorted) {
    if (remaining <= 0) break
    const proportional = totalUnderweight > 0
      ? (gap / totalUnderweight) * newMoney
      : 0
    const allocate        = Math.min(proportional, gap, remaining)
    allocation[bucket]    = allocate
    remaining            -= allocate
  }

  // If any money left over (all buckets already at target), dump into largest bucket
  if (remaining > 1) {
    const largest = Object.keys(targets).reduce((a, b) =>
      (targets[a] ?? 0) > (targets[b] ?? 0) ? a : b
    )
    allocation[largest] = (allocation[largest] ?? 0) + remaining
  }

  // Build result rows — only buckets that get allocation
  return Object.entries(allocation)
    .filter(([, v]) => v > 0.5)
    .map(([bucket, allocate]) => {
      const newValue   = (byBucket[bucket] ?? 0) + allocate
      const newPct     = newTotal > 0 ? (newValue / newTotal) * 100 : 0
      const newDrift   = newPct - (targets[bucket] ?? 0)
      return { bucket, allocate, newValue, newPct, newDriftPct: newDrift }
    })
    .sort((a, b) => b.allocate - a.allocate)
}

// ─── Full rebalance mode ───────────────────────────────────────────────────

/**
 * Computes what to SELL (overweight) and BUY (underweight) for a full rebalance.
 * Returns { sells, buys, netCash }
 *
 * sells: [{ bucket, amount }]  ← reduce these positions
 * buys:  [{ bucket, amount }]  ← increase these positions
 * netCash: total freed from sells (should ≈ total needed for buys)
 */
export function computeFullRebalance(currentAllocation, targets) {
  const rows = computeRebalancePlan(currentAllocation, targets)

  const sells = rows
    .filter(r => r.action === 'sell')
    .map(r => ({ bucket: r.bucket, amount: Math.abs(r.gapValue) }))

  const buys = rows
    .filter(r => r.action === 'buy')
    .map(r => ({ bucket: r.bucket, amount: r.gapValue }))

  const netCash = sells.reduce((s, r) => s + r.amount, 0)

  return { sells, buys, netCash }
}

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Validates that target percentages sum to 100 (within rounding tolerance).
 * Returns { valid: bool, sum: number, delta: number }
 */
export function validateTargets(targets) {
  const sum   = Object.values(targets).reduce((s, v) => s + Number(v), 0)
  const delta = Math.abs(sum - 100)
  return { valid: delta < 0.5, sum, delta }
}

/**
 * Given current allocation buckets and a partial targets object,
 * auto-fills missing buckets with 0 and returns a complete targets map.
 */
export function fillMissingTargets(buckets, targets) {
  const filled = { ...targets }
  for (const b of buckets) {
    if (filled[b] == null) filled[b] = 0
  }
  return filled
}

/**
 * Pre-fills target sliders from current allocation —
 * used when user sets up targets for the first time.
 * Rounds to nearest integer, adjusts largest bucket to make sum = 100.
 */
export function preseedTargetsFromCurrent(currentAllocation) {
  const { byBucket, total } = currentAllocation
  if (total === 0) return {}

  const raw     = {}
  let   sumSoFar = 0

  const buckets = Object.keys(byBucket)
  buckets.forEach((b, i) => {
    if (i === buckets.length - 1) {
      raw[b] = 100 - sumSoFar  // last bucket absorbs rounding
    } else {
      const pct = Math.round((byBucket[b] / total) * 100)
      raw[b]     = pct
      sumSoFar  += pct
    }
  })

  return raw
}