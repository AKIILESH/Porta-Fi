// src/hooks/useInstruments.js
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

// Get all instruments (admin use)
export function useInstruments(options = {}) {
  const {
    assetClass,
    exchange,
    searchTerm,
    activeOnly = false,
    enabled = true,
  } = options

  return useQuery({
    queryKey: queryKeys.instruments.list({ assetClass, exchange, searchTerm, activeOnly }),
    queryFn: async () => {
      console.log('📊 Fetching instruments...', { assetClass, exchange, searchTerm })
      
      let query = supabase
        .from('instruments')
        .select('*')
        .order('symbol', { ascending: true })

      if (assetClass && assetClass !== 'all') {
        query = query.eq('asset_class', assetClass)
      }

      if (exchange && exchange !== 'all') {
        query = query.eq('exchange', exchange)
      }

      if (activeOnly) {
        // You might have an 'active' column, or we can filter by existence
        // For now, just return all
      }

      if (searchTerm) {
        query = query.or(`symbol.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,isin.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching instruments:', error)
        throw error
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  })
}

// Get single instrument by symbol or ID
export function useInstrument(identifier) {
  return useQuery({
    queryKey: queryKeys.instruments.detail(identifier),
    queryFn: async () => {
      if (!identifier) return null

      console.log(`🔍 Fetching instrument: ${identifier}`)
      
      let query = supabase
        .from('instruments')
        .select('*')

      // Check if identifier is UUID or symbol
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
      
      if (isUUID) {
        query = query.eq('id', identifier)
      } else {
        query = query.eq('symbol', identifier.toUpperCase())
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        console.error('Error fetching instrument:', error)
        throw error
      }

      return data
    },
    enabled: !!identifier,
    staleTime: 10 * 60 * 1000,
  })
}

// Add new instrument
export function useAddInstrument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (instrument) => {
      console.log('➕ Adding instrument:', instrument)

      // Validate required fields
      if (!instrument.symbol) throw new Error('Symbol is required')
      if (!instrument.name) throw new Error('Name is required')
      if (!instrument.asset_class) throw new Error('Asset class is required')
      if (!instrument.exchange) throw new Error('Exchange is required')

      const { data, error } = await supabase
        .from('instruments')
        .insert([{
          symbol: instrument.symbol.toUpperCase(),
          name: instrument.name,
          asset_class: instrument.asset_class,
          sub_category: instrument.sub_category || null,
          exchange: instrument.exchange,
          isin: instrument.isin || null,
          sector: instrument.sector || null,
          industry: instrument.industry || null,
          series: instrument.series || null,
          expense_ratio: instrument.expense_ratio || null,
          exit_load_pct: instrument.exit_load_pct || 0,
          exit_load_days: instrument.exit_load_days || 0,
          stamp_duty_rate: instrument.stamp_duty_rate || 0.005,
          tax_category: instrument.tax_category || null,
          ltcg_months: instrument.ltcg_months || null,
          plan_type: instrument.plan_type || 'direct',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding instrument:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments._def })
    },
  })
}

// Update existing instrument
export function useUpdateInstrument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      console.log('✏️ Updating instrument:', id, updates)

      const { data, error } = await supabase
        .from('instruments')
        .update({
          ...updates,
          symbol: updates.symbol?.toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating instrument:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments._def })
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments.detail(data.symbol) })
    },
  })
}

// Delete instrument
export function useDeleteInstrument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting instrument:', id)

      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting instrument:', error)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments._def })
    },
  })
}

// Bulk import instruments
export function useBulkImportInstruments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (instruments) => {
      console.log('📦 Bulk importing instruments:', instruments.length)

      const instrumentsToInsert = instruments.map(inst => ({
        symbol: inst.symbol.toUpperCase(),
        name: inst.name,
        asset_class: inst.asset_class,
        sub_category: inst.sub_category || null,
        exchange: inst.exchange,
        isin: inst.isin || null,
        sector: inst.sector || null,
        industry: inst.industry || null,
        series: inst.series || null,
        expense_ratio: inst.expense_ratio || null,
        exit_load_pct: inst.exit_load_pct || 0,
        exit_load_days: inst.exit_load_days || 0,
        stamp_duty_rate: inst.stamp_duty_rate || 0.005,
        tax_category: inst.tax_category || null,
        ltcg_months: inst.ltcg_months || null,
        plan_type: inst.plan_type || 'direct',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('instruments')
        .upsert(instrumentsToInsert, {
          onConflict: 'symbol, exchange',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error('Error bulk importing instruments:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instruments._def })
    },
  })
}

// Get distinct asset classes for filtering
export function useAssetClasses() {
  return useQuery({
    queryKey: ['assetClasses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instruments')
        .select('asset_class')
        .not('asset_class', 'is', null)
        .order('asset_class')

      if (error) throw error

      // Get unique values
      const unique = [...new Set(data.map(item => item.asset_class))]
      return unique.map(value => ({
        value,
        label: value.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }))
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Get distinct exchanges for filtering
export function useExchanges() {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instruments')
        .select('exchange')
        .not('exchange', 'is', null)
        .order('exchange')

      if (error) throw error

      return [...new Set(data.map(item => item.exchange))]
    },
    staleTime: 30 * 60 * 1000,
  })
}