import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMedia, uploadMedia, deleteMedia } from './api'
import type { MediaListParams } from './api'

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (params: MediaListParams) => [...mediaKeys.lists(), params] as const,
}

export function useMediaList(params: MediaListParams = {}) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => fetchMedia(params),
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, options }: { file: File; options?: { folderId?: string; altText?: string } }) =>
      uploadMedia(file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
    },
  })
}
