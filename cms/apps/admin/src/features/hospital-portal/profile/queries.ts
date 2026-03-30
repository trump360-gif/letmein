import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchProfile,
  updateProfile,
  fetchImages,
  updateImages,
  fetchSpecialties,
  addSpecialty,
  removeSpecialty,
  type ProfileUpdateData,
} from './api'

export const profileKeys = {
  all: ['hospital-profile'] as const,
  profile: () => [...profileKeys.all, 'info'] as const,
  images: () => [...profileKeys.all, 'images'] as const,
  specialties: () => [...profileKeys.all, 'specialties'] as const,
}

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.profile(),
    queryFn: fetchProfile,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileUpdateData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() })
    },
  })
}

export function useImagesQuery() {
  return useQuery({
    queryKey: profileKeys.images(),
    queryFn: fetchImages,
  })
}

export function useUpdateImagesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (images: string[]) => updateImages(images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.images() })
    },
  })
}

export function useSpecialtiesQuery() {
  return useQuery({
    queryKey: profileKeys.specialties(),
    queryFn: fetchSpecialties,
  })
}

export function useAddSpecialtyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => addSpecialty(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.specialties() })
    },
  })
}

export function useRemoveSpecialtyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => removeSpecialty(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.specialties() })
    },
  })
}
