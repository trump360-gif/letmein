import { api } from '@/shared/api/client'
import type {
  StatsSummary,
  UserStatsResponse,
  PostStatsResponse,
  ReportStatsResponse,
  NotificationStatsResponse,
  ExportResponse,
  StatsRequestParams,
  ExportTarget,
  ExportFormat,
} from '@letmein/types'

function buildSearchParams(params?: StatsRequestParams): Record<string, string> {
  const sp: Record<string, string> = {}
  if (params?.period) sp.period = params.period
  if (params?.from) sp.from = params.from
  if (params?.to) sp.to = params.to
  return sp
}

export async function fetchStatsSummary(): Promise<StatsSummary> {
  const res = await api.get('admin/stats/summary').json<{ success: boolean; data: StatsSummary }>()
  return res.data
}

export async function fetchUserStats(params?: StatsRequestParams): Promise<UserStatsResponse> {
  const res = await api
    .get('admin/stats/users', { searchParams: buildSearchParams(params) })
    .json<{ success: boolean; data: UserStatsResponse }>()
  return res.data
}

export async function fetchPostStats(params?: StatsRequestParams): Promise<PostStatsResponse> {
  const res = await api
    .get('admin/stats/posts', { searchParams: buildSearchParams(params) })
    .json<{ success: boolean; data: PostStatsResponse }>()
  return res.data
}

export async function fetchReportStats(params?: StatsRequestParams): Promise<ReportStatsResponse> {
  const res = await api
    .get('admin/stats/reports', { searchParams: buildSearchParams(params) })
    .json<{ success: boolean; data: ReportStatsResponse }>()
  return res.data
}

export async function fetchNotificationStats(
  params?: StatsRequestParams,
): Promise<NotificationStatsResponse> {
  const res = await api
    .get('admin/stats/notifications', { searchParams: buildSearchParams(params) })
    .json<{ success: boolean; data: NotificationStatsResponse }>()
  return res.data
}

export async function fetchStatsExport(
  target: ExportTarget,
  format: ExportFormat,
  params?: StatsRequestParams,
): Promise<ExportResponse> {
  const searchParams = {
    ...buildSearchParams(params),
    target,
    format,
  }
  const res = await api
    .get('admin/stats/export', { searchParams })
    .json<{ success: boolean; data: ExportResponse }>()
  return res.data
}
