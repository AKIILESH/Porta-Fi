// src/hooks/usePortfolioSnapshots.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const RANGE_DAYS = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }

export function usePortfolioSnapshots(userId, range = '1M') {
  const days = RANGE_DAYS[range] ?? 30

  return useQuery({
    queryKey: ['portfolioSnapshots', userId, range],
    queryFn: async () => {
      const from = new Date()
      from.setDate(from.getDate() - days)
      const fromISO = from.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('date, total_value_inr, total_cost_inr')
        .eq('user_id', userId)
        .gte('date', fromISO)
        .order('date', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,  // 10 min — snapshots only update once a day
  })
}