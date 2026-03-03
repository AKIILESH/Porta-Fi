// src/hooks/useDebts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useDebts(userId) {
  return useQuery({
    queryKey: queryKeys.debts(userId),
    queryFn: async () => {
      console.log('💳 Fetching debts...')
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export function useAddDebt(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (debtData) => {
      console.log('➕ Adding debt:', debtData)
      const { data, error } = await supabase
        .from('debts')
        .insert({ ...debtData, user_id: userId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}

export function useUpdateDebt(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      console.log('✏️ Updating debt:', id, updates)
      const { data, error } = await supabase
        .from('debts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}

export function useDeleteDebt(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting debt:', id)
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}