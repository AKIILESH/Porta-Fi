// src/hooks/useHoldings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useHoldings(userId) {
  return useQuery({
    queryKey: queryKeys.holdings(userId),
    queryFn: async () => {
      console.log('📊 Fetching holdings...')
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
      
      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId,
  })
}

export function useDeleteHolding(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (holdingId) => {
      console.log('🗑️ Deleting holding:', holdingId)
      const { error } = await supabase
        .from('holdings')
        .delete()
        .eq('id', holdingId)
      
      if (error) throw error
      return holdingId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
  })
}