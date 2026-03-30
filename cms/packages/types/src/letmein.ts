// ==================== LetMeIn Types ====================

// ── 병원 포탈 사용자 ──

export interface HospitalUser {
  id: number
  email: string
  name: string
  role: 'hospital'
  hospitalId: number
}

// ── 병원 ──

export type HospitalStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface Hospital {
  id: number
  userId: number
  name: string
  businessNumber: string | null
  licenseImage: string | null
  description: string | null
  address: string | null
  phone: string | null
  operatingHours: string | null
  profileImage: string | null
  status: HospitalStatus
  isPremium: boolean
  premiumTier: string | null
  introVideoUrl: string | null
  detailedDescription: string | null
  caseCount: number
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  userName?: string
  userEmail?: string | null
  specialtyCount?: number
  doctorCount?: number
}

export interface HospitalListParams {
  page?: number
  limit?: number
  search?: string
  status?: HospitalStatus
  isPremium?: boolean
  sortBy?: 'createdAt' | 'name' | 'caseCount'
  sortOrder?: 'asc' | 'desc'
}

export interface HospitalListResponse {
  hospitals: Hospital[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export interface HospitalDoctor {
  id: number
  hospitalId: number
  name: string
  title: string | null
  experience: string | null
  profileImage: string | null
  sortOrder: number
  createdAt: string
}

export interface HospitalSpecialty {
  id: number
  hospitalId: number
  categoryId: number | null
  categoryName: string | null
}

export interface HospitalDetail extends Hospital {
  specialties: HospitalSpecialty[]
  doctors: HospitalDoctor[]
}

// ── 시술 카테고리 ──

export interface ProcedureCategory {
  id: number
  name: string
  icon: string | null
  sortOrder: number
  createdAt: string
  detailCount?: number
}

export interface ProcedureDetail {
  id: number
  categoryId: number
  name: string
  sortOrder: number
  createdAt: string
}

// ── 상담 요청 ──

export type ConsultationStatus = 'active' | 'matched' | 'expired' | 'cancelled'

export interface ConsultationRequest {
  id: number
  userId: number
  categoryId: number
  description: string | null
  preferredPeriod: string | null
  photoPublic: boolean
  status: ConsultationStatus
  coordinatorId: number | null
  coordinatorNote: string | null
  matchedAt: string | null
  escalatedAt: string | null
  expiresAt: string
  createdAt: string
  userName?: string
  categoryName?: string
  matchCount?: number
}

export interface ConsultationListParams {
  page?: number
  limit?: number
  status?: ConsultationStatus
  search?: string
  sortBy?: 'createdAt' | 'expiresAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ConsultationListResponse {
  requests: ConsultationRequest[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export interface CoordinatorMatch {
  id: number
  requestId: number
  hospitalId: number
  matchedBy: number
  note: string | null
  status: string
  createdAt: string
  hospitalName?: string
}

export interface MatchPayload {
  hospitalId: number
  note?: string
}

// ── 채팅 ──

export interface ChatRoom {
  id: number
  requestId: number | null
  userId: number
  hospitalId: number
  status: string
  closedAt: string | null
  lastMessageAt: string
  createdAt: string
  userName?: string
  hospitalName?: string
  messageCount?: number
}

export interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  messageType: string
  content: string | null
  readAt: string | null
  createdAt: string
}

// ── 출연자 ──

export type CastVerificationStatus = 'pending' | 'verified' | 'rejected'

export interface CastMember {
  id: number
  userId: number
  displayName: string
  bio: string | null
  profileImage: string | null
  badgeType: string
  verificationStatus: CastVerificationStatus
  verifiedAt: string | null
  verifiedBy: number | null
  rejectionReason: string | null
  youtubeChannelUrl: string | null
  followerCount: number
  storyCount: number
  createdAt: string
  updatedAt: string
  userName?: string
  userEmail?: string | null
}

export interface CastMemberListParams {
  page?: number
  limit?: number
  search?: string
  status?: CastVerificationStatus
  sortBy?: 'createdAt' | 'followerCount' | 'storyCount'
  sortOrder?: 'asc' | 'desc'
}

export interface CastMemberListResponse {
  members: CastMember[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// ── 에피소드 ──

export interface YouTubeEpisode {
  id: number
  youtubeUrl: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string | null
  airDate: string | null
  isHero: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  castMemberCount?: number
}

export interface EpisodeListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'createdAt' | 'airDate' | 'sortOrder'
  sortOrder?: 'asc' | 'desc'
}

export interface EpisodeListResponse {
  episodes: YouTubeEpisode[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export interface EpisodeCreatePayload {
  youtubeUrl: string
  title: string
  thumbnailUrl?: string
  airDate?: string
  isHero?: boolean
  sortOrder?: number
  castMemberIds?: number[]
}

// ── 프리미엄 구독 ──

export type SubscriptionTier = 'basic' | 'standard' | 'premium'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface HospitalSubscription {
  id: number
  hospitalId: number
  tier: SubscriptionTier
  status: SubscriptionStatus
  startedAt: string
  expiresAt: string
  cancelledAt: string | null
  monthlyPrice: number
  createdAt: string
  updatedAt: string
  hospitalName?: string
}

export interface SubscriptionListParams {
  page?: number
  limit?: number
  tier?: SubscriptionTier
  status?: SubscriptionStatus
  search?: string
  sortBy?: 'createdAt' | 'expiresAt' | 'monthlyPrice'
  sortOrder?: 'asc' | 'desc'
}

export interface SubscriptionListResponse {
  subscriptions: HospitalSubscription[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// ── 광고 ──

export type AdReviewStatus = 'pending' | 'approved' | 'rejected'
export type AdCampaignStatus = 'active' | 'paused' | 'ended'

export interface AdCreative {
  id: number
  hospitalId: number
  imageUrl: string
  headline: string
  reviewStatus: AdReviewStatus
  rejectionReason: string | null
  reviewedAt: string | null
  reviewedBy: number | null
  createdAt: string
  hospitalName?: string
}

export interface AdCreativeListParams {
  page?: number
  limit?: number
  reviewStatus?: AdReviewStatus
  search?: string
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface AdCreativeListResponse {
  creatives: AdCreative[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export interface AdCampaign {
  id: number
  hospitalId: number
  creativeId: number
  placement: string
  status: AdCampaignStatus
  dailyBudget: number
  cpmPrice: number
  startDate: string
  endDate: string
  totalImpressions: number
  totalClicks: number
  totalSpent: number
  createdAt: string
  updatedAt: string
  hospitalName?: string
  creativeHeadline?: string
}

export interface AdReviewPayload {
  reviewStatus: 'approved' | 'rejected'
  rejectionReason?: string
}

export interface AdCredit {
  id: number
  hospitalId: number
  balance: number
  updatedAt: string
  hospitalName?: string
}
