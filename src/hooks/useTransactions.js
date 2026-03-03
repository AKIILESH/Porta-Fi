// src/hooks/useTransactions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useTransactions(userId, month, page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  return useQuery({
    queryKey: queryKeys.transactions(userId, month, page),
    queryFn: async () => {
      console.log(`📋 Fetching transactions for ${month || 'all'}, page ${page}...`)
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(start, end)

      if (month) {
        query = query
          .gte('date', `${month}-01`)
          .lte('date', `${month}-31`)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { 
        data: data || [], 
        count: count || 0, 
        page, 
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    keepPreviousData: true,
  })
}

export function useAddTransaction(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction) => {
      console.log('➕ Adding transaction:', transaction)
      
      // Insert transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert({ 
          ...transaction, 
          user_id: userId,
          created_at: new Date().toISOString() 
        })
        .select()
        .single()

      if (error) throw error

      // Update account balance
      const { data: account } = await supabase
        .from('cash_accounts')
        .select('balance')
        .eq('id', transaction.account_id)
        .single()

      if (account) {
        const newBalance = Number(account.balance) + Number(transaction.amount)
        await supabase
          .from('cash_accounts')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.account_id)
      }

      return data
    },
    onSuccess: (data, variables) => {
      const month = variables.date?.substring(0, 7)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId, month) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cashAccounts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(userId, month) })
    },
  })
}

export function useDeleteTransaction(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, transaction }) => {
      console.log('🗑️ Deleting transaction:', id)
      
      // Delete transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Reverse balance change
      if (transaction?.account_id) {
        const { data: account } = await supabase
          .from('cash_accounts')
          .select('balance')
          .eq('id', transaction.account_id)
          .single()

        if (account) {
          const newBalance = Number(account.balance) - Number(transaction.amount)
          await supabase
            .from('cash_accounts')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.account_id)
        }
      }

      return id
    },
    onSuccess: (_, variables) => {
      const month = variables.transaction?.date?.substring(0, 7)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId, month) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cashAccounts(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
    },
  })
}