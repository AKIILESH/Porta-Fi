// src/hooks/useFundLots.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// Get all lots for a user
export function useFundLots(userId, options = {}) {
  const { holdingId, activeOnly = true } = options

  return useQuery({
    queryKey: ['fundLots', userId, { holdingId, activeOnly }],
    queryFn: async () => {
      console.log('📦 Fetching fund lots...')
      
      let query = supabase
        .from('fund_lots')
        .select(`
          *,
          holdings (
            ticker,
            name,
            exchange,
            asset_class
          )
        `)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: true })

      if (holdingId) {
        query = query.eq('holding_id', holdingId)
      }

      if (activeOnly) {
        query = query.eq('is_fully_sold', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

// Create lots from a buy trade
export function useCreateLotsFromTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trade, holding, instrument }) => {
      console.log('🏗️ Creating fund lot from trade:', trade)

      const exit_load_free_date = instrument?.exit_load_days > 0
        ? new Date(new Date(trade.trade_date).getTime() + (instrument.exit_load_days * 24 * 60 * 60 * 1000))
          .toISOString().split('T')[0]
        : null

      const { data, error } = await supabase
        .from('fund_lots')
        .insert({
          user_id: trade.user_id,
          holding_id: holding.id,
          trade_id: trade.id,
          purchase_date: trade.trade_date,
          purchase_nav: trade.price,
          units_bought: trade.quantity,
          units_remaining: trade.quantity,
          amount_invested: trade.net_amount || (trade.quantity * trade.price),
          exit_load_free_date,
          exit_load_rate: instrument?.exit_load_pct || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating fund lot:', error)
        throw error
      }

      console.log('✅ Fund lot created:', data)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['fundLots', variables.trade.user_id] 
      })
    },
  })
}

// Sell from specific lots (FIFO or specific selection)
export function useSellFromLots(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sellTransactions }) => {
      console.log('💰 Selling from lots:', sellTransactions)

      const results = []

      for (const transaction of sellTransactions) {
        const { lotId, unitsSold, sellPrice, sellDate } = transaction

        // Get the current lot
        const { data: lot, error: fetchError } = await supabase
          .from('fund_lots')
          .select('*')
          .eq('id', lotId)
          .single()

        if (fetchError) throw fetchError

        const newRemaining = lot.units_remaining - unitsSold
        const isFullySold = newRemaining <= 0

        // Calculate realized gain
        const costBasis = unitsSold * lot.purchase_nav
        const saleValue = unitsSold * sellPrice
        const realizedGain = saleValue - costBasis

        // Update the lot
        const { data: updatedLot, error: updateError } = await supabase
          .from('fund_lots')
          .update({
            units_remaining: Math.max(0, newRemaining),
            is_fully_sold: isFullySold,
            closed_date: isFullySold ? sellDate : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lotId)
          .select()
          .single()

        if (updateError) throw updateError

        results.push({
          ...updatedLot,
          unitsSold,
          realizedGain,
        })
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundLots', userId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
  })
}

// Get FIFO lots available for selling
export function useFifoLots(userId, holdingId, sellQuantity) {
  return useQuery({
    queryKey: ['fifoLots', userId, holdingId, sellQuantity],
    queryFn: async () => {
      console.log('📋 Getting FIFO lots for selling:', { holdingId, sellQuantity })

      const { data, error } = await supabase
        .from('fund_lots')
        .select('*')
        .eq('user_id', userId)
        .eq('holding_id', holdingId)
        .eq('is_fully_sold', false)
        .order('purchase_date', { ascending: true })

      if (error) throw error

      // Calculate which lots will be sold (FIFO)
      let remainingToSell = sellQuantity
      const lotsToSell = []

      for (const lot of data) {
        if (remainingToSell <= 0) break

        const unitsFromThisLot = Math.min(lot.units_remaining, remainingToSell)
        lotsToSell.push({
          lotId: lot.id,
          unitsToSell: unitsFromThisLot,
          purchaseDate: lot.purchase_date,
          purchaseNav: lot.purchase_nav,
          exitLoadFreeDate: lot.exit_load_free_date,
        })

        remainingToSell -= unitsFromThisLot
      }

      return {
        lots: data,
        lotsToSell,
        canSell: remainingToSell === 0,
        shortfall: remainingToSell > 0 ? remainingToSell : 0,
      }
    },
    enabled: !!userId && !!holdingId && sellQuantity > 0,
  })
}

// Check exit load status for a lot
export function useExitLoadStatus(lotId) {
  return useQuery({
    queryKey: ['exitLoadStatus', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fund_lots')
        .select('*')
        .eq('id', lotId)
        .single()

      if (error) throw error

      const today = new Date()
      const freeDate = data.exit_load_free_date ? new Date(data.exit_load_free_date) : null
      
      let status = 'no_exit_load'
      let daysRemaining = 0
      let exitLoadAmount = 0

      if (freeDate) {
        const diffTime = freeDate - today
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (daysRemaining > 0) {
          status = 'locked'
          exitLoadAmount = data.units_remaining * data.purchase_nav * (data.exit_load_rate / 100)
        } else {
          status = 'free'
        }
      }

      return {
        ...data,
        exitLoadStatus: status,
        daysRemaining,
        exitLoadAmount,
        isLocked: status === 'locked',
      }
    },
    enabled: !!lotId,
  })
}