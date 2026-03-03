// src/hooks/useNetWorthHistory.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from './queryKeys'

export function useNetWorthHistory(userId) {
  return useQuery({
    queryKey: queryKeys.nwHistory(userId),
    queryFn: async () => {
      console.log('📈 Fetching net worth history...')
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(12)
      
      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  })
}