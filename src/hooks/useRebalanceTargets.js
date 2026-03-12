// src/hooks/useRebalanceTargets.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'
import { validateTargets } from '../lib/rebalance'

// ─── Query key ─────────────────────────────────────────────────────────────
// Add this to your queryKeys.js:
//   rebalanceTargets: (userId) => ['rebalanceTargets', userId],

// ─── Read ──────────────────────────────────────────────────────────────────

/**
 * Fetches the user's saved target allocations from Supabase.
 *
 * Returns:
 *   targets        — { equity: 60, debt: 20, ... }  or {} if not set yet
 *   isConfigured   — true if user has saved at least one target
 *   isLoading
 *   error
 */
export function useRebalanceTargets(userId) {
  return useQuery({
    queryKey: ['rebalanceTargets', userId],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('rebalance_targets')
        .select('bucket, target_pct')
        .eq('user_id', userId)

      if (error) throw error

      // Convert array of rows → flat object { equity: 60, debt: 20, ... }
      const targets = {}
      for (const row of (data ?? [])) {
        targets[row.bucket] = Number(row.target_pct)
      }

      return targets
    },
    staleTime: 5 * 60 * 1000,   // targets rarely change — 5 min cache
    enabled:   !!userId,
  })
}

// ─── Write ─────────────────────────────────────────────────────────────────

/**
 * Saves target allocations for the user.
 * Uses UPSERT so it works for both first-time setup and updates.
 *
 * Usage:
 *   const { saveTargets, isSaving, saveError } = useSaveRebalanceTargets(userId)
 *   await saveTargets({ equity: 60, debt: 20, commodities: 10, real_estate: 10 })
 */
export function useSaveRebalanceTargets(userId) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (targets) => {
      // Validate sum = 100 before hitting Supabase
      const { valid, sum } = validateTargets(targets)
      if (!valid) {
        throw new Error(
          `Target allocations must sum to 100%. Current sum: ${sum.toFixed(1)}%`
        )
      }

      // Convert { equity: 60, debt: 20 } → array of rows
      const rows = Object.entries(targets).map(([bucket, target_pct]) => ({
        user_id:    userId,
        bucket,
        target_pct: Number(target_pct),
      }))

      // Upsert — insert new rows, update existing ones
      const { error } = await supabase
        .from('rebalance_targets')
        .upsert(rows, {
          onConflict:        'user_id,bucket',
          ignoreDuplicates:  false,
        })

      if (error) throw error

      // Delete buckets that were removed (e.g. user had crypto target, now removed)
      const activeBuckets = Object.keys(targets)
      const { error: deleteError } = await supabase
        .from('rebalance_targets')
        .delete()
        .eq('user_id', userId)
        .not('bucket', 'in', `(${activeBuckets.map(b => `"${b}"`).join(',')})`)

      if (deleteError) throw deleteError

      return targets
    },

    onSuccess: (targets) => {
      // Update React Query cache immediately — no refetch needed
      queryClient.setQueryData(['rebalanceTargets', userId], targets)

      // Also invalidate portfolio so rebalance page recalculates
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(userId) })
    },
  })

  return {
    saveTargets: mutation.mutateAsync,
    isSaving:   mutation.isPending,
    saveError:  mutation.error,
    isSuccess:  mutation.isSuccess,
    reset:      mutation.reset,
  }
}

// ─── Derived helper ────────────────────────────────────────────────────────

/**
 * Convenience hook that returns both targets and save function together.
 * Use this in Rebalance.jsx so you only need one import.
 *
 * Returns:
 *   targets        — { equity: 60, ... }
 *   isConfigured   — false if no targets saved yet
 *   isLoading
 *   error
 *   saveTargets    — async (targets) => void
 *   isSaving
 *   saveError
 */
export function useRebalance(userId) {
  const query    = useRebalanceTargets(userId)
  const mutation = useSaveRebalanceTargets(userId)

  const isConfigured = Object.keys(query.data ?? {}).length > 0

  return {
    targets:      query.data ?? {},
    isConfigured,
    isLoading:    query.isLoading,
    error:        query.error,
    saveTargets:  mutation.saveTargets,
    isSaving:     mutation.isSaving,
    saveError:    mutation.saveError,
    isSuccess:    mutation.isSuccess,
    resetSave:    mutation.reset,
  }
}