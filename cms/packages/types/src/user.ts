export type UserStatus = 'active' | 'dormant' | 'suspended' | 'withdrawn'

export interface User {
  id: number
  email: string | null
  nickname: string
  name: string | null
  phone: string | null
  grade: number
  points: number
  status: UserStatus
  socialProvider: string | null
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

// ==================== 3-1. 등급 구조 ====================

export const GRADE_NAMES: Record<number, string> = {
  0: '비회원',
  1: '일반',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
  5: 'VVIP',
  9: '어드민',
}

export type ConditionOperator = 'AND' | 'OR'

export interface GradeCondition {
  field: 'posts' | 'comments' | 'likes' | 'points' | 'days_since_join' | 'login_count'
  operator: '>=' | '>' | '=' | '<=' | '<'
  value: number
}

export interface GradeConditions {
  operator: ConditionOperator
  rules: GradeCondition[]
}

export interface UserGradeConfig {
  id: number
  grade: number
  name: string
  conditions: GradeConditions | null
  autoUpgrade: boolean
  notifyUpgrade: boolean
  storageLimitMb: number
  createdAt: string
  updatedAt: string
}

// ==================== 3-2. 등급 변경 이력 ====================

export interface UserGradeHistoryItem {
  id: number
  userId: number
  fromGrade: number
  toGrade: number
  reason: string | null
  changedBy: number | null
  changerNickname?: string | null
  createdAt: string
}

// ==================== 3-3. 포인트 시스템 ====================

export type PointType =
  | 'post_create'
  | 'comment_create'
  | 'like_received'
  | 'login_daily'
  | 'signup_bonus'
  | 'admin_give'
  | 'admin_deduct'
  | 'expired'
  | 'manual'

export interface PointTransaction {
  id: number
  userId: number
  amount: number
  balance: number
  type: string
  refType: string | null
  refId: number | null
  note: string | null
  expiresAt: string | null
  createdAt: string
}

export interface PointRuleItem {
  id: number
  type: string
  amount: number
  dailyLimit: number | null
  minLength: number | null
  isActive: boolean
  updatedAt: string
}

// ==================== 3-4. 회원 상세 ====================

export interface UserDetail extends User {
  suspendedUntil: string | null
  suspensionReason: string | null
  dormantNotifiedAt: string | null
  phoneVerifiedAt: string | null
  identityVerifiedAt: string | null
  deletedAt: string | null
  postCount: number
  commentCount: number
  recentGradeHistory: UserGradeHistoryItem[]
  recentPoints: PointTransaction[]
}

// ==================== 필터/검색 ====================

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  grade?: number
  status?: UserStatus
  sortBy?: 'createdAt' | 'lastLoginAt' | 'points' | 'grade'
  sortOrder?: 'asc' | 'desc'
  joinFrom?: string
  joinTo?: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// ==================== 액션 ====================

export interface GradeChangePayload {
  grade: number
  reason: string
}

export interface PointActionPayload {
  amount: number
  type: 'admin_give' | 'admin_deduct'
  note: string
  expiresAt?: string
}

export interface SuspendPayload {
  reason: string
  durationDays: number
}

