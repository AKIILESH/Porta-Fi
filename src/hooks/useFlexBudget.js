// src/hooks/useFlexBudget.js
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { useFinance } from '../context/FinanceContext'

// Flex fund structure
export function useFlexBudget(userId, month) {
  const queryClient = useQueryClient()
  const [draggingCategory, setDraggingCategory] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(null)

  // Fetch budget limits
  const { data: budgetLimits = [], isLoading: limitsLoading } = useQuery({
    queryKey: queryKeys.budgetLimits(userId, month),
    queryFn: async () => {
      console.log(`💰 Fetching budget limits for ${month}...`)
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!month,
  })

  // Fetch transactions for the month
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', userId, month],
    queryFn: async () => {
      console.log(`📋 Fetching transactions for ${month}...`)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${month}-01`)
        .lte('date', `${month}-31`)
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!month,
  })

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const spending = {}
    transactions.forEach(t => {
      if (t.amount < 0) {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount)
      }
    })
    return spending
  }, [transactions])

  // Create a flex fund that combines all categories with their limits and spending
  const flexFund = useMemo(() => {
    const categories = {}
    let totalAllocated = 0
    let totalSpent = 0
    let flexReserve = 0

    budgetLimits.forEach(limit => {
      const spent = spendingByCategory[limit.category] || 0
      const remaining = limit.monthly_limit - spent
      const isOver = spent > limit.monthly_limit
      const overAmount = isOver ? spent - limit.monthly_limit : 0
      
      categories[limit.category] = {
        id: limit.id,
        limit: limit.monthly_limit,
        spent,
        remaining: isOver ? 0 : remaining,
        overAmount,
        isOver,
        percentUsed: (spent / limit.monthly_limit) * 100,
        borrowFrom: [], // Categories that can lend to this one
        lendTo: []      // Categories that need borrowing
      }

      totalAllocated += limit.monthly_limit
      totalSpent += spent
      
      if (!isOver && remaining > 0) {
        flexReserve += remaining
      }
    })

    // Add a special "Flex Reserve" category for rollover
    categories['Flex Reserve'] = {
      id: 'flex-reserve',
      limit: flexReserve,
      spent: 0,
      remaining: flexReserve,
      isOver: false,
      percentUsed: 0,
      isFlexReserve: true
    }

    return {
      categories,
      totalAllocated,
      totalSpent,
      flexReserve,
      month
    }
  }, [budgetLimits, spendingByCategory, month])

  // Check for overspending and generate suggestions
  const overspentCategories = useMemo(() => {
    return Object.entries(flexFund.categories)
      .filter(([_, data]) => data.isOver)
      .map(([name, data]) => ({
        name,
        amount: data.overAmount,
        ...data
      }))
  }, [flexFund])

  const availableSurplus = useMemo(() => {
    return Object.entries(flexFund.categories)
      .filter(([_, data]) => !data.isOver && data.remaining > 0 && !data.isFlexReserve)
      .map(([name, data]) => ({
        name,
        remaining: data.remaining,
        ...data
      }))
  }, [flexFund])

  // Use useEffect for side effects instead of useMemo
  useEffect(() => {
    if (overspentCategories.length > 0 && availableSurplus.length > 0) {
      setShowSuggestion({
        overspent: overspentCategories[0],
        available: availableSurplus
      })
    } else {
      setShowSuggestion(null)
    }
  }, [overspentCategories, availableSurplus])

  // Drag and drop rebalancing
  const startDrag = useCallback((category) => {
    setDraggingCategory(category)
  }, [])

  const dropToRebalance = useCallback(async (fromCategory, toCategory, amount) => {
    if (!fromCategory || !toCategory) return

    console.log(`🔄 Rebalancing: Moving ${amount} from ${fromCategory} to ${toCategory}`)

    // Here you would implement the actual database update
    // For now, we'll just invalidate the queries to refresh data
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.budgetLimits(userId, month) 
    })
    
    setDraggingCategory(null)
  }, [userId, month, queryClient])

  // Accept suggestion to cover overspend
  const acceptSuggestion = useCallback(async (fromCategory, amount) => {
    if (!showSuggestion) return

    await dropToRebalance(
      fromCategory.name,
      showSuggestion.overspent.name,
      amount
    )
    setShowSuggestion(null)
  }, [showSuggestion, dropToRebalance])

  // Rollover unused budget to next month
  const rolloverToNextMonth = useMutation({
    mutationFn: async () => {
      const nextMonth = getNextMonth(month)
      
      // Calculate surplus from current month
      const surplus = {}
      Object.entries(flexFund.categories).forEach(([name, data]) => {
        if (!data.isOver && !data.isFlexReserve && data.remaining > 0) {
          surplus[name] = data.remaining
        }
      })

      // Create next month's budget with rollover
      for (const [category, amount] of Object.entries(surplus)) {
        await supabase
          .from('budget_limits')
          .upsert({
            user_id: userId,
            category,
            monthly_limit: amount,
            month: nextMonth
          }, {
            onConflict: 'user_id,category,month'
          })
      }

      return surplus
    },
    onSuccess: () => {
      const nextMonth = getNextMonth(month)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.budgetLimits(userId, nextMonth) 
      })
    }
  })

  return {
    flexFund,
    overspentCategories,
    availableSurplus,
    showSuggestion,
    draggingCategory,
    startDrag,
    dropToRebalance,
    acceptSuggestion,
    rolloverToNextMonth: rolloverToNextMonth.mutate,
    isRollingOver: rolloverToNextMonth.isPending,
    isLoading: limitsLoading || transactionsLoading
  }
}

function getNextMonth(month) {
  const [year, monthNum] = month.split('-').map(Number)
  const nextMonth = new Date(year, monthNum, 1)
  return nextMonth.toISOString().slice(0, 7)
}