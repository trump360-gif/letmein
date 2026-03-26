import { api } from '@/shared/api/client'
import type {
  Report,
  ReportDetail,
  ReportProcessRequest,
  Sanction,
  SanctionCreateRequest,
  BannedWord,
  BannedWordCreateRequest,
  BannedWordTestRequest,
  BannedWordTestResult,
  ApiResponse,
  PaginationMeta,
} from '@letmein/types'

// ==================== Reports ====================

export interface ReportsParams {
  page?: number
  limit?: number
  status?: string
  targetType?: string
  reason?: string
  search?: string
}

export async function fetchReports(params: ReportsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.status) searchParams.set('status', params.status)
  if (params.targetType) searchParams.set('targetType', params.targetType)
  if (params.reason) searchParams.set('reason', params.reason)
  if (params.search) searchParams.set('search', params.search)

  return api
    .get('admin/reports', { searchParams })
    .json<ApiResponse<Report[]> & { meta: PaginationMeta }>()
}

export async function fetchReportDetail(id: string) {
  return api.get(`admin/reports/${id}`).json<ApiResponse<ReportDetail>>()
}

export async function processReport(id: string, data: ReportProcessRequest) {
  return api
    .post(`admin/reports/${id}/process`, { json: data })
    .json<ApiResponse<{ message: string }>>()
}

// ==================== Sanctions ====================

export interface SanctionsParams {
  page?: number
  limit?: number
  type?: string
  active?: boolean
  search?: string
}

export async function fetchSanctions(params: SanctionsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.type) searchParams.set('type', params.type)
  if (params.active !== undefined) searchParams.set('active', String(params.active))
  if (params.search) searchParams.set('search', params.search)

  return api
    .get('admin/sanctions', { searchParams })
    .json<ApiResponse<Sanction[]> & { meta: PaginationMeta }>()
}

export async function createSanction(data: SanctionCreateRequest) {
  return api.post('admin/sanctions', { json: data }).json<ApiResponse<Sanction>>()
}

export async function liftSanction(id: string) {
  return api
    .delete(`admin/sanctions/${id}`)
    .json<ApiResponse<{ message: string }>>()
}

// ==================== Banned Words ====================

export interface BannedWordsParams {
  page?: number
  limit?: number
  patternType?: string
  boardId?: string
  search?: string
  active?: boolean
}

export async function fetchBannedWords(params: BannedWordsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.patternType) searchParams.set('patternType', params.patternType)
  if (params.boardId) searchParams.set('boardId', params.boardId)
  if (params.search) searchParams.set('search', params.search)
  if (params.active !== undefined) searchParams.set('active', String(params.active))

  return api
    .get('admin/banned-words', { searchParams })
    .json<ApiResponse<BannedWord[]> & { meta: PaginationMeta }>()
}

export async function createBannedWord(data: BannedWordCreateRequest) {
  return api.post('admin/banned-words', { json: data }).json<ApiResponse<BannedWord>>()
}

export async function deleteBannedWord(id: string) {
  return api
    .delete(`admin/banned-words/${id}`)
    .json<ApiResponse<{ message: string }>>()
}

export async function testBannedWords(data: BannedWordTestRequest) {
  return api
    .post('admin/banned-words/test', { json: data })
    .json<ApiResponse<BannedWordTestResult>>()
}
