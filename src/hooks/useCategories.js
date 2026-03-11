// src/hooks/useCategories.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFinance } from '../context/FinanceContext'

// Default categories that users can customize
export const DEFAULT_CATEGORIES = {
  expense: [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Transportation',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Rent',
    'EMI & Loans',
    'Insurance',
    'Investments',
    'Gifts & Donations',
    'Personal Care',
    'Home & Maintenance',
    'Fitness',
    'Subscriptions',
    'Taxes',
    'Miscellaneous'
  ],
  income: [
    'Salary',
    'Freelance',
    'Business',
    'Investment Returns',
    'Rental Income',
    'Gift',
    'Refund',
    'Bonus',
    'Side Hustle',
    'Other Income'
  ]
}

export function useCategories() {
  const { userId } = useFinance()
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load custom categories from database
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('user_categories')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setCategories({
            expense: data.expense_categories || DEFAULT_CATEGORIES.expense,
            income: data.income_categories || DEFAULT_CATEGORIES.income
          })
        } else {
          // If no custom categories exist, create default ones
          await createDefaultCategories()
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [userId])

  // Create default categories for new user
  const createDefaultCategories = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('user_categories')
        .insert({
          user_id: userId,
          expense_categories: DEFAULT_CATEGORIES.expense,
          income_categories: DEFAULT_CATEGORIES.income
        })

      if (error) throw error
    } catch (error) {
      console.error('Error creating default categories:', error)
    }
  }

  // Save custom categories
  const saveCategories = useCallback(async (newCategories) => {
    if (!userId) return false

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('user_categories')
        .upsert({
          user_id: userId,
          expense_categories: newCategories.expense,
          income_categories: newCategories.income,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setCategories(newCategories)
      return true
    } catch (error) {
      console.error('Error saving categories:', error)
      setError(error.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [userId])

  // Add a new expense category
  const addExpenseCategory = useCallback(async (newCategory) => {
    if (!newCategory.trim()) return false
    
    const updated = {
      ...categories,
      expense: [...categories.expense, newCategory.trim()]
    }
    
    return await saveCategories(updated)
  }, [categories, saveCategories])

  // Add a new income category
  const addIncomeCategory = useCallback(async (newCategory) => {
    if (!newCategory.trim()) return false
    
    const updated = {
      ...categories,
      income: [...categories.income, newCategory.trim()]
    }
    
    return await saveCategories(updated)
  }, [categories, saveCategories])

  // Delete an expense category
  const deleteExpenseCategory = useCallback(async (categoryToDelete) => {
    const updated = {
      ...categories,
      expense: categories.expense.filter(c => c !== categoryToDelete)
    }
    
    return await saveCategories(updated)
  }, [categories, saveCategories])

  // Delete an income category
  const deleteIncomeCategory = useCallback(async (categoryToDelete) => {
    const updated = {
      ...categories,
      income: categories.income.filter(c => c !== categoryToDelete)
    }
    
    return await saveCategories(updated)
  }, [categories, saveCategories])

  // Rename a category
  const renameCategory = useCallback(async (type, oldName, newName) => {
    if (!newName.trim() || oldName === newName) return false
    
    const updated = {
      ...categories,
      [type]: categories[type].map(c => c === oldName ? newName.trim() : c)
    }
    
    // Also need to update any transactions using this category
    if (userId) {
      try {
        await supabase
          .from('transactions')
          .update({ category: newName.trim() })
          .eq('user_id', userId)
          .eq('category', oldName)
      } catch (error) {
        console.error('Error updating transactions with new category:', error)
      }
    }
    
    return await saveCategories(updated)
  }, [categories, userId, saveCategories])

  // Reset to default categories
  const resetToDefault = useCallback(async () => {
    return await saveCategories(DEFAULT_CATEGORIES)
  }, [saveCategories])

  // Get category usage stats (how many transactions use each category)
  const getCategoryStats = useCallback(async () => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)

      if (error) throw error

      const stats = {
        expense: {},
        income: {}
      }

      data?.forEach(t => {
        const type = t.amount > 0 ? 'income' : 'expense'
        const cat = t.category
        if (!stats[type][cat]) {
          stats[type][cat] = { count: 0, total: 0 }
        }
        stats[type][cat].count++
        stats[type][cat].total += Math.abs(t.amount)
      })

      return stats
    } catch (error) {
      console.error('Error getting category stats:', error)
      return null
    }
  }, [userId])

  return {
    categories,
    loading,
    saving,
    error,
    addExpenseCategory,
    addIncomeCategory,
    deleteExpenseCategory,
    deleteIncomeCategory,
    renameCategory,
    resetToDefault,
    getCategoryStats,
    saveCategories
  }
}

// Optional: Hook to get just expense categories
export function useExpenseCategories() {
  const { categories, loading, error } = useCategories()
  return {
    categories: categories?.expense || [],
    loading,
    error
  }
}

// Optional: Hook to get just income categories
export function useIncomeCategories() {
  const { categories, loading, error } = useCategories()
  return {
    categories: categories?.income || [],
    loading,
    error
  }
}