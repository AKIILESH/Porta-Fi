// src/hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useDashboardData(userId) {
  return useQuery({
    queryKey: queryKeys.dashboard(userId),
    queryFn: async () => {
      console.log('🏠 Fetching dashboard data...')
      
      const [holdingsRes, cashRes, accountsRes, recentTxRes, debtsRes, nwRes] = await Promise.all([
        supabase.from('holdings').select('quantity, avg_cost, ticker, asset_class').eq('user_id', userId),
        supabase.from('cash_accounts').select('balance').eq('user_id', userId),
        supabase.from('accounts').select('balance').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(7),
        supabase.from('debts').select('balance').eq('user_id', userId),
        supabase.from('net_worth_snapshots').select('net_worth, snapshot_date').eq('user_id', userId).order('snapshot_date', { ascending: false }).limit(12),
      ])

      const holdings = holdingsRes.data || []
      const cashAccounts = cashRes.data || []
      const accounts = accountsRes.data || []
      const recentTransactions = recentTxRes.data || []
      const debts = debtsRes.data || []
      const nwHistory = nwRes.data || []

      // Calculate derived values
      const portfolioValue = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_cost), 0)
      const cashBalance = cashAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
      const accountBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
      const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0)
      const netWorth = portfolioValue + cashBalance + accountBalance - totalDebt

      // Calculate by asset class
      const byAssetClass = holdings.reduce((acc, h) => {
        const value = h.quantity * h.avg_cost
        acc[h.asset_class] = (acc[h.asset_class] || 0) + value
        return acc
      }, {})

      return {
        portfolioValue,
        cashBalance,
        accountBalance,
        totalDebt,
        netWorth,
        byAssetClass,
        recentTransactions,
        nwHistory: nwHistory.map(s => ({
          date: s.snapshot_date,
          value: s.net_worth
        })),
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!userId,
  })
}