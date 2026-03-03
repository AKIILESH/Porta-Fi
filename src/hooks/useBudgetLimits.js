// src/hooks/useBudgetLimits.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useBudgetLimits(userId, month) {
  return useQuery({
    queryKey: queryKeys.budgetLimits(userId, month),
    queryFn: async () => {
      console.log(`📊 Fetching budget limits for ${month}...`)
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!month,
  })
}

export function useSetBudgetLimit(userId) {
  const queryClient = useQueryClient()
  const month = new Date().toISOString().slice(0, 7)

  return useMutation({
    mutationFn: async ({ category, limit }) => {
      console.log('📝 Setting budget limit:', category, limit)
      const { data, error } = await supabase
        .from('budget_limits')
        .upsert(
          { user_id: userId, category, monthly_limit: limit, month },
          { onConflict: 'user_id,category,month' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetLimits(userId, month) })
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(userId, month) })
    },
  })
}