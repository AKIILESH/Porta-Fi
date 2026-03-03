// src/hooks/useSipPlans.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useSipPlans(userId) {
  return useQuery({
    queryKey: queryKeys.sipPlans(userId),
    queryFn: async () => {
      console.log('🔄 Fetching SIP plans...')
      const { data, error } = await supabase
        .from('sip_plans')
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

export function useAddSipPlan(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sipData) => {
      console.log('➕ Adding SIP plan:', sipData)
      const { data, error } = await supabase
        .from('sip_plans')
        .insert({ ...sipData, user_id: userId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sipPlans(userId) })
    },
  })
}