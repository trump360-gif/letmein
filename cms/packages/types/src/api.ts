export interface ApiResponse<T = unknown> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    field?: string
  }
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiError
