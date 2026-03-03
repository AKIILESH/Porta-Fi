// src/hooks/useTrades.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useTrades(userId) {
  return useQuery({
    queryKey: queryKeys.trades(userId),
    queryFn: async () => {
      console.log('📈 Fetching trades...')
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: false })
        .limit(200)
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export function useAddTrade(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tradeData) => {
      console.log('➕ Adding trade:', tradeData)
      
      const { data, error } = await supabase
        .from('trades')
        .insert({ 
          ...tradeData, 
          user_id: userId,
          created_at: new Date().toISOString() 
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trades(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
  })
}