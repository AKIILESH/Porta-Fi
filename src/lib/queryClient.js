// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when tab gains focus
      refetchOnReconnect: false, // Don't refetch on reconnection
      refetchOnMount: false, // Don't refetch on component mount if data exists
      refetchInterval:15*60*1000
    },
  },
})