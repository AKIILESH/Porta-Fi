// src/hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { currentMonth } from '../lib/formatters'

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
      localStorage.setItem('usdInrRate', JSON.stringify({ rate, timestamp: Date.now() }))
      return rate
    }
  } catch (error) {
    console.error('Error fetching USD/INR rate:', error)
  }
  return 87.50
}

// Matches the same logic in usePortfolioData for consistency
function needsUSDConversion(h) {
  if (h.asset_class === 'us_equity') return true
  if (['NYSE', 'NASDAQ', 'PCX'].includes(h.exchange)) return true
  if (h.currency === 'USD') return true
  return false
}

export function useDashboardData(userId) {
  return useQuery({
    queryKey: queryKeys.dashboard(userId),
    queryFn: async () => {
      console.log('🏠 Fetching dashboard data for user:', userId)

      const month     = currentMonth()
      const startDate = `${month}-01`
      const endDate   = new Date().toISOString().split('T')[0]

      // Fetch holdings first so we can get tickers for price lookup
      const holdingsRes = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId)

      const holdings = holdingsRes.data || []

      // Fetch latest price per ticker from cache
      let priceMap = {}
      if (holdings.length > 0) {
        const tickers = holdings.map(h => h.ticker)
        const { data: prices } = await supabase
          .from('price_cache')
          .select('ticker, price')
          .in('ticker', tickers)
          .order('fetched_at', { ascending: false })

        // Keep only the most recent price per ticker
        prices?.forEach(p => {
          if (!priceMap[p.ticker]) priceMap[p.ticker] = p.price
        })
      }

      // Fetch everything else in parallel
      const [cashRes, accountsRes, monthTxRes, recentTxRes, debtsRes, nwRes] = await Promise.all([
        supabase.from('cash_accounts').select('balance').eq('user_id', userId),
        supabase.from('accounts').select('balance').eq('user_id', userId),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(7),
        supabase.from('debts').select('balance').eq('user_id', userId),
        supabase
          .from('net_worth_snapshots')
          .select('net_worth, snapshot_date')
          .eq('user_id', userId)
          .order('snapshot_date', { ascending: false })
          .limit(12),
      ])

      const cashAccounts      = cashRes.data     || []
      const accounts          = accountsRes.data || []
      const monthTransactions = monthTxRes.data  || []
      const recentTransactions= recentTxRes.data || []
      const debts             = debtsRes.data    || []
      const nwHistory         = nwRes.data       || []

      const usdInrRate = await fetchUSDINR()

      // ── Portfolio value + cost ────────────────────────────────────────────
      let portfolioValue = 0
      let portfolioCost  = 0
      const byAssetClass = {}

      holdings.forEach(h => {
        const isUSD = needsUSDConversion(h)

        // Cost basis always in INR
        const costInINR = isUSD
          ? h.quantity * h.avg_cost * usdInrRate
          : h.quantity * h.avg_cost

        // Current price in INR — live price preferred, fallback to avg_cost
        let currentPriceINR
        if (priceMap[h.ticker]) {
          currentPriceINR = priceMap[h.ticker]   // already in INR from price_cache
        } else if (isUSD) {
          currentPriceINR = h.avg_cost * usdInrRate
        } else {
          currentPriceINR = h.avg_cost
        }

        const valueINR = h.quantity * currentPriceINR

        portfolioValue += valueINR
        portfolioCost  += costInINR
        byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + valueINR
      })

      const portfolioGain    = portfolioValue - portfolioCost
      const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

      // ── Cash & net worth ──────────────────────────────────────────────────
      const cashBalance    = cashAccounts.reduce((s, a) => s + Number(a.balance), 0)
      const accountBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)
      const totalDebt      = debts.reduce((s, d) => s + Number(d.balance), 0)
      const netWorth       = portfolioValue + cashBalance + accountBalance - totalDebt

      // ── Monthly income / expenses ─────────────────────────────────────────
      const monthlyIncome = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((s, t) => s + Number(t.amount), 0)

      const monthlyExpenses = monthTransactions
        .filter(t => t.amount < 0)
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

      console.log('📊 Dashboard Summary:', {
        portfolioValue:   portfolioValue.toFixed(2),
        portfolioCost:    portfolioCost.toFixed(2),
        portfolioGain:    portfolioGain.toFixed(2),
        portfolioGainPct: portfolioGainPct.toFixed(2) + '%',
        cashBalance:      cashBalance.toFixed(2),
        accountBalance:   accountBalance.toFixed(2),
        totalDebt:        totalDebt.toFixed(2),
        netWorth:         netWorth.toFixed(2),
        monthlyIncome:    monthlyIncome.toFixed(2),
        monthlyExpenses:  monthlyExpenses.toFixed(2),
      })

      return {
        portfolioValue,
        portfolioCost,
        portfolioGain,
        portfolioGainPct,
        cashBalance,
        accountBalance,
        totalDebt,
        netWorth,
        byAssetClass,
        recentTransactions,
        monthTransactions,
        monthlyIncome,
        monthlyExpenses,
        nwHistory: nwHistory.map(s => ({
          date:  s.snapshot_date,
          value: s.net_worth,
        })),
        usdInrRate,
      }
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!userId,
  })
}