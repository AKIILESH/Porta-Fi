// src/hooks/useIndices.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// Helper to calculate returns from stored data
function calculateReturnsFromData(item) {
  // If returns_1y already exists in the database, use it
  if (item.returns_1y) {
    return item.returns_1y;
  }
  
  // Otherwise return null (will be populated by admin)
  return null;
}

export function useIndices() {
  return useQuery({
    queryKey: queryKeys.indices(),
    queryFn: async () => {
      console.log('🌍 Fetching market indices from database only...')
      
      const tickers = ['^NSEI', '^BSESN', '^GSPC', '^IXIC']
      
      // Get the latest data for each ticker from price_cache
      const results = {}
      
      for (const ticker of tickers) {
        // Get the most recent entry for this ticker
        const { data, error } = await supabase
          .from('price_cache')
          .select('*')
          .eq('ticker', ticker)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (error) {
          console.error(`❌ Error fetching ${ticker}:`, error)
          continue
        }
        
        if (data) {
          console.log(`📊 Found data for ${ticker}:`, {
            price: data.price,
            fetched_at: data.fetched_at,
            hasReturns: !!data.returns_1y,
            annualizedReturn: data.returns_1y?.annualized ? (data.returns_1y.annualized * 100).toFixed(2) + '%' : 'N/A'
          })
          
          results[ticker] = {
            price: data.price,
            changePct: data.change_pct,
            change: data.change_amt,
            label: ticker === '^NSEI' ? 'NIFTY 50' : 
                   ticker === '^BSESN' ? 'SENSEX' :
                   ticker === '^GSPC' ? 'S&P 500' : 'NASDAQ',
            returns_1y: data.returns_1y, // This will be used for alpha calculation
            fromCache: true,
            fetched_at: data.fetched_at
          }
        } else {
          console.log(`⚠️ No data found for ${ticker} in price_cache`)
          results[ticker] = null
        }
      }
      
      console.log('📊 Final indices data:', {
        nifty: results['^NSEI'] ? {
          price: results['^NSEI'].price,
          returns: results['^NSEI'].returns_1y?.annualized
        } : '❌',
        sp500: results['^GSPC'] ? {
          price: results['^GSPC'].price,
          returns: results['^GSPC'].returns_1y?.annualized
        } : '❌'
      })
      
      return results
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to check for updates
  })
}