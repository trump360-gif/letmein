import type { ApiCategory, ApiKeyField } from '@letmein/types'

export interface ServiceDefinition {
  service: string
  category: ApiCategory
  displayName: string
  fields: ApiKeyField[]
}

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // ===== Social Login (2-1) =====
  {
    service: 'social.kakao',
    category: 'social',
    displayName: '카카오 로그인',
    fields: [
      { key: 'client_id', label: 'REST API 키', required: true, masked: true },
      { key: 'client_secret', label: 'Client Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.google',
    category: 'social',
    displayName: '구글 로그인',
    fields: [
      { key: 'client_id', label: 'Client ID', required: true, masked: true },
      { key: 'client_secret', label: 'Client Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.naver',
    category: 'social',
    displayName: '네이버 로그인',
    fields: [
      { key: 'client_id', label: 'Client ID', required: true, masked: true },
      { key: 'client_secret', label: 'Client Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.apple',
    category: 'social',
    displayName: 'Apple 로그인',
    fields: [
      { key: 'client_id', label: 'Service ID', required: true, masked: true },
      { key: 'team_id', label: 'Team ID', required: true, masked: true },
      { key: 'key_id', label: 'Key ID', required: true, masked: true },
      { key: 'private_key', label: 'Private Key', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.line',
    category: 'social',
    displayName: 'LINE 로그인',
    fields: [
      { key: 'channel_id', label: 'Channel ID', required: true, masked: true },
      { key: 'channel_secret', label: 'Channel Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.facebook',
    category: 'social',
    displayName: 'Facebook 로그인',
    fields: [
      { key: 'app_id', label: 'App ID', required: true, masked: true },
      { key: 'app_secret', label: 'App Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.github',
    category: 'social',
    displayName: 'GitHub 로그인',
    fields: [
      { key: 'client_id', label: 'Client ID', required: true, masked: true },
      { key: 'client_secret', label: 'Client Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },
  {
    service: 'social.linkedin',
    category: 'social',
    displayName: 'LinkedIn 로그인',
    fields: [
      { key: 'client_id', label: 'Client ID', required: true, masked: true },
      { key: 'client_secret', label: 'Client Secret', required: true, masked: true },
      { key: 'callback_url', label: 'Redirect URI', required: false, masked: false },
    ],
  },

  // ===== Notification API (2-2) =====
  {
    service: 'notification.kakao_alimtalk',
    category: 'notification',
    displayName: '카카오 알림톡',
    fields: [
      { key: 'api_key', label: 'API Key', required: true, masked: true },
      { key: 'api_secret', label: 'API Secret', required: true, masked: true },
      { key: 'sender_key', label: '발신 프로필 키', required: true, masked: true },
      { key: 'channel_id', label: '채널 ID', required: true, masked: false },
    ],
  },
  {
    service: 'notification.solapi_sms',
    category: 'notification',
    displayName: 'SMS (솔라피)',
    fields: [
      { key: 'api_key', label: 'API Key', required: true, masked: true },
      { key: 'api_secret', label: 'API Secret', required: true, masked: true },
      { key: 'sender_phone', label: '발신번호', required: true, masked: false },
    ],
  },
  {
    service: 'notification.smtp',
    category: 'notification',
    displayName: '이메일 SMTP',
    fields: [
      { key: 'host', label: 'SMTP 호스트', required: true, masked: false },
      { key: 'port', label: '포트', required: true, masked: false },
      { key: 'username', label: '사용자명', required: true, masked: false },
      { key: 'password', label: '비밀번호', required: true, masked: true },
      { key: 'from_email', label: '발신 이메일', required: true, masked: false },
      { key: 'from_name', label: '발신자명', required: false, masked: false },
      { key: 'encryption', label: '암호화 (tls/ssl/none)', required: false, masked: false },
    ],
  },
  {
    service: 'notification.sendgrid',
    category: 'notification',
    displayName: 'SendGrid',
    fields: [
      { key: 'api_key', label: 'API Key', required: true, masked: true },
      { key: 'from_email', label: '발신 이메일', required: true, masked: false },
      { key: 'from_name', label: '발신자명', required: false, masked: false },
    ],
  },

  // ===== Payment / Identity Verification (2-3) =====
  {
    service: 'payment.toss',
    category: 'payment',
    displayName: '토스페이먼츠',
    fields: [
      { key: 'client_key', label: 'Client Key', required: true, masked: true },
      { key: 'secret_key', label: 'Secret Key', required: true, masked: true },
    ],
  },
  {
    service: 'payment.portone',
    category: 'payment',
    displayName: '포트원',
    fields: [
      { key: 'imp_uid', label: '가맹점 UID', required: true, masked: true },
      { key: 'api_key', label: 'API Key', required: true, masked: true },
      { key: 'api_secret', label: 'API Secret', required: true, masked: true },
    ],
  },
  {
    service: 'payment.kakaopay',
    category: 'payment',
    displayName: '카카오페이',
    fields: [
      { key: 'cid', label: 'CID (가맹점코드)', required: true, masked: true },
      { key: 'admin_key', label: 'Admin Key', required: true, masked: true },
    ],
  },
  {
    service: 'payment.identity_kcb',
    category: 'payment',
    displayName: '본인인증 (KCB)',
    fields: [
      { key: 'site_code', label: '사이트 코드', required: true, masked: true },
      { key: 'site_pw', label: '사이트 비밀번호', required: true, masked: true },
    ],
  },
  {
    service: 'payment.identity_nice',
    category: 'payment',
    displayName: '본인인증 (나이스)',
    fields: [
      { key: 'site_code', label: '사이트 코드', required: true, masked: true },
      { key: 'site_pw', label: '사이트 비밀번호', required: true, masked: true },
    ],
  },

  // ===== Misc Integration (2-4) =====
  {
    service: 'misc.ga4',
    category: 'misc',
    displayName: 'Google Analytics 4',
    fields: [
      { key: 'measurement_id', label: '측정 ID (G-XXXXXXX)', required: true, masked: false },
      { key: 'api_secret', label: 'API Secret', required: false, masked: true },
    ],
  },
  {
    service: 'misc.google_search_console',
    category: 'misc',
    displayName: '구글 서치콘솔',
    fields: [
      { key: 'verification_code', label: '인증 코드', required: true, masked: false },
    ],
  },
  {
    service: 'misc.naver_webmaster',
    category: 'misc',
    displayName: '네이버 웹마스터',
    fields: [
      { key: 'verification_code', label: '인증 코드', required: true, masked: false },
    ],
  },
  {
    service: 'misc.recaptcha_v3',
    category: 'misc',
    displayName: 'reCAPTCHA v3',
    fields: [
      { key: 'site_key', label: 'Site Key', required: true, masked: false },
      { key: 'secret_key', label: 'Secret Key', required: true, masked: true },
    ],
  },
  {
    service: 'misc.slack_webhook',
    category: 'misc',
    displayName: '슬랙 웹훅',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', required: true, masked: true },
      { key: 'channel', label: '채널명', required: false, masked: false },
    ],
  },
]

export function getServiceDefinition(service: string): ServiceDefinition | undefined {
  return SERVICE_DEFINITIONS.find((s) => s.service === service)
}

export function getServicesByCategory(category: ApiCategory): ServiceDefinition[] {
  return SERVICE_DEFINITIONS.filter((s) => s.category === category)
}
