// src/hooks/usePortfolioData.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// Helper to fetch USD/INR rate
async function fetchUSDINR() {
  try {
    // Check cache first (1 hour cache)
    const cached = localStorage.getItem('usdInrRate')
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hour
        console.log('💰 Using cached USD/INR rate:', rate)
        return rate
      }
    }

    console.log('💰 Fetching fresh USD/INR rate...')
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
    console.log('💰 Fresh USD/INR rate:', rate)
    
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
  
  console.log('💰 Using fallback USD/INR rate: 87.50')
  return 87.50
}

export function usePortfolioData(userId) {
  return useQuery({
    queryKey: queryKeys.portfolio(userId),
    queryFn: async () => {
      console.log('📊 Fetching portfolio data for user:', userId)
      
      const [holdingsRes, tradesRes] = await Promise.all([
        supabase.from('holdings').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('trades').select('*').eq('user_id', userId).order('trade_date', { ascending: false }).limit(200),
      ])

      const holdings = holdingsRes.data || []
      const trades = tradesRes.data || []
      
      console.log(`📊 Found ${holdings.length} holdings and ${trades.length} trades`)

      // Fetch USD/INR rate for US stocks
      const usdInrRate = await fetchUSDINR()
      console.log('💰 USD/INR Rate:', usdInrRate)

      // Fetch latest prices from price_cache for all holdings
      let quotesMap = {}
      if (holdings.length > 0) {
        const tickers = holdings.map(h => h.ticker)
        console.log('🔍 Fetching prices for tickers:', tickers)
        
        const { data: prices, error } = await supabase
          .from('price_cache')
          .select('*')
          .in('ticker', tickers)
          .order('fetched_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching prices:', error)
        } else {
          console.log(`✅ Found ${prices?.length || 0} price records`)
        }

        prices?.forEach(price => {
          if (!quotesMap[price.ticker]) {
            const holding = holdings.find(h => h.ticker === price.ticker)
            const isUSStock = holding?.exchange === 'NYSE' || holding?.exchange === 'NASDAQ' || holding?.exchange === 'PCX'
            
            quotesMap[price.ticker] = {
              price: isUSStock ? price.price * usdInrRate : price.price,
              usdPrice: isUSStock ? price.price : null,
              originalPrice: price.price,
              prevClose: isUSStock ? price.prev_close * usdInrRate : price.prev_close,
              change: isUSStock ? price.change_amt * usdInrRate : price.change_amt,
              changePct: price.change_pct,
              shortName: price.short_name,
              fromCache: true,
              fetched_at: price.fetched_at,
              exchange: holding?.exchange,
              isUSStock
            }
          }
        })
      }

      // Calculate portfolio metrics - SINGLE LOOP
      console.log('🧮 Calculating portfolio metrics...')
      
      let portfolioValue = 0
      let portfolioCost = 0
      const breakdown = []

      holdings.forEach(h => {
        const quote = quotesMap[h.ticker]
        const currentPricePerShare = quote?.price || h.avg_cost
        
        // CORRECT CALCULATION - using per-share prices
        const value = h.quantity * currentPricePerShare
        const cost = h.quantity * h.avg_cost
        const gain = value - cost
        const gainPct = cost > 0 ? (gain / cost) * 100 : 0
        
        portfolioValue += value
        portfolioCost += cost
        
        breakdown.push({
          ticker: h.ticker,
          quantity: h.quantity,
          avgCost: h.avg_cost,
          currentPrice: currentPricePerShare,
          value,
          cost,
          gain,
          gainPct: gainPct.toFixed(2) + '%',
          exchange: h.exchange
        })
      })

      console.log('📊 Portfolio Breakdown:')
      console.table(breakdown)
      
      const portfolioGain = portfolioValue - portfolioCost
      const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

      console.log('📈 Portfolio Summary:', {
        portfolioValue,
        portfolioCost,
        portfolioGain,
        portfolioGainPct: portfolioGainPct.toFixed(2) + '%'
      })

      // Calculate realised P&L
      const realisedPnl = trades
        .filter(t => ['sell', 'switch_out'].includes(t.trade_type) && t.realised_pnl != null)
        .reduce((sum, t) => {
          let pnl = t.realised_pnl
          if (t.exchange === 'NYSE' || t.exchange === 'NASDAQ' || t.exchange === 'PCX') {
            pnl = pnl * usdInrRate
          }
          return sum + Number(pnl)
        }, 0)

      // Calculate by asset class
      const byAssetClass = {}
      holdings.forEach(h => {
        const quote = quotesMap[h.ticker]
        const currentPricePerShare = quote?.price || h.avg_cost
        const value = h.quantity * currentPricePerShare
        byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + value
      })

      return {
        holdings,
        trades,
        quotesMap,
        usdInrRate,
        portfolioValue,
        portfolioCost,
        portfolioGain,
        realisedPnl,
        byAssetClass,
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}