// src/hooks/useTrades.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { useGetOrCreateHolding } from './useHoldings'

export function useTrades(userId) {
  return useQuery({
    queryKey: queryKeys.trades(userId),
    queryFn: async () => {
      console.log('📈 Fetching trades...')
      
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          holdings (
            name,
            ticker,
            asset_class,
            sub_category,
            exchange
          )
        `)
        .eq('user_id', userId)
        .order('trade_date', { ascending: false })
        .limit(200)
      
      if (error) throw error
      
      // Transform to add displayName
      return (data || []).map(trade => ({
        ...trade,
        displayName: trade.holdings?.name || trade.ticker
      }))
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export function useAddTrade(userId) {
  const queryClient = useQueryClient()
  const getOrCreateHolding = useGetOrCreateHolding(userId)

  return useMutation({
    mutationFn: async (tradeData) => {
      console.log('➕ Adding trade with data:', tradeData)
      
      // Validate required fields
      if (!tradeData.ticker) throw new Error('Ticker is required')
      if (!tradeData.quantity) throw new Error('Quantity is required')
      if (!tradeData.price) throw new Error('Price is required')
      if (!tradeData.asset_class) throw new Error('Asset class is required')
      
      // Calculate required values
      const quantity = Number(tradeData.quantity)
      const price = Number(tradeData.price)
      const total_value = quantity * price
      
      // Calculate charges
      const brokerage = Number(tradeData.brokerage) || 0
      const stt = Number(tradeData.stt) || 0
      const gst = Number(tradeData.gst) || 0
      const stamp_duty = Number(tradeData.stamp_duty) || 0
      const other_charges = Number(tradeData.other_charges) || 0
      
      const total_charges = brokerage + stt + gst + stamp_duty + other_charges
      
      // Determine if it's a buy or sell to calculate net_amount correctly
      const isBuy = ['buy', 'sip', 'switch_in', 'dividend_reinvest'].includes(tradeData.trade_type)
      const net_amount = isBuy ? total_value + total_charges : total_value - total_charges
      
      // STEP 1: Get or create the holding (this stores all the metadata)
      const holding = await getOrCreateHolding.mutateAsync({
        ticker: tradeData.ticker,
        name: tradeData.name || tradeData.ticker,
        exchange: tradeData.exchange,
        asset_class: tradeData.asset_class,
        sub_category: tradeData.sub_category,
        currency: tradeData.currency || 'INR',
        isin: tradeData.isin,
        folio_number: tradeData.folio_number,
      })
      
      console.log('✅ Holding ready:', holding)
      
      // STEP 2: Remove ONLY fields that don't exist in trades table
      const { 
        name, 
        sub_category, 
        currency, 
        isin, 
        folio_number,
        ...tradeDataForInsert 
      } = tradeData
      
      console.log('📝 Trade data for insert:', tradeDataForInsert)
      
      // STEP 3: Insert the trade with all required fields
      const { data, error } = await supabase
        .from('trades')
        .insert({ 
          ...tradeDataForInsert, 
          holding_id: holding.id,
          user_id: userId,
          total_value, // Required field
          net_amount,  // Required field
          brokerage,
          stt,
          gst,
          stamp_duty,
          other_charges,
          created_at: new Date().toISOString() 
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding trade:', error)
        throw error
      }
      
      console.log('✅ Trade inserted:', data)
      return data
    },
    onSuccess: (data) => {
      console.log('✅ Trade added successfully:', data)
      queryClient.invalidateQueries({ queryKey: queryKeys.trades(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
    onError: (error) => {
      console.error('❌ Error in useAddTrade:', error)
    }
  })
}