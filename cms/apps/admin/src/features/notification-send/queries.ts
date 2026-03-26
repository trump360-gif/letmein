import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEmailTemplates,
  updateEmailTemplate,
  sendTestEmail,
  sendNotification,
  fetchNotificationQueue,
  fetchNotificationLogs,
  fetchNotificationStats,
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from './api'
import type {
  EmailTemplateUpdatePayload,
  SendNotificationPayload,
  WebhookConfigPayload,
} from '@letmein/types'

// --- Query Keys ---
export const notificationKeys = {
  all: ['notifications'] as const,
  templates: () => [...notificationKeys.all, 'templates'] as const,
  queue: (params: Record<string, unknown>) => [...notificationKeys.all, 'queue', params] as const,
  logs: (params: Record<string, unknown>) => [...notificationKeys.all, 'logs', params] as const,
  stats: (days?: number) => [...notificationKeys.all, 'stats', days] as const,
  webhooks: () => [...notificationKeys.all, 'webhooks'] as const,
}

// --- Email Templates ---
export function useEmailTemplates() {
  return useQuery({
    queryKey: notificationKeys.templates(),
    queryFn: fetchEmailTemplates,
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, payload }: { type: string; payload: EmailTemplateUpdatePayload }) =>
      updateEmailTemplate(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() })
    },
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({ type, email }: { type: string; email: string }) => sendTestEmail(type, email),
  })
}

// --- Send Notification ---
export function useSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) => sendNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

// --- Queue ---
export function useNotificationQueue(params: {
  page?: number
  limit?: number
  status?: string
  channel?: string
}) {
  return useQuery({
    queryKey: notificationKeys.queue(params),
    queryFn: () => fetchNotificationQueue(params),
    refetchInterval: 30000, // 30초 폴링
  })
}

// --- Logs ---
export function useNotificationLogs(params: {
  page?: number
  limit?: number
  status?: string
  channel?: string
  search?: string
}) {
  return useQuery({
    queryKey: notificationKeys.logs(params),
    queryFn: () => fetchNotificationLogs(params),
  })
}

// --- Stats ---
export function useNotificationStats(days?: number) {
  return useQuery({
    queryKey: notificationKeys.stats(days),
    queryFn: () => fetchNotificationStats(days),
  })
}

// --- Webhooks ---
export function useWebhooks() {
  return useQuery({
    queryKey: notificationKeys.webhooks(),
    queryFn: fetchWebhooks,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WebhookConfigPayload) => createWebhook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<WebhookConfigPayload> }) =>
      updateWebhook(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() })
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.webhooks() })
    },
  })
}
