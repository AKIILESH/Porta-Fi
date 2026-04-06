// src/hooks/useTrades.js - UPDATED with fund lots
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { useGetOrCreateHolding, useUpdateHoldingAfterBuy, useUpdateHoldingAfterSell } from './useHoldings'

export function useTrades(userId) {
  return useQuery({
    queryKey: queryKeys.trades(userId),
    queryFn: async () => {
      console.log('📈 Fetching trades...')

      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          holdings (
            name,
            ticker,
            asset_class,
            sub_category,
            exchange
          )
        `)
        .eq('user_id', userId)
        .order('trade_date', { ascending: false })
        .limit(200)

      if (error) throw error

      // Transform to add displayName
      return (data || []).map(trade => ({
        ...trade,
        displayName: trade.holdings?.name || trade.ticker
      }))
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export function useAddTrade(userId) {
  const queryClient = useQueryClient();
  const getOrCreateHolding = useGetOrCreateHolding(userId);
  const updateHoldingAfterBuy = useUpdateHoldingAfterBuy(userId);
  const updateHoldingAfterSell = useUpdateHoldingAfterSell(userId);

  return useMutation({
    mutationFn: async (tradeData) => {
      console.log('➕ Adding trade with data:', tradeData);

      // Validate required fields
      if (!tradeData.ticker) throw new Error('Ticker is required');
      if (!tradeData.quantity) throw new Error('Quantity is required');
      if (!tradeData.price) throw new Error('Price is required');
      if (!tradeData.asset_class) throw new Error('Asset class is required');

      const quantity = Number(tradeData.quantity);
      const price = Number(tradeData.price);
      const total_value = quantity * price;

      // Calculate charges
      const brokerage = Number(tradeData.brokerage) || 0;
      const stt = Number(tradeData.stt) || 0;
      const gst = Number(tradeData.gst) || 0;
      const stamp_duty = Number(tradeData.stamp_duty) || 0;
      const other_charges = Number(tradeData.other_charges) || 0;  // ✅ NOW INCLUDED

      const total_charges = brokerage + stt + gst + stamp_duty + other_charges;

      // Determine if it's a buy or sell to calculate net_amount correctly
      const isBuy = ['buy', 'sip', 'switch_in', 'dividend_reinvest'].includes(tradeData.trade_type);
      const net_amount = isBuy ? total_value + total_charges : total_value - total_charges;

      // STEP 1: Get or create the holding
      const holding = await getOrCreateHolding.mutateAsync({
        ticker: tradeData.ticker,
        name: tradeData.name || tradeData.ticker,
        exchange: tradeData.exchange,
        asset_class: tradeData.asset_class,
        sub_category: tradeData.sub_category,
        currency: tradeData.currency || 'INR',
        isin: tradeData.isin,
        folio_number: tradeData.folio_number,
      });

      console.log('✅ Holding ready:', holding);

      // STEP 2: Update holding quantity and average cost based on trade type
      if (isBuy) {
        // For BUY transactions - update average cost
        const oldQuantity = holding.quantity || 0;
        const oldAvgCost = holding.avg_cost || 0;
        const oldTotalValue = oldQuantity * oldAvgCost;

        const newQuantity = oldQuantity + quantity;
        const newTotalValue = oldTotalValue + total_value;
        const newAvgCost = newTotalValue / newQuantity;

        console.log('🔄 Updating holding after BUY:', {
          oldQuantity,
          oldAvgCost,
          newQuantity,
          newAvgCost,
        });

        await updateHoldingAfterBuy.mutateAsync({
          holdingId: holding.id,
          newQuantity,
          newAvgCost,
        });
      } else {
        // For SELL transactions - just decrease quantity
        const newQuantity = (holding.quantity || 0) - quantity;

        if (newQuantity < 0) {
          throw new Error(`Cannot sell more than you own. You have ${holding.quantity} units.`);
        }

        console.log('🔄 Updating holding after SELL:', {
          oldQuantity: holding.quantity,
          soldQuantity: quantity,
          newQuantity,
        });

        await updateHoldingAfterSell.mutateAsync({
          holdingId: holding.id,
          soldQuantity: quantity,
          remainingQuantity: newQuantity,
        });
      }

      // STEP 3: Remove fields that don't exist in trades table
      const { name, sub_category, currency, isin, folio_number, ...tradeDataForInsert } = tradeData;

      // STEP 4: Insert the trade with all required fields
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          ...tradeDataForInsert,
          holding_id: holding.id,
          user_id: userId,
          total_value,
          net_amount,
          brokerage,
          stt,
          gst,
          stamp_duty,
          other_charges,               // ✅ explicitly included
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Error adding trade:', tradeError);
        throw tradeError;
      }

      console.log('✅ Trade inserted:', trade);

      // STEP 5: If it's a BUY, create a fund lot for tracking
      if (isBuy) {
        try {
          // Get instrument details for exit load
          const { data: instrument } = await supabase
            .from('instruments')
            .select('exit_load_days, exit_load_pct')
            .eq('symbol', tradeData.ticker)
            .maybeSingle();

          // Calculate exit load free date
          const exit_load_free_date = instrument?.exit_load_days
            ? new Date(new Date(tradeData.trade_date).getTime() + instrument.exit_load_days * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
            : null;

          // Create fund lot
          const { error: lotError } = await supabase.from('fund_lots').insert({
            user_id: userId,
            holding_id: holding.id,
            trade_id: trade.id,
            purchase_date: tradeData.trade_date,
            purchase_nav: price,
            units_bought: quantity,
            units_remaining: quantity,
            amount_invested: net_amount,
            exit_load_free_date,
            exit_load_rate: instrument?.exit_load_pct || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (lotError) {
            console.error('Error creating fund lot:', lotError);
            // Don't throw - trade already succeeded, just log error
          } else {
            console.log('✅ Fund lot created for purchase');
          }
        } catch (lotError) {
          console.error('Exception creating fund lot:', lotError);
        }
      } else {
        // For SELL transactions, update fund lots (FIFO)
        try {
          const { data: lots } = await supabase
            .from('fund_lots')
            .select('*')
            .eq('user_id', userId)
            .eq('holding_id', holding.id)
            .eq('is_fully_sold', false)
            .order('purchase_date', { ascending: true });

          if (lots && lots.length > 0) {
            let remainingToSell = quantity;
            const updates = [];

            for (const lot of lots) {
              if (remainingToSell <= 0) break;
              const unitsFromThisLot = Math.min(lot.units_remaining, remainingToSell);
              const newRemaining = lot.units_remaining - unitsFromThisLot;
              const isFullySold = newRemaining <= 0;

              updates.push(
                supabase
                  .from('fund_lots')
                  .update({
                    units_remaining: Math.max(0, newRemaining),
                    is_fully_sold: isFullySold,
                    closed_date: isFullySold ? tradeData.trade_date : null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', lot.id)
              );
              remainingToSell -= unitsFromThisLot;
            }
            await Promise.all(updates);
            console.log('✅ Fund lots updated for sale');
          }
        } catch (lotError) {
          console.error('Error updating fund lots for sale:', lotError);
        }
      }

      return trade;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Trade added successfully:', data);
      queryClient.invalidateQueries({ queryKey: queryKeys.trades(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) });
      queryClient.invalidateQueries({ queryKey: ['fundLots', userId] });
    },
    onError: (error) => {
      console.error('❌ Error in useAddTrade:', error);
    },
  });
}

// Get all fund lots for a user
export function useFundLots(userId, holdingId = null) {
  return useQuery({
    queryKey: ['fundLots', userId, holdingId],
    queryFn: async () => {
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

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

// Get exit load status for a specific lot
export function useLotExitStatus(lotId) {
  return useQuery({
    queryKey: ['lotExitStatus', lotId],
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
        status,
        daysRemaining,
        exitLoadAmount,
        isLocked: status === 'locked',
      }
    },
    enabled: !!lotId,
  })
}