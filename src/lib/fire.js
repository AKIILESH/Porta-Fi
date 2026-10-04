// FIRE calculation using the 25x rule (300x monthly expenses = 25x annual expenses)
// Assumes 12% nominal return and 3% inflation per annum, compounded monthly.
export function calculateFire({ netWorth, monthlyExpenses, investmentLimit }) {
  if (!monthlyExpenses || monthlyExpenses <= 0) {
    // Can't calculate without expense data — return a placeholder
    return { years: '—', target: 0, achieved: false, noData: true }
  }

  let nw = netWorth || 0
  const annualExpenses = monthlyExpenses * 12
  // FIRE target = 25× annual expenses (the 4% safe withdrawal rule)
  const fireTarget = annualExpenses * 25

  if (nw >= fireTarget) {
    return { years: '0.0', target: fireTarget, achieved: true, noData: false }
  }

  // Simulate month-by-month with 12% return and 3% inflation
  let corpus = nw
  let monthlyExp = monthlyExpenses
  let m = 0

  while (corpus < monthlyExp * 12 * 25 && m < 1200) {
    corpus = (corpus + investmentLimit) * (1 + 0.12 / 12)
    monthlyExp = monthlyExp * (1 + 0.03 / 12)
    m++
  }

  if (m < 1200) {
    return { years: (m / 12).toFixed(1), target: monthlyExp * 12 * 25, achieved: true, noData: false }
  }

  return { years: '100+', target: monthlyExp * 12 * 25, achieved: false, noData: false }
}
