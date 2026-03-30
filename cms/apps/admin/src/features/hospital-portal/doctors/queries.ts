import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorOrder,
  type CreateDoctorData,
  type UpdateDoctorData,
  type OrderItem,
} from './api'

export const doctorKeys = {
  all: ['hospital', 'doctors'] as const,
  list: () => [...doctorKeys.all, 'list'] as const,
}

export function useDoctorsQuery() {
  return useQuery({
    queryKey: doctorKeys.list(),
    queryFn: fetchDoctors,
  })
}

export function useCreateDoctorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDoctorData) => createDoctor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useUpdateDoctorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorData }) =>
      updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useDeleteDoctorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

export function useUpdateDoctorOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orders: OrderItem[]) => updateDoctorOrder(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}
