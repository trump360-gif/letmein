// ==================== 8. 알림 관리 ====================

// --- Channels & Enums ---
export type NotificationChannel = 'pwa' | 'email' | 'kakao' | 'sms' | 'inapp'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
export type NotificationPriority = 1 | 2 | 3 // 1=긴급, 2=일반, 3=저우선
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
export type TargetType = 'all' | 'grade' | 'users' | 'board_subscribers'

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  pwa: 'PWA 푸시',
  email: '이메일',
  kakao: '카카오톡',
  sms: 'SMS',
  inapp: '인앱',
}

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  1: '긴급',
  2: '일반',
  3: '저우선',
}

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  pending: '대기',
  processing: '처리중',
  sent: '발송완료',
  failed: '실패',
  cancelled: '취소',
}

// --- Notification (인앱 알림) ---
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  linkUrl: string | null
  refType: string | null
  refId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  expiresAt: string | null
}

// --- Email Template ---
export interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  htmlBody: string
  textBody: string | null
  variables: string[] | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailTemplateUpdatePayload {
  subject?: string
  htmlBody?: string
  textBody?: string
  variables?: string[]
}

// --- Notification Queue ---
export interface NotificationQueueItem {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  channel: NotificationChannel
  priority: NotificationPriority
  subject: string | null
  body: string
  metadata: Record<string, unknown> | null
  status: QueueStatus
  retryCount: number
  lastError: string | null
  scheduledAt: string
  sentAt: string | null
  createdAt: string
}

// --- Notification Log (발송 이력) ---
export interface NotificationLog {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  channel: NotificationChannel
  priority: NotificationPriority
  subject: string | null
  body: string
  status: QueueStatus
  retryCount: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
}

// --- Send Notification ---
export interface SendNotificationPayload {
  targetType: TargetType
  targetValue?: string // grade number or comma-separated user IDs or board ID
  channels: NotificationChannel[]
  priority: NotificationPriority
  title: string
  body: string
  linkUrl?: string
  scheduledAt?: string
}

// --- Webhook Config ---
export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret: string | null
  isActive: boolean
  lastSentAt: string | null
  createdAt: string
}

export interface WebhookConfigPayload {
  name: string
  url: string
  events: string[]
  secret?: string
  isActive?: boolean
}

// --- Notification Stats ---
export interface NotificationStats {
  totalSent: number
  totalFailed: number
  totalPending: number
  byChannel: {
    channel: NotificationChannel
    sent: number
    failed: number
    pending: number
  }[]
  byDay: {
    date: string
    sent: number
    failed: number
  }[]
}

// --- Notification Setting (어드민용) ---
export interface NotificationSetting {
  id: string
  userId: string
  channels: Record<string, boolean>
  types: Record<string, boolean>
  quietStart: string
  quietEnd: string
  updatedAt: string
}

// --- Notification Subscription ---
export interface NotificationSubscription {
  id: string
  userId: string
  targetType: string
  targetId: string | null
  keyword: string | null
  createdAt: string
}

// --- Trigger definitions (8-6) ---
export interface NotificationTrigger {
  id: string
  event: string
  label: string
  description: string
  channels: NotificationChannel[]
  isActive: boolean
}

export const NOTIFICATION_TRIGGERS: NotificationTrigger[] = [
  { id: 'new_comment', event: 'comment.created', label: '새 댓글', description: '내 글에 댓글이 달렸을 때', channels: ['inapp', 'email', 'pwa'], isActive: true },
  { id: 'new_reply', event: 'reply.created', label: '대댓글', description: '내 댓글에 답글이 달렸을 때', channels: ['inapp', 'pwa'], isActive: true },
  { id: 'post_liked', event: 'post.liked', label: '좋아요', description: '내 글에 좋아요가 눌렸을 때', channels: ['inapp'], isActive: true },
  { id: 'grade_changed', event: 'user.grade_changed', label: '등급 변경', description: '회원 등급이 변경되었을 때', channels: ['inapp', 'email', 'kakao'], isActive: true },
  { id: 'point_earned', event: 'point.earned', label: '포인트 적립', description: '포인트가 적립되었을 때', channels: ['inapp'], isActive: true },
  { id: 'report_resolved', event: 'report.resolved', label: '신고 처리', description: '내 신고가 처리되었을 때', channels: ['inapp', 'email'], isActive: true },
  { id: 'sanction_applied', event: 'sanction.applied', label: '제재 적용', description: '계정에 제재가 적용되었을 때', channels: ['inapp', 'email', 'sms'], isActive: true },
  { id: 'new_post_board', event: 'board.new_post', label: '새 글 (구독)', description: '구독 게시판에 새 글이 올라왔을 때', channels: ['inapp', 'email', 'pwa'], isActive: true },
  { id: 'system_notice', event: 'system.notice', label: '시스템 공지', description: '관리자가 전체 알림을 보냈을 때', channels: ['inapp', 'email', 'kakao', 'sms', 'pwa'], isActive: true },
  { id: 'dormant_warning', event: 'user.dormant_warning', label: '휴면 경고', description: '휴면 전환 30일 전 알림', channels: ['email', 'sms'], isActive: true },
]

// --- Email template variables ---
export const TEMPLATE_VARIABLES = [
  { key: '{{이름}}', label: '이름', description: '회원 이름' },
  { key: '{{닉네임}}', label: '닉네임', description: '회원 닉네임' },
  { key: '{{등급}}', label: '등급', description: '회원 등급명' },
  { key: '{{포인트}}', label: '포인트', description: '보유 포인트' },
  { key: '{{링크}}', label: '링크', description: '관련 링크 URL' },
  { key: '{{날짜}}', label: '날짜', description: '현재 날짜' },
  { key: '{{사이트명}}', label: '사이트명', description: '사이트 이름' },
]
