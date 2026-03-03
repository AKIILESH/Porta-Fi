// src/hooks/useCashAccounts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useCashAccounts(userId) {
  return useQuery({
    queryKey: queryKeys.cashAccounts(userId),
    queryFn: async () => {
      console.log('💰 Fetching cash accounts...')
      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  })
}

export function useAddCashAccount(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountData) => {
      console.log('➕ Adding cash account:', accountData)
      const { data, error } = await supabase
        .from('cash_accounts')
        .insert([{
          ...accountData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashAccounts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}

export function useUpdateCashAccount(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      console.log('✏️ Updating cash account:', id, updates)
      const { data, error } = await supabase
        .from('cash_accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashAccounts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}

export function useDeleteCashAccount(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting cash account:', id)
      const { error } = await supabase
        .from('cash_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashAccounts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}