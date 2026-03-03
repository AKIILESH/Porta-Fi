// src/hooks/useIndices.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useIndices() {
  return useQuery({
    queryKey: queryKeys.indices(),
    queryFn: async () => {
      console.log('🌍 Fetching market indices...')
      
      // First, try to get from cache
      const { data: cached } = await supabase
        .from('price_cache')
        .select('*')
        .in('ticker', ['^NSEI', '^BSESN', '^GSPC', '^IXIC'])
        .order('fetched_at', { ascending: false })
        .limit(4)

      // If we have cached data and it's fresh enough, use it
      if (cached && cached.length > 0) {
        const cacheAge = Date.now() - new Date(cached[0].fetched_at).getTime()
        if (cacheAge < 5 * 60 * 1000) { // 5 minutes
          console.log('📦 Using cached indices')
          
          // Create a map of the latest price for each ticker
          const latestPrices = {}
          cached.forEach(item => {
            if (!latestPrices[item.ticker] || new Date(item.fetched_at) > new Date(latestPrices[item.ticker].fetched_at)) {
              latestPrices[item.ticker] = item
            }
          })
          
          return Object.values(latestPrices).reduce((acc, item) => ({
            ...acc,
            [item.ticker]: {
              price: item.price,
              changePct: item.change_pct,
              label: item.ticker === '^NSEI' ? 'NIFTY 50' : 
                     item.ticker === '^BSESN' ? 'SENSEX' :
                     item.ticker === '^GSPC' ? 'S&P 500' : 'NASDAQ',
              fromCache: true,
              fetched_at: item.fetched_at
            }
          }), {})
        }
      }

      // If cache is stale or missing, fetch fresh data but DON'T cache it
      console.log('🌐 Fetching fresh indices from API (not caching)...')
      
      const tickers = ['^NSEI', '^BSESN', '^GSPC', '^IXIC']
      const results = {}
      
      for (const ticker of tickers) {
        try {
          const response = await fetch(
            'https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ ticker })
            }
          )
          
          const data = await response.json()
          const meta = data?.chart?.result?.[0]?.meta
          
          if (meta) {
            results[ticker] = {
              price: meta.regularMarketPrice,
              changePct: ((meta.regularMarketPrice - (meta.previousClose || meta.regularMarketPrice)) / (meta.previousClose || meta.regularMarketPrice)) * 100,
              label: ticker === '^NSEI' ? 'NIFTY 50' : 
                     ticker === '^BSESN' ? 'SENSEX' :
                     ticker === '^GSPC' ? 'S&P 500' : 'NASDAQ',
              fromCache: false
            }
          }
        } catch (error) {
          console.error(`Error fetching ${ticker}:`, error)
        }
      }
      
      return results
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  })
}