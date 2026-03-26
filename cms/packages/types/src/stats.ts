// ==================== Stats Types ====================

export type StatsPeriod = '7d' | '30d' | '90d' | 'custom'

export interface StatsDateRange {
  from: string
  to: string
}

export interface StatsRequestParams {
  period?: StatsPeriod
  from?: string
  to?: string
}

// ==================== Summary ====================

export interface StatsSummary {
  totalUsers: number
  totalPosts: number
  totalComments: number
  pendingReports: number
  todayNewUsers: number
  todayNewPosts: number
  todayNewComments: number
  todayNewReports: number
  yesterdayNewUsers: number
  yesterdayNewPosts: number
  yesterdayNewComments: number
  yesterdayNewReports: number
  dau: number
  wau: number
  mau: number
}

// ==================== Time Series ====================

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface MultiSeriesPoint {
  date: string
  [key: string]: string | number
}

// ==================== User Stats ====================

export interface UserStatsResponse {
  dailySignups: TimeSeriesPoint[]
  gradeDistribution: GradeDistribution[]
  activeUsers: {
    dau: TimeSeriesPoint[]
    wau: TimeSeriesPoint[]
    mau: TimeSeriesPoint[]
  }
  totalUsers: number
  periodNewUsers: number
  periodNewUserChange: number
}

export interface GradeDistribution {
  grade: number
  name: string
  count: number
  percentage: number
}

// ==================== Post Stats ====================

export interface PostStatsResponse {
  dailyPosts: TimeSeriesPoint[]
  dailyComments: TimeSeriesPoint[]
  topPosts: TopPost[]
  topBoards: TopBoard[]
  totalPosts: number
  periodNewPosts: number
  periodNewPostChange: number
}

export interface TopPost {
  id: string
  title: string
  boardName: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
}

export interface TopBoard {
  id: string
  name: string
  postCount: number
  commentCount: number
  viewCount: number
}

// ==================== Report Stats ====================

export interface ReportStatsResponse {
  dailyReports: TimeSeriesPoint[]
  reasonDistribution: ReasonDistribution[]
  statusDistribution: StatusDistribution[]
  dailySanctions: TimeSeriesPoint[]
  totalReports: number
  periodNewReports: number
  periodNewReportChange: number
  processRate: number
}

export interface ReasonDistribution {
  reason: string
  label: string
  count: number
  percentage: number
}

export interface StatusDistribution {
  status: string
  label: string
  count: number
  percentage: number
}

// ==================== Banner Stats ====================

export interface BannerStatsResponse {
  banners: BannerStatItem[]
  dailyImpressions: TimeSeriesPoint[]
  dailyClicks: TimeSeriesPoint[]
  overallCTR: number
}

export interface BannerStatItem {
  id: string
  name: string
  position: string
  impressions: number
  clicks: number
  ctr: number
  pcClicks: number
  mobileClicks: number
  abGroup: string | null
}

// ==================== Notification Stats ====================

export interface NotificationStatsResponse {
  dailySent: TimeSeriesPoint[]
  dailyRead: TimeSeriesPoint[]
  channelDistribution: ChannelDistribution[]
  readRate: number
  totalSent: number
  totalRead: number
}

export interface ChannelDistribution {
  channel: string
  label: string
  sent: number
  read: number
  readRate: number
}

// ==================== Funnel ====================

export type FunnelStage =
  | 'visit'
  | 'signup_start'
  | 'signup_complete'
  | 'first_post'
  | 'first_comment'
  | 'grade_up'

export interface FunnelStageData {
  stage: FunnelStage
  label: string
  count: number
  percentage: number
  dropoff: number
  dropoffRate: number
}

export interface FunnelResponse {
  stages: FunnelStageData[]
  totalVisits: number
  overallConversion: number
}

// ==================== Export ====================

export type ExportFormat = 'csv' | 'xlsx'

export type ExportTarget =
  | 'summary'
  | 'users'
  | 'posts'
  | 'reports'
  | 'banners'
  | 'notifications'
  | 'funnel'

export interface ExportRequest {
  target: ExportTarget
  format: ExportFormat
  period?: StatsPeriod
  from?: string
  to?: string
}

export interface ExportResponse {
  filename: string
  data: string
  mimeType: string
}
