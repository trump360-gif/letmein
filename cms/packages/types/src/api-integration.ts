// ============================================================
// API Integration Types - Module 2
// ============================================================

/** 서비스 활성화 상태 */
export type ServiceStatus = 'active' | 'inactive' | 'error'

/** 환경 모드 */
export type EnvironmentMode = 'test' | 'production'

// ------ Base ------

export interface ApiKeyField {
  key: string
  label: string
  required: boolean
  masked: boolean
}

export interface ApiKeyConfig {
  service: string
  category: ApiCategory
  displayName: string
  enabled: boolean
  mode: EnvironmentMode
  status: ServiceStatus
  fields: ApiKeyField[]
  values: Record<string, string>
  lastTestedAt?: string | null
  lastTestResult?: 'success' | 'fail' | null
}

export type ApiCategory = 'social' | 'notification' | 'payment' | 'misc'

// ------ Social Login (2-1) ------

export type SocialProvider =
  | 'kakao'
  | 'google'
  | 'naver'
  | 'apple'
  | 'line'
  | 'facebook'
  | 'github'
  | 'linkedin'

export interface SocialLoginConfig {
  provider: SocialProvider
  enabled: boolean
  mode: EnvironmentMode
  clientId: string
  clientSecret: string
  callbackUrl?: string
}

// ------ Notification API (2-2) ------

export type NotificationProvider = 'kakao_alimtalk' | 'solapi_sms' | 'smtp' | 'sendgrid'

export interface KakaoAlimtalkConfig {
  enabled: boolean
  mode: EnvironmentMode
  apiKey: string
  apiSecret: string
  senderKey: string
  channelId: string
}

export interface SolapiSmsConfig {
  enabled: boolean
  mode: EnvironmentMode
  apiKey: string
  apiSecret: string
  senderPhone: string
}

export interface SmtpConfig {
  enabled: boolean
  mode: EnvironmentMode
  host: string
  port: string
  username: string
  password: string
  fromEmail: string
  fromName: string
  encryption: 'tls' | 'ssl' | 'none'
}

export interface SendGridConfig {
  enabled: boolean
  mode: EnvironmentMode
  apiKey: string
  fromEmail: string
  fromName: string
}

// ------ Payment & Verification (2-3) ------

export type PaymentProvider = 'toss' | 'portone' | 'kakaopay' | 'identity_kcb' | 'identity_nice'

export interface TossPaymentsConfig {
  enabled: boolean
  mode: EnvironmentMode
  clientKey: string
  secretKey: string
}

export interface PortoneConfig {
  enabled: boolean
  mode: EnvironmentMode
  impUid: string
  apiKey: string
  apiSecret: string
}

export interface KakaopayConfig {
  enabled: boolean
  mode: EnvironmentMode
  cid: string
  adminKey: string
}

export interface IdentityVerificationConfig {
  enabled: boolean
  mode: EnvironmentMode
  provider: 'kcb' | 'nice'
  siteCode: string
  sitePw: string
}

// ------ Misc Integration (2-4) ------

export type MiscProvider =
  | 'ga4'
  | 'google_search_console'
  | 'naver_webmaster'
  | 'recaptcha_v3'
  | 'slack_webhook'

export interface Ga4Config {
  enabled: boolean
  measurementId: string
  apiSecret: string
}

export interface GoogleSearchConsoleConfig {
  enabled: boolean
  verificationCode: string
}

export interface NaverWebmasterConfig {
  enabled: boolean
  verificationCode: string
}

export interface RecaptchaV3Config {
  enabled: boolean
  siteKey: string
  secretKey: string
}

export interface SlackWebhookConfig {
  enabled: boolean
  webhookUrl: string
  channel: string
  events: string[]
}

// ------ API Request/Response ------

export interface ApiKeyListResponse {
  services: ApiKeyConfig[]
}

export interface ApiKeyUpdateRequest {
  enabled?: boolean
  mode?: EnvironmentMode
  values?: Record<string, string>
}

export interface ApiKeyUpdateResponse {
  service: string
  updated: boolean
}

export interface ApiKeyTestResponse {
  service: string
  success: boolean
  message: string
  testedAt: string
}
