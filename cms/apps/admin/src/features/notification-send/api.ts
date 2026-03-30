import { api } from '@/shared/api/client'
import type {
  EmailTemplate,
  EmailTemplateUpdatePayload,
  NotificationQueueItem,
  NotificationLog,
  NotificationStats,
  SendNotificationPayload,
} from '@letmein/types'
import type { ApiResponse, PaginationMeta } from '@letmein/types'

// --- Email Templates ---

export async function fetchEmailTemplates() {
  const res = await api.get('admin/notifications/templates').json<ApiResponse<{ templates: EmailTemplate[] }>>()
  return res.data.templates
}

export async function updateEmailTemplate(type: string, payload: EmailTemplateUpdatePayload) {
  const res = await api
    .patch(`admin/notifications/templates/${type}`, { json: payload })
    .json<ApiResponse<{ template: EmailTemplate }>>()
  return res.data.template
}

export async function sendTestEmail(type: string, email: string) {
  const res = await api
    .post(`admin/notifications/templates/${type}/test`, { json: { email } })
    .json<ApiResponse<{ message: string }>>()
  return res.data.message
}

// --- Send Notification ---

export async function sendNotification(payload: SendNotificationPayload) {
  const res = await api
    .post('admin/notifications/send', { json: payload })
    .json<ApiResponse<{ message: string; queuedCount: number; targetCount: number }>>()
  return res.data
}

// --- Queue ---

export async function fetchNotificationQueue(params: {
  page?: number
  limit?: number
  status?: string
  channel?: string
}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.status) searchParams.set('status', params.status)
  if (params.channel) searchParams.set('channel', params.channel)

  const res = await api
    .get(`admin/notifications/queue?${searchParams.toString()}`)
    .json<ApiResponse<{ items: NotificationQueueItem[] }> & { meta: PaginationMeta }>()
  return { items: res.data.items, meta: res.meta! }
}

// --- Logs ---

export async function fetchNotificationLogs(params: {
  page?: number
  limit?: number
  status?: string
  channel?: string
  search?: string
}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.status) searchParams.set('status', params.status)
  if (params.channel) searchParams.set('channel', params.channel)
  if (params.search) searchParams.set('search', params.search)

  const res = await api
    .get(`admin/notifications/logs?${searchParams.toString()}`)
    .json<ApiResponse<{ items: NotificationLog[] }> & { meta: PaginationMeta }>()
  return { items: res.data.items, meta: res.meta! }
}

// --- Stats ---

export async function fetchNotificationStats(days?: number) {
  const searchParams = days ? `?days=${days}` : ''
  const res = await api
    .get(`admin/notifications/stats${searchParams}`)
    .json<ApiResponse<NotificationStats>>()
  return res.data
}
