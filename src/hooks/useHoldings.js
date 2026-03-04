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

export function useGetOrCreateHolding(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (holdingData) => {
      console.log('🔍 Getting or creating holding:', holdingData)
      
      // First, check if holding exists
      const { data: existing } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId)
        .eq('ticker', holdingData.ticker)
        .eq('exchange', holdingData.exchange)
        .maybeSingle()
      
      if (existing) {
        console.log('✅ Found existing holding:', existing)
        return existing
      }
      
      // If not, create new holding
      console.log('➕ Creating new holding for:', holdingData.ticker)
      const { data: newHolding, error } = await supabase
        .from('holdings')
        .insert({
          user_id: userId,
          ticker: holdingData.ticker,
          name: holdingData.name || holdingData.ticker,
          exchange: holdingData.exchange,
          asset_class: holdingData.asset_class,
          sub_category: holdingData.sub_category || null,
          quantity: 0,
          avg_cost: 0,
          currency: holdingData.currency || 'INR',
          isin: holdingData.isin || null,
          folio_number: holdingData.folio_number || null,
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Created new holding:', newHolding)
      
      // Invalidate holdings query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      
      return newHolding
    },
  })
}

export function useUpdateHolding(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      console.log('✏️ Updating holding:', id, updates)
      const { data, error } = await supabase
        .from('holdings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
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