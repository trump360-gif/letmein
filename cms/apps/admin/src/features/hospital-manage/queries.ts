import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { HospitalListParams } from '@letmein/types'
import { fetchHospitals, fetchHospitalDetail, updateHospitalStatus } from './api'

export const hospitalKeys = {
  all: ['hospitals'] as const,
  lists: () => [...hospitalKeys.all, 'list'] as const,
  list: (params: HospitalListParams) => [...hospitalKeys.lists(), params] as const,
  details: () => [...hospitalKeys.all, 'detail'] as const,
  detail: (id: number) => [...hospitalKeys.details(), id] as const,
}

export function useHospitals(params: HospitalListParams) {
  return useQuery({
    queryKey: hospitalKeys.list(params),
    queryFn: () => fetchHospitals(params),
    placeholderData: (prev) => prev,
  })
}

export function useHospitalDetail(id: number) {
  return useQuery({
    queryKey: hospitalKeys.detail(id),
    queryFn: () => fetchHospitalDetail(id),
    enabled: id > 0,
  })
}

export function useUpdateHospitalStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string; reason?: string } }) =>
      updateHospitalStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hospitalKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: hospitalKeys.lists() })
    },
  })
}
