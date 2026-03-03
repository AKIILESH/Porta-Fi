// src/hooks/queryKeys.js
export const queryKeys = {
  // User-specific data
  holdings: (userId) => ['holdings', userId],
  transactions: (userId, month, page) => ['transactions', userId, month, page],
  cashAccounts: (userId) => ['cashAccounts', userId],
  trades: (userId) => ['trades', userId],
  goals: (userId) => ['goals', userId],
  debts: (userId) => ['debts', userId],
  budgetLimits: (userId, month) => ['budgetLimits', userId, month],
  nwHistory: (userId) => ['nwHistory', userId],
  dividendEvents: (userId) => ['dividendEvents', userId],
  sipPlans: (userId) => ['sipPlans', userId],
  accounts: (userId) => ['accounts', userId],
  
  // Market data (shared across users)
  indices: () => ['indices'],
  quotes: (tickers) => ['quotes', tickers],
  
  // Combined queries
  dashboard: (userId) => ['dashboard', userId],
  portfolio: (userId) => ['portfolio', userId],
}