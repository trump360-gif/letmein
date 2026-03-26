// ==================== Report Types ====================

export type ReportTargetType = 'post' | 'comment' | 'user'

export type ReportReason =
  | 'spam'
  | 'abuse'
  | 'harassment'
  | 'sexual'
  | 'illegal'
  | 'copyright'
  | 'other'

export type ReportStatus = 'pending' | 'processed' | 'dismissed'

export type ReportAction = 'blind' | 'delete' | 'dismiss'

export interface Report {
  id: string
  reporterId: string
  reporterNickname: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  reasonText: string | null
  weight: number
  status: ReportStatus
  processedBy: string | null
  processedAt: string | null
  createdAt: string
}

export interface ReportDetail extends Report {
  processorNickname: string | null
  targetTitle: string | null
  targetContent: string | null
  targetAuthorNickname: string | null
  totalReportsOnTarget: number
}

export interface ReportProcessRequest {
  action: ReportAction
  sanctionType?: SanctionType
  sanctionDurationDays?: number
  sanctionReason?: string
}

// ==================== Sanction Types ====================

export type SanctionType =
  | 'warning'
  | 'suspend_1d'
  | 'suspend_3d'
  | 'suspend_7d'
  | 'suspend_30d'
  | 'permanent_ban'
  | 'force_logout'
  | 'ip_ban'

export interface Sanction {
  id: string
  userId: string
  userNickname: string
  userEmail: string | null
  type: SanctionType
  reason: string | null
  durationDays: number | null
  expiresAt: string | null
  appliedBy: string
  applierNickname: string
  liftedAt: string | null
  liftedBy: string | null
  lifterNickname: string | null
  createdAt: string
  isActive: boolean
}

export interface SanctionCreateRequest {
  userId: number
  type: SanctionType
  reason?: string
  durationDays?: number
}

// ==================== BannedWord Types ====================

export type BannedWordPatternType = 'direct' | 'regex' | 'chosung'

export type BannedWordAction = 'replace' | 'block' | 'blind'

export interface BannedWord {
  id: string
  word: string
  patternType: BannedWordPatternType
  boardId: string | null
  boardName: string | null
  action: BannedWordAction
  isActive: boolean
  createdAt: string
}

export interface BannedWordCreateRequest {
  word: string
  patternType: BannedWordPatternType
  boardId?: number
  action: BannedWordAction
}

export interface BannedWordTestRequest {
  text: string
  boardId?: number
}

export interface BannedWordTestResult {
  matched: boolean
  matches: Array<{
    word: string
    patternType: BannedWordPatternType
    action: BannedWordAction
    positions: Array<{ start: number; end: number }>
  }>
  filteredText: string
}

// ==================== Filter Level ====================

export type FilterLevel = 'lenient' | 'normal' | 'strict'
