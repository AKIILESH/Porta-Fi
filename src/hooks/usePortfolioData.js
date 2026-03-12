// src/hooks/usePortfolioData.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { useIndices } from './useIndices'

// ── USD/INR Rate ──────────────────────────────────────────────────────────────
async function fetchUSDINR() {
  try {
    const cached = localStorage.getItem('usdInrRate')
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 60 * 60 * 1000) {
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

    if (rate) {
      localStorage.setItem('usdInrRate', JSON.stringify({ rate, timestamp: Date.now() }))
      return rate
    }
  } catch (error) {
    console.error('Error fetching USD/INR rate:', error)
  }

  return 87.50
}

// ── Currency helpers ──────────────────────────────────────────────────────────
function needsUSDConversion(holding) {
  if (holding.asset_class === 'us_equity') return true
  if (['NYSE', 'NASDAQ', 'PCX'].includes(holding.exchange)) return true
  if (holding.currency === 'USD') return true
  return false
}

// ── XIRR ──────────────────────────────────────────────────────────────────────
// NPV: sum of CF_i / (1+rate)^(days_i / 365.25)
function xNPV(rate, cashFlows) {
  const t0 = cashFlows[0].date.getTime()
  return cashFlows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (365.25 * 24 * 60 * 60 * 1000)
    return sum + cf.amount / Math.pow(1 + rate, years)
  }, 0)
}

// dNPV/dRate
function xNPVDeriv(rate, cashFlows) {
  const t0 = cashFlows[0].date.getTime()
  return cashFlows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (365.25 * 24 * 60 * 60 * 1000)
    return sum - years * cf.amount / Math.pow(1 + rate, years + 1)
  }, 0)
}

function calculateXIRR(cashFlows) {
  if (!cashFlows || cashFlows.length < 2) return null

  // Sort ascending by date
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Must have at least one outflow (buy) and one inflow (terminal value / sell)
  const hasNeg = sorted.some(cf => cf.amount < 0)
  const hasPos = sorted.some(cf => cf.amount > 0)
  if (!hasNeg || !hasPos) {
    console.warn('⚠️ XIRR: need both negative and positive cashflows')
    return null
  }

  // Try multiple starting guesses — Newton-Raphson can get stuck
  const guesses = [0.1, 0.0, 0.3, 0.5, -0.1, 1.0, 2.0]

  for (const guess of guesses) {
    let rate = guess

    for (let i = 0; i < 300; i++) {
      const f  = xNPV(rate, sorted)
      const df = xNPVDeriv(rate, sorted)

      // Derivative too flat — bail on this guess
      if (Math.abs(df) < 1e-14) break

      const next = rate - f / df

      // Clamp: rate can't go below -100%
      const clamped = Math.max(-0.9999, Math.min(next, 50))

      if (Math.abs(clamped - rate) < 1e-8) {
        rate = clamped
        // Verify — NPV at solution should be near zero
        if (Math.abs(xNPV(rate, sorted)) < 0.01) {
          console.log(`✅ XIRR converged: ${(rate * 100).toFixed(2)}% (guess=${guess})`)
          return rate * 100  // return as percentage e.g. 12.4
        }
        break
      }

      rate = clamped
    }
  }

  console.warn('⚠️ XIRR did not converge with any starting guess')
  return null
}

// ── Build XIRR cash flows from trades ────────────────────────────────────────
function buildXIRRCashFlows(trades, portfolioValueINR, usdInrRate) {
  const cashFlows = []

  trades
    .filter(t => ['buy', 'sip', 'sell', 'switch_out'].includes(t.trade_type))
    .forEach(t => {
      const isUSD = needsUSDConversion({
        asset_class: t.asset_class,
        exchange:    t.exchange,
        currency:    t.currency,
      })

      // net_amount is most accurate (includes all charges)
      // fallback to total_value if net_amount missing
      const rawAmount = Math.abs(t.net_amount || t.total_value || 0)
      const amountINR = isUSD ? rawAmount * usdInrRate : rawAmount

      if (amountINR === 0) return  // skip zero-value rows

      const isBuy = ['buy', 'sip'].includes(t.trade_type)

      cashFlows.push({
        amount: isBuy ? -amountINR : +amountINR,  // buys = outflow (-), sells = inflow (+)
        date:   new Date(t.trade_date),
      })
    })

  // Terminal cashflow — current market value (liquidation value today)
  if (portfolioValueINR > 0) {
    cashFlows.push({
      amount: +portfolioValueINR,
      date:   new Date(),
    })
  }

  return cashFlows
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function usePortfolioData(userId) {
  const { data: indices, isLoading: indicesLoading } = useIndices()

  return useQuery({
    queryKey: queryKeys.portfolio(userId),
    queryFn: async () => {
      console.log('📊 Fetching portfolio data for user:', userId)

      const [holdingsRes, tradesRes] = await Promise.all([
        supabase.from('holdings').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('trades').select('*').eq('user_id', userId).order('trade_date', { ascending: false }).limit(200),
      ])

      const holdings = holdingsRes.data || []
      const trades   = tradesRes.data  || []

      console.log(`📊 Found ${holdings.length} holdings and ${trades.length} trades`)

      const usdInrRate = await fetchUSDINR()
      console.log('💰 USD/INR Rate:', usdInrRate)

      // ── Fetch latest prices ─────────────────────────────────────────────────
      let quotesMap = {}
      if (holdings.length > 0) {
        const tickers = holdings.map(h => h.ticker)

        const { data: prices } = await supabase
          .from('price_cache')
          .select('*')
          .in('ticker', tickers)
          .order('fetched_at', { ascending: false })

        // Keep only the most recent price per ticker
        const latestPrices = {}
        prices?.forEach(price => {
          if (!latestPrices[price.ticker]) latestPrices[price.ticker] = price
        })

        Object.values(latestPrices).forEach(price => {
          const holding = holdings.find(h => h.ticker === price.ticker)
          quotesMap[price.ticker] = {
            price:       price.price,
            currency:    holding?.currency    || 'INR',
            exchange:    holding?.exchange,
            asset_class: holding?.asset_class,
          }
        })
      }

      // ── Portfolio value & cost ──────────────────────────────────────────────
      let portfolioValue = 0
      let portfolioCost  = 0
      const holdingsList = []

      holdings.forEach(h => {
        const quote           = quotesMap[h.ticker]
        const needsConversion = needsUSDConversion(h)

        // Cost basis in INR
        let costInINR = h.quantity * h.avg_cost
        if (needsConversion) costInINR = h.quantity * h.avg_cost * usdInrRate

        // Current price in INR
        let currentPriceInINR
        if (quote?.price) {
          currentPriceInINR = quote.price
        } else if (needsConversion) {
          currentPriceInINR = h.avg_cost * usdInrRate
        } else {
          currentPriceInINR = h.avg_cost
        }

        const valueInINR = h.quantity * currentPriceInINR

        portfolioValue += valueInINR
        portfolioCost  += costInINR

        holdingsList.push({
          ...h,
          currentPrice: currentPriceInINR,
          value:   valueInINR,
          cost:    costInINR,
          gain:    valueInINR - costInINR,
          gainPct: costInINR > 0 ? ((valueInINR - costInINR) / costInINR) * 100 : 0,
        })
      })

      const portfolioGain    = portfolioValue - portfolioCost
      const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

      // ── XIRR ───────────────────────────────────────────────────────────────
      const xirrCashFlows = buildXIRRCashFlows(trades, portfolioValue, usdInrRate)

      console.log('💸 XIRR cash flows:', xirrCashFlows.map(cf => ({
        date:   cf.date.toISOString().split('T')[0],
        amount: cf.amount.toFixed(2),
      })))

      const xirr = calculateXIRR(xirrCashFlows)
      console.log('📈 XIRR:', xirr !== null ? xirr.toFixed(2) + '%' : 'null (did not converge)')

      // ── By asset class ──────────────────────────────────────────────────────
      const byAssetClass = {}
      holdingsList.forEach(h => {
        byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + h.value
      })

      return {
        holdings: holdingsList,
        trades,
        quotesMap,
        usdInrRate,
        portfolioValue,
        portfolioCost,
        portfolioGain,
        portfolioGainPct,
        xirr,        // percentage e.g. 12.4 means 12.4%, null if didn't converge
        byAssetClass,
        // alphaNifty / alphaSP500 removed — add back once daily price history is stored
      }
    },
    enabled: !!userId && !indicesLoading,
    staleTime: 5 * 60 * 1000,
  })
}