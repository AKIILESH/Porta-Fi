// src/hooks/queryKeys.js
export const queryKeys = {
  // User-specific data
  holdings: (userId) => ['holdings', userId],
  transactions: (userId, month, page) => ['transactions', userId, month, page],
  cashAccounts: (userId) => ['cashAccounts', userId],
  trades: (userId) => ['trades', userId],
  goals: (userId) => ['goals', userId],
  debts: (userId) => ['debts', userId],
  nwHistory: (userId) => ['nwHistory', userId],
  dividendEvents: (userId) => ['dividendEvents', userId],
  sipPlans: (userId) => ['sipPlans', userId],
  accounts: (userId) => ['accounts', userId],
  rebalanceTargets: (userId) => ['rebalanceTargets', userId],

  budget: (userId, month) => ['budget', userId, month],
  budgetLimits: (userId, month) => ['budgetLimits', userId, month],

  // Market data (shared across users)
  indices: () => ['indices'],
  quotes: (tickers) => ['quotes', tickers],
  
  // Combined queries
  dashboard: (userId) => ['dashboard', userId],
  portfolio: (userId) => ['portfolio', userId],
}