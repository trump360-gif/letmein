export type AdminRoleType = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface AdminUser {
  id: number
  email: string
  nickname: string
  role: AdminRoleType
  permissions: string[]
  lastLoginAt: string | null
  createdAt: string
}

export interface Permission {
  id: number
  code: string
  name: string
  description: string
}

// ==================== Module 10: System/Admin Logs ====================

/** 역할 (Role) */
export interface AdminRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissionCount: number
  adminCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminRoleCreatePayload {
  name: string
  description?: string
}

export interface AdminRoleUpdatePayload {
  name?: string
  description?: string
}

/** 역할 권한 (Permission) */
export interface AdminRolePermission {
  id: string
  roleId: string
  module: string
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  boardId: string | null
}

export interface AdminRolePermissionUpdatePayload {
  permissions: Array<{
    module: string
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
    boardId?: string | null
  }>
}

/** 활동 로그 (Activity Log) */
export interface AdminActivityLog {
  id: string
  adminId: string
  adminEmail: string
  adminNickname: string
  action: string
  module: string
  targetType: string | null
  targetId: string | null
  beforeData: Record<string, unknown> | null
  afterData: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AdminActivityLogSearchParams {
  page?: number
  limit?: number
  adminId?: string
  action?: string
  module?: string
  targetType?: string
  targetId?: string
  ipAddress?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface AdminActivityLogExportParams extends Omit<AdminActivityLogSearchParams, 'page' | 'limit'> {
  format?: 'csv' | 'json'
}

/** 로그인 이력 (Login History) */
export interface AdminLoginHistory {
  id: string
  adminId: string
  adminEmail: string
  adminNickname: string
  ipAddress: string
  userAgent: string | null
  status: 'success' | 'failed' | 'blocked'
  isNewIp: boolean
  createdAt: string
}

export interface AdminLoginHistorySearchParams {
  page?: number
  limit?: number
  adminId?: string
  status?: string
  ipAddress?: string
  dateFrom?: string
  dateTo?: string
}

/** 시스템 로그 */
export interface SystemLog {
  id: string
  level: 'error' | 'warn' | 'info'
  type: 'error' | 'slow_query' | 'api_failure'
  message: string
  source: string
  metadata: Record<string, unknown> | null
  stackTrace: string | null
  duration: number | null
  createdAt: string
}

export interface SystemLogSearchParams {
  page?: number
  limit?: number
  level?: string
  type?: string
  source?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

/** 어드민 사용자 관리 */
export interface AdminUserDetail {
  id: string
  userId: string
  email: string
  nickname: string
  roleId: string
  roleName: string
  ipWhitelist: string[] | null
  totpEnabled: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUserCreatePayload {
  userId: number
  roleId: string
}

export interface AdminUserRoleChangePayload {
  roleId: string
}

/** 저장된 검색 */
export interface SavedSearch {
  id: string
  name: string
  params: AdminActivityLogSearchParams
}

/** 모듈 목록 (권한 편집용) */
export const ADMIN_MODULES = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'users', label: '회원 관리' },
  { key: 'boards', label: '게시판 관리' },
  { key: 'posts', label: '콘텐츠 관리' },
  { key: 'reports', label: '신고 관리' },
  { key: 'notifications', label: '알림 관리' },
  { key: 'banners', label: '배너 관리' },
  { key: 'menus', label: '메뉴 관리' },
  { key: 'settings', label: '사이트 설정' },
  { key: 'system', label: '시스템/로그' },
  { key: 'media', label: '미디어 관리' },
  { key: 'stats', label: '통계' },
] as const

export type AdminModuleKey = (typeof ADMIN_MODULES)[number]['key']

/** 활동 액션 목록 */
export const ADMIN_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'import',
  'approve',
  'reject',
  'suspend',
  'restore',
  'role_change',
  'permission_change',
] as const

export type AdminAction = (typeof ADMIN_ACTIONS)[number]
