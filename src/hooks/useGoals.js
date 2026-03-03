// src/hooks/useGoals.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useGoals(userId) {
  return useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: async () => {
      console.log('🎯 Fetching goals...')
      const { data, error } = await supabase
        .from('goals')
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

export function useAddGoal(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goalData) => {
      console.log('➕ Adding goal:', goalData)
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goalData, user_id: userId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) })
    },
  })
}

export function useUpdateGoal(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      console.log('✏️ Updating goal:', id, updates)
      const { data, error } = await supabase
        .from('goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) })
    },
  })
}

export function useDeleteGoal(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting goal:', id)
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) })
    },
  })
}