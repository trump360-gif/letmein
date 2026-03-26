import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTemplates, createTemplate } from './api'
import type { TemplateListParams } from './api'

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params: TemplateListParams) => [...templateKeys.lists(), params] as const,
}

export function useTemplateList(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => fetchTemplates(params),
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}
