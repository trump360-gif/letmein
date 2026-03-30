import { useQuery } from '@tanstack/react-query'
import { fetchPremiumStatus } from './api'

export const premiumKeys = {
  all: ['premium-status'] as const,
}

export function usePremiumStatus() {
  return useQuery({
    queryKey: premiumKeys.all,
    queryFn: fetchPremiumStatus,
    staleTime: 5 * 60 * 1000, // 5분
  })
}
