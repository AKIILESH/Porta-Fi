// src/hooks/useBudgetAllocation.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// No more default allocations or percentages
// Just a simple structure to store user preferences if they want
const DEFAULT_ALLOCATION = {
  categories: {} // Will store any user-defined targets (optional)
}

export function useBudgetAllocation(userId, month) {
  return useQuery({
    queryKey: queryKeys.budget(userId, month),
    queryFn: async () => {
      console.log(`💰 Fetching data for ${month}...`)
      
      // Get user's income and expenses for the month
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${month}-01`)
        .lte('date', `${month}-31`)
      
      if (txError) throw txError
      
      // Calculate simple totals
      const income = transactions?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      const expenses = transactions?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
      
      // Group spending by category (simple object)
      const spendingByCategory = {}
      transactions?.forEach(t => {
        if (t.amount < 0) {
          const cat = t.category || 'Other'
          spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Math.abs(Number(t.amount))
        }
      })
      
      // Group income by category
      const incomeByCategory = {}
      transactions?.forEach(t => {
        if (t.amount > 0) {
          const cat = t.category || 'Other Income'
          incomeByCategory[cat] = (incomeByCategory[cat] || 0) + Number(t.amount)
        }
      })
      
      // Get any user preferences (optional targets they set)
      const { data: preferences } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle()
      
      return {
        month,
        income,
        expenses,
        balance: income - expenses,
        spendingByCategory,
        incomeByCategory,
        transactions: transactions || [],
        preferences: preferences?.allocations?.categories || {} // Optional targets
      }
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && !!month,
  })
}

// Optional: Save user preferences if they want to set targets
export function useSaveCategoryTargets(userId) {
  const queryClient = useQueryClient()
  const month = new Date().toISOString().slice(0, 7)

  return useMutation({
    mutationFn: async ({ categoryTargets }) => {
      const { data, error } = await supabase
        .from('budget_allocations')
        .upsert({
          user_id: userId,
          month,
          allocations: { categories: categoryTargets },
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.budget(userId, month) 
      })
    },
  })
}