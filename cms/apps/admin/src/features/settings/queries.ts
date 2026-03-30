import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from './api'
import type { SiteSettingsUpdatePayload } from '@letmein/types'

export const settingsKeys = {
  all: ['settings'] as const,
  list: () => [...settingsKeys.all, 'list'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SiteSettingsUpdatePayload) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}
