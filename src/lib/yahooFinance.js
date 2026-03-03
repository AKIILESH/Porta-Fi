// src/lib/yahooFinance.js
import { supabase } from './supabase'

// Cache duration (1 hour for indices, 1 hour for stocks)
const CACHE_DURATION = 60 * 60 * 1000 // 60 minutes in milliseconds

// ── Exchange Trading Hours (IST = UTC+5:30) ────────────────────────────────
const SCHEDULES = {
  NSE: {
    mid:   { hour: 13, minute: 0  },   // 1:00 PM IST
    close: { hour: 15, minute: 45 },   // 3:45 PM IST
  },
  BSE: {
    mid:   { hour: 13, minute: 0  },
    close: { hour: 15, minute: 45 },
  },
  NYSE: {
    // NYSE = 9:30 AM–4:00 PM ET = 7:00 PM–1:30 AM IST next day
    mid:   { hour: 23, minute: 30 },   // 11:30 PM IST ≈ mid-session
    close: { hour: 2,  minute: 30 },   // 2:30 AM IST ≈ close
  },
  NASDAQ: {
    mid:   { hour: 23, minute: 30 },
    close: { hour: 2,  minute: 30 },
  },
}

// ── Yahoo Finance ticker format by exchange ────────────────────────────────
export function toYahooTicker(ticker, exchange) {
  switch (exchange) {
    case 'NSE':    return `${ticker}.NS`
    case 'BSE':    return `${ticker}.BO`
    case 'NYSE':
    case 'NASDAQ': return ticker
    default:       return ticker
  }
}

// ── Determine which session applies right now ─────────────────────────────
export function getCurrentSession(exchange) {
  const now = new Date()
  // IST offset
  const istOffset = 5.5 * 60 * 60 * 1000
  const ist = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000)
  const h = ist.getHours()
  const m = ist.getMinutes()
  const totalMin = h * 60 + m

  const sched = SCHEDULES[exchange] || SCHEDULES.NSE
  const midMin   = sched.mid.hour   * 60 + sched.mid.minute
  const closeMin = sched.close.hour * 60 + sched.close.minute

  if (Math.abs(totalMin - closeMin) <= 30) return 'close'
  if (Math.abs(totalMin - midMin)   <= 30) return 'mid'
  return null // not a fetch window
}

// ── Check if cached price is still valid (same day + session) ─────────────
function isCacheValid(cachedRow, session) {
  if (!cachedRow) return false
  const today = new Date().toISOString().split('T')[0]
  return cachedRow.fetch_date === today && cachedRow.session === session
}

// ── Fetch a single quote from Yahoo Finance via Edge Function ─────────────────
export async function fetchYahooQuote(yahooTicker) {
  try {
    // Check cache first (less than 1 hour old)
    const cutoffTime = new Date(Date.now() - CACHE_DURATION).toISOString()
    
    const { data: cached, error: cacheError } = await supabase
      .from('price_cache')
      .select('*')
      .eq('ticker', yahooTicker)
      .gte('fetched_at', cutoffTime)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!cacheError && cached) {
      console.log(`Using cached data for ${yahooTicker} (from ${new Date(cached.fetched_at).toLocaleTimeString()})`)
      return {
        price: cached.price,
        prevClose: cached.prev_close,
        change: cached.change_amt,
        changePct: cached.change_pct,
        shortName: cached.short_name,
        fromCache: true,
        cachedAt: cached.fetched_at
      }
    }

    // If not in cache or stale, fetch from Edge Function
    console.log(`Fetching fresh data for ${yahooTicker} from Edge Function`)
    
    const response = await fetch(
      'https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ ticker: yahooTicker })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch')
    }

    const data = await response.json()
    
    // Check if we got valid data
    if (!data?.chart?.result?.[0]?.meta) {
      throw new Error('Invalid data format from Yahoo')
    }

    const meta = data.chart.result[0].meta
    
    // Get previous close - handle different field names
    const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice
    
    // Calculate change values
    const currentPrice = meta.regularMarketPrice
    const change = currentPrice - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0

    // Store in cache using upsert
    const { error: upsertError } = await supabase
      .from('price_cache')
      .upsert({
        ticker: yahooTicker,
        exchange: meta.exchangeName || 'YAHOO',
        price: currentPrice,
        prev_close: prevClose,
        change_amt: change,
        change_pct: changePct,
        short_name: meta.shortName || meta.longName || yahooTicker,
        fetched_at: new Date().toISOString(),
        fetch_date: new Date().toISOString().split('T')[0],
        session: 'auto'
      }, {
        onConflict: 'ticker, fetch_date, session',
        ignoreDuplicates: false
      })

    if (upsertError) {
      console.warn('Error caching price:', upsertError)
    }

    return {
      price: currentPrice,
      prevClose: prevClose,
      change: change,
      changePct: changePct,
      shortName: meta.shortName || meta.longName || yahooTicker,
      fromCache: false
    }

  } catch (error) {
    console.error(`Yahoo fetch failed for ${yahooTicker}:`, error.message)
    return null
  }
}

// ── Main: fetch prices with Supabase cache logic ───────────────────────────
export async function fetchPrices(holdings) {
  if (!holdings || holdings.length === 0) return {}

  const results = {}

  // Group by exchange so we can check sessions per exchange
  const byExchange = {}
  for (const h of holdings) {
    const ex = h.exchange || 'NSE'
    if (!byExchange[ex]) byExchange[ex] = []
    byExchange[ex].push(h)
  }

  for (const [exchange, items] of Object.entries(byExchange)) {
    const session = getCurrentSession(exchange)

    for (const holding of items) {
      const { ticker } = holding
      const yahooTicker = toYahooTicker(ticker, exchange)

      // 1. Check Supabase cache
      let cached = null
      try {
        const { data, error } = await supabase
          .from('price_cache')
          .select('*')
          .eq('ticker', ticker)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.warn(`Cache check error for ${ticker}:`, error.message)
        } else {
          cached = data
        }
      } catch (err) {
        console.warn(`Exception checking cache for ${ticker}:`, err.message)
      }

      // Use cache if valid
      if (cached && isCacheValid(cached, session || 'close')) {
        results[ticker] = {
          ticker,
          price:     cached.price,
          prevClose: cached.prev_close,
          changePct: cached.change_pct,
          changeAmt: cached.change_amt,
          shortName: cached.short_name,
          fromCache:  true,
          cachedAt:   cached.fetched_at,
          session:    cached.session,
        }
        continue
      }

      // 2. Only fetch from Yahoo if we're in a valid session window
      //    OR if we have no cache at all (first run)
      if (!session && cached) {
        // Not in a fetch window, use stale cache
        results[ticker] = {
          ticker,
          price:     cached.price,
          prevClose: cached.prev_close,
          changePct: cached.change_pct,
          changeAmt: cached.change_amt,
          shortName: cached.short_name,
          fromCache:  true,
          stale:      true,
          cachedAt:   cached.fetched_at,
          session:    cached.session,
        }
        continue
      }

      // 3. Fetch live from Yahoo Finance
      console.log(`Fetching fresh price for ${ticker} (${yahooTicker})`)
      const quote = await fetchYahooQuote(yahooTicker)
      
      if (!quote) {
        console.warn(`No quote received for ${ticker}`)
        // If we have stale cache, use it as fallback
        if (cached) {
          results[ticker] = { 
            ticker, 
            price: cached.price,
            prevClose: cached.prev_close,
            changePct: cached.change_pct,
            changeAmt: cached.change_amt,
            shortName: cached.short_name,
            fromCache: true, 
            stale: true,
            cachedAt: cached.fetched_at 
          }
        }
        continue
      }

      results[ticker] = {
        ticker,
        price:     quote.price,
        prevClose: quote.prevClose,
        changePct: quote.changePct,
        changeAmt: quote.change,
        shortName: quote.shortName,
        fromCache:  false,
        session:    session || 'close',
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return results
}

// ── Market Indices tickers ─────────────────────────────────────────────────
export const INDEX_TICKERS = [
  { ticker: '^NSEI',  label: 'NIFTY 50',  exchange: 'NSE' },
  { ticker: '^BSESN', label: 'SENSEX',    exchange: 'BSE' },
  { ticker: '^GSPC',  label: 'S&P 500',   exchange: 'NYSE' },
  { ticker: '^IXIC',  label: 'NASDAQ',    exchange: 'NASDAQ' },
]

export async function fetchIndices() {
  const results = {}
  for (const idx of INDEX_TICKERS) {
    const quote = await fetchYahooQuote(idx.ticker)
    if (quote) {
      results[idx.ticker] = { 
        ...quote, 
        label: idx.label, 
        exchange: idx.exchange,
        fromCache: quote.fromCache || false
      }
    }
    await new Promise(r => setTimeout(r, 200))
  }
  return results
}

// ── Next fetch time helper (for UI display) ───────────────────────────────
export function nextFetchTime(exchange = 'NSE') {
  const sched = SCHEDULES[exchange] || SCHEDULES.NSE
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const ist = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60000)
  const h = ist.getHours()
  const m = ist.getMinutes()
  const totalMin = h * 60 + m
  const midMin   = sched.mid.hour   * 60 + sched.mid.minute
  const closeMin = sched.close.hour * 60 + sched.close.minute

  const candidates = [midMin, closeMin].filter(t => t > totalMin)
  if (candidates.length === 0) return 'Tomorrow mid-session'
  const next = Math.min(...candidates)
  const diffMin = next - totalMin
  const hours = Math.floor(diffMin / 60)
  const mins  = diffMin % 60
  return hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`
}