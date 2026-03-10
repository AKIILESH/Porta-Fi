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

// XIRR Calculation Functions
function calculateXIRR(cashFlows) {
  if (!cashFlows.length || cashFlows.length < 2) return 0
  
  // Sort by date
  cashFlows.sort((a, b) => a.date - b.date)
  
  return calculateXIRRNewton(cashFlows)
}

function calculateXIRRNewton(cashFlows) {
  const guess = 0.1 // 10% initial guess
  const maxIterations = 100
  const precision = 0.00001
  
  let xirr = guess
  
  for (let i = 0; i < maxIterations; i++) {
    const result = calculateNPV(xirr, cashFlows)
    const derivative = calculateNPVDerivative(xirr, cashFlows)
    
    if (Math.abs(result.npv) < precision) break
    
    const newXirr = xirr - result.npv / derivative
    
    if (Math.abs(newXirr - xirr) < precision) {
      xirr = newXirr
      break
    }
    
    xirr = newXirr
  }
  
  // Handle edge cases
  if (isNaN(xirr) || !isFinite(xirr)) return 0
  
  return xirr * 100 // Return as percentage
}

function calculateNPV(rate, cashFlows) {
  const startDate = cashFlows[0].date
  let npv = 0
  
  cashFlows.forEach(cf => {
    const years = (cf.date - startDate) / (1000 * 60 * 60 * 24 * 365)
    npv += cf.amount / Math.pow(1 + rate, years)
  })
  
  return { npv }
}

function calculateNPVDerivative(rate, cashFlows) {
  const startDate = cashFlows[0].date
  let derivative = 0
  
  cashFlows.forEach(cf => {
    const years = (cf.date - startDate) / (1000 * 60 * 60 * 24 * 365)
    derivative -= years * cf.amount / Math.pow(1 + rate, years + 1)
  })
  
  return derivative
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

        // Create a map of the latest price for each ticker
        const latestPrices = {}
        prices?.forEach(price => {
          if (!latestPrices[price.ticker]) {
            latestPrices[price.ticker] = price
            console.log(`📊 Using latest price for ${price.ticker}: ${price.price}`)
          }
        })

        Object.values(latestPrices).forEach(price => {
          const holding = holdings.find(h => h.ticker === price.ticker)
          const isUSStock = holding?.exchange === 'NYSE' || holding?.exchange === 'NASDAQ' || holding?.exchange === 'PCX'
          
          quotesMap[price.ticker] = {
            price: price.price, // This is already in INR for all stocks
            usdPrice: isUSStock ? price.price / usdInrRate : null,
            originalPrice: price.price,
            prevClose: price.prev_close,
            change: price.change_amt,
            changePct: price.change_pct,
            shortName: price.short_name,
            fromCache: true,
            fetched_at: price.fetched_at,
            exchange: holding?.exchange,
            isUSStock
          }
          
          console.log(`📈 Built quote for ${price.ticker}:`, {
            priceINR: price.price,
            isUSStock,
            usdPrice: isUSStock ? price.price / usdInrRate : null
          })
        })
      }

      // Calculate portfolio metrics
      console.log('🧮 Calculating portfolio metrics...')
      
      let portfolioValue = 0
      let portfolioCost = 0
      const breakdown = []

      holdings.forEach(h => {
        const quote = quotesMap[h.ticker]
        const isUSStock = h.exchange === 'NYSE' || h.exchange === 'NASDAQ' || h.exchange === 'PCX'
        
        console.log(`📊 Processing ${h.ticker}:`, {
          avg_cost: h.avg_cost,
          currency: h.currency,
          isUSStock,
          quotePrice: quote?.price
        })
        
        // For US stocks, avg_cost is in USD, need to convert to INR for cost calculation
        // For Indian stocks, avg_cost is already in INR
        let costPerShareInINR = h.avg_cost
        if (isUSStock) {
          costPerShareInINR = h.avg_cost * usdInrRate
          console.log(`💱 Converted ${h.ticker}: $${h.avg_cost} → ₹${costPerShareInINR} (rate: ${usdInrRate})`)
        }
        
        // Get current price (already in INR from quotesMap)
        const currentPricePerShare = quote?.price || costPerShareInINR
        
        // Calculate values
        const value = h.quantity * currentPricePerShare
        const cost = h.quantity * costPerShareInINR
        const gain = value - cost
        const gainPct = cost > 0 ? (gain / cost) * 100 : 0
        
        portfolioValue += value
        portfolioCost += cost
        
        console.log(`📈 ${h.ticker} calculation:`, {
          quantity: h.quantity,
          costPerShareINR: costPerShareInINR,
          currentPrice: currentPricePerShare,
          value,
          cost,
          gain,
          gainPct: gainPct.toFixed(2) + '%'
        })
        
        breakdown.push({
          ticker: h.ticker,
          quantity: h.quantity,
          avgCostUSD: isUSStock ? h.avg_cost : null,
          avgCostINR: costPerShareInINR,
          currentPrice: currentPricePerShare,
          currentPriceUSD: isUSStock ? (quote?.price / usdInrRate) : null,
          value,
          cost,
          gain,
          gainPct: gainPct.toFixed(2) + '%',
          exchange: h.exchange,
          isUSStock
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

      // Calculate realised P&L (already in INR from trades)
      const realisedPnl = trades
        .filter(t => ['sell', 'switch_out'].includes(t.trade_type) && t.realised_pnl != null)
        .reduce((sum, t) => sum + Number(t.realised_pnl), 0)

      // Calculate XIRR with proper currency conversion
      const buyTransactions = trades.filter(t => ['buy', 'sip'].includes(t.trade_type))
      
      // Convert all buy transactions to INR for XIRR calculation
      const xirrCashFlows = []
      
      buyTransactions.forEach(t => {
        let amount = t.total_value
        // If trade was in USD, convert to INR
        if (t.exchange === 'NYSE' || t.exchange === 'NASDAQ' || t.exchange === 'PCX') {
          amount = t.total_value * usdInrRate
        }
        xirrCashFlows.push({
          amount: -Math.abs(amount), // Negative for investments
          date: new Date(t.trade_date)
        })
      })
      
      // Add current portfolio value as positive cash flow
      if (portfolioValue > 0) {
        xirrCashFlows.push({
          amount: portfolioValue,
          date: new Date()
        })
      }
      
      // Calculate XIRR
      const xirr = calculateXIRR(xirrCashFlows)

      // Calculate by asset class
      const byAssetClass = {}
      holdings.forEach(h => {
        const quote = quotesMap[h.ticker]
        const isUSStock = h.exchange === 'NYSE' || h.exchange === 'NASDAQ' || h.exchange === 'PCX'
        
        // Get current price in INR
        let currentPricePerShare = h.avg_cost
        if (quote?.price) {
          currentPricePerShare = quote.price
        } else if (isUSStock) {
          currentPricePerShare = h.avg_cost * usdInrRate
        }
        
        const value = h.quantity * currentPricePerShare
        byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + value
      })

      // Log XIRR calculation for debugging
      console.log('📊 XIRR Calculation:', {
        numTransactions: buyTransactions.length,
        firstDate: xirrCashFlows[0]?.date,
        lastDate: new Date(),
        xirr: xirr.toFixed(2) + '%'
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
        xirr,
        byAssetClass,
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}