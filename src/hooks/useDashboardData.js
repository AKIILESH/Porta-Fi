// src/hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// Reuse the same USD/INR helper
async function fetchUSDINR() {
  try {
    const cached = localStorage.getItem('usdInrRate')
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        console.log('💰 Dashboard using cached USD/INR rate:', rate)
        return rate
      }
    }

    console.log('💰 Dashboard fetching fresh USD/INR rate...')
    const response = await fetch(
      'https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ ticker: 'INR=X' })
      }
    )

    if (!response.ok) throw new Error('Failed to fetch USD/INR rate')
    
    const data = await response.json()
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    console.log('💰 Dashboard fresh USD/INR rate:', rate)
    
    if (rate) {
      localStorage.setItem('usdInrRate', JSON.stringify({
        rate,
        timestamp: Date.now()
      }))
      return rate
    }
  } catch (error) {
    console.error('Error fetching USD/INR rate:', error)
  }
  return 87.50
}

export function useDashboardData(userId) {
  return useQuery({
    queryKey: queryKeys.dashboard(userId),
    queryFn: async () => {
      console.log('🏠 Fetching dashboard data for user:', userId)
      
      // First fetch holdings to get tickers
      const holdingsRes = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId)

      const holdings = holdingsRes.data || []
      
      // Then fetch prices for those tickers
      let priceMap = {}
      if (holdings.length > 0) {
        const tickers = holdings.map(h => h.ticker)
        const { data: prices } = await supabase
          .from('price_cache')
          .select('ticker, price')
          .in('ticker', tickers)
        
        prices?.forEach(p => { priceMap[p.ticker] = p.price })
      }

      // Fetch all other data in parallel
      const [cashRes, accountsRes, recentTxRes, debtsRes, nwRes] = await Promise.all([
        supabase.from('cash_accounts').select('balance').eq('user_id', userId),
        supabase.from('accounts').select('balance').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(7),
        supabase.from('debts').select('balance').eq('user_id', userId),
        supabase.from('net_worth_snapshots').select('net_worth, snapshot_date').eq('user_id', userId).order('snapshot_date', { ascending: false }).limit(12),
      ])

      const cashAccounts = cashRes.data || []
      const accounts = accountsRes.data || []
      const recentTransactions = recentTxRes.data || []
      const debts = debtsRes.data || []
      const nwHistory = nwRes.data || []

      // Get USD/INR rate
      const usdInrRate = await fetchUSDINR()

      // Calculate portfolio value with live prices and currency conversion
      let portfolioValue = 0
      const byAssetClass = {}

      holdings.forEach(h => {
        const isUSStock = h.exchange === 'NYSE' || h.exchange === 'NASDAQ' || h.exchange === 'PCX'
        const livePrice = priceMap[h.ticker]
        
        // Get current price (live or avg_cost with conversion)
        let currentPrice = h.avg_cost
        if (livePrice) {
          currentPrice = livePrice
        } else if (isUSStock) {
          currentPrice = h.avg_cost * usdInrRate
        }
        
        const value = h.quantity * currentPrice
        portfolioValue += value
        byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + value
      })

      const cashBalance = cashAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
      const accountBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
      const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0)
      const netWorth = portfolioValue + cashBalance + accountBalance - totalDebt

      console.log('📊 Dashboard Summary:', {
        portfolioValue: portfolioValue.toFixed(2),
        cashBalance: cashBalance.toFixed(2),
        accountBalance: accountBalance.toFixed(2),
        totalDebt: totalDebt.toFixed(2),
        netWorth: netWorth.toFixed(2)
      })

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
    staleTime: 3 * 60 * 1000,
    enabled: !!userId,
  })
}