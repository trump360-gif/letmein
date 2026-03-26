// ==================== 1-1. 기본 정보 ====================

export interface SiteBasicInfo {
  siteName: string
  siteUrl: string
  logoUrl: string | null
  faviconUrl: string | null
  contactEmail: string
  businessName: string | null
  businessNumber: string | null
  businessRepresentative: string | null
  businessAddress: string | null
  copyrightText: string | null
}

// ==================== 1-2. SEO / AO / GEO ====================

export interface SiteSeoSettings {
  titleFormat: string
  metaDescription: string
  ogImage: string | null
  ga4MeasurementId: string | null
  naverVerificationCode: string | null
  googleVerificationCode: string | null
}

export interface SiteAoSettings {
  siteIntroduction: string
}

export interface SiteGeoSettings {
  defaultSchemaType: string
}

// ==================== 1-4. 보안 설정 ====================

export interface SiteSecuritySettings {
  loginAttemptLimit: number
  loginLockDurationMinutes: number
  ipBlockEnabled: boolean
  blockedIps: string
  admin2faEnabled: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
}

// ==================== 1-5. 환경 설정 ====================

export interface SiteEnvironmentSettings {
  defaultLanguage: string
  timezone: string
  dateFormat: string
  maintenanceMode: boolean
  maintenanceMessage: string | null
  maintenanceScheduledAt: string | null
  maintenanceScheduledEnd: string | null
}

// ==================== 전체 설정 (key-value 기반) ====================

export interface SiteSettingsMap {
  [key: string]: {
    value: string | null
    valueType: string
    description: string | null
  }
}

export interface SiteSettingItem {
  id: string
  key: string
  value: string | null
  valueType: string
  description: string | null
  updatedAt: string
}

export interface SiteSettingsResponse {
  settings: SiteSettingItem[]
}

export interface SiteSettingsUpdatePayload {
  settings: Array<{
    key: string
    value: string | null
  }>
}

// ==================== 1-3. 약관 ====================

export interface TermsItem {
  id: string
  type: string
  version: string
  title: string
  content: string
  isRequired: boolean
  enforcedAt: string
  createdAt: string
}

export interface TermsListResponse {
  terms: TermsItem[]
}

export interface TermsCreatePayload {
  type: string
  version: string
  title: string
  content: string
  isRequired: boolean
  enforcedAt: string
}

// ==================== 1-6. 다국어 ====================

export interface TranslationItem {
  id: string
  key: string
  ko: string
  ja: string | null
  en: string | null
  createdAt: string
  updatedAt: string
}

export interface TranslationsListResponse {
  translations: TranslationItem[]
  total: number
}

export interface TranslationCreatePayload {
  key: string
  ko: string
  ja?: string | null
  en?: string | null
}

export interface TranslationUpdatePayload {
  id: string
  ko?: string
  ja?: string | null
  en?: string | null
}
