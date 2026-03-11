// src/hooks/useTransactions.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useTransactions(userId, filters = {}, page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  
  // Destructure filters
  const { month, startDate, endDate } = filters

  return useQuery({
    queryKey: queryKeys.transactions(userId, { month, startDate, endDate, page }),
    queryFn: async () => {
      console.log(`📋 Fetching transactions...`, { month, startDate, endDate, page })
      
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(start, end)

      // Apply month filter if provided
      if (month) {
        query = query
          .gte('date', `${month}-01`)
          .lte('date', `${month}-31`)
      }
      
      // Apply custom date range if provided
      if (startDate && endDate) {
        query = query
          .gte('date', startDate)
          .lte('date', endDate)
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId,
    keepPreviousData: true,
  })
}

// Hook to get all transactions for a date range (no pagination)
export function useTransactionsRange(userId, startDate, endDate) {
  return useQuery({
    queryKey: ['transactions', userId, 'range', startDate, endDate],
    queryFn: async () => {
      console.log(`📋 Fetching all transactions from ${startDate} to ${endDate}...`)
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['cashAccounts', userId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['cashAccounts', userId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
    },
  })
}