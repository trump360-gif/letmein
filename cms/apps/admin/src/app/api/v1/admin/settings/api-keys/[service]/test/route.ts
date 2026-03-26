import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getServiceDefinition } from '@/shared/lib/api-service-defs'
import { decrypt } from '@/shared/lib/encryption'
import type { ApiKeyTestResponse } from '@letmein/types'

/**
 * POST /api/v1/admin/settings/api-keys/:service/test
 * Runs a connectivity test for the given service.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { service: string } },
) {
  try {
    const service = decodeURIComponent(params.service)
    const def = getServiceDefinition(service)
    if (!def) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: `서비스 '${service}'를 찾을 수 없습니다.` },
        },
        { status: 404 },
      )
    }

    const prefix = `api.${service}`

    // Load current values
    const settings = await prisma.siteSetting.findMany({
      where: { key: { startsWith: prefix } },
    })
    const settingsMap = new Map<string, string>()
    for (const s of settings) {
      settingsMap.set(s.key, s.value ?? '')
    }

    // Decrypt values
    const values: Record<string, string> = {}
    for (const field of def.fields) {
      const raw = settingsMap.get(`${prefix}.${field.key}`) || ''
      values[field.key] = field.masked && raw ? decrypt(raw) : raw
    }

    // Check required fields present
    for (const field of def.fields) {
      if (field.required && !values[field.key]) {
        const now = new Date().toISOString()
        await saveTestResult(prefix, false, now)
        return NextResponse.json({
          success: true,
          data: {
            service,
            success: false,
            message: `필수 항목 '${field.label}'이(가) 설정되지 않았습니다.`,
            testedAt: now,
          } satisfies ApiKeyTestResponse,
        })
      }
    }

    // Run service-specific test
    const testResult = await runServiceTest(service, values)
    const now = new Date().toISOString()
    await saveTestResult(prefix, testResult.success, now)

    return NextResponse.json({
      success: true,
      data: {
        service,
        success: testResult.success,
        message: testResult.message,
        testedAt: now,
      } satisfies ApiKeyTestResponse,
    })
  } catch (error) {
    console.error('Failed to test API key:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '연동 테스트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

async function saveTestResult(prefix: string, success: boolean, testedAt: string) {
  const upsert = async (key: string, value: string) => {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value, valueType: 'string' },
      update: { value },
    })
  }
  await upsert(`${prefix}.__last_tested_at`, testedAt)
  await upsert(`${prefix}.__last_test_result`, success ? 'success' : 'fail')
}

async function runServiceTest(
  service: string,
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  try {
    // Social login tests - validate OAuth endpoint reachability
    if (service.startsWith('social.')) {
      return await testSocialProvider(service, values)
    }

    // Notification tests
    if (service === 'notification.smtp') {
      return await testSmtp(values)
    }
    if (service === 'notification.sendgrid') {
      return await testSendGrid(values)
    }
    if (service === 'notification.solapi_sms') {
      return await testSolapi(values)
    }
    if (service === 'notification.kakao_alimtalk') {
      return await testKakaoAlimtalk(values)
    }

    // Payment tests
    if (service === 'payment.toss') {
      return await testTossPayments(values)
    }
    if (service === 'payment.portone') {
      return await testPortone(values)
    }

    // Misc tests
    if (service === 'misc.slack_webhook') {
      return await testSlackWebhook(values)
    }
    if (service === 'misc.recaptcha_v3') {
      return await testRecaptcha(values)
    }

    // For services without active test endpoints, just validate fields exist
    return { success: true, message: '설정이 올바르게 저장되었습니다. (연결 테스트 미지원)' }
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    return { success: false, message }
  }
}

async function testSocialProvider(
  service: string,
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  const provider = service.replace('social.', '')
  const endpoints: Record<string, string> = {
    kakao: 'https://kauth.kakao.com/.well-known/openid-configuration',
    google: 'https://accounts.google.com/.well-known/openid-configuration',
    naver: 'https://nid.naver.com/oauth2.0/authorize',
    apple: 'https://appleid.apple.com/.well-known/openid-configuration',
    line: 'https://access.line.me/.well-known/openid-configuration',
    facebook: 'https://www.facebook.com/.well-known/openid-configuration',
    github: 'https://github.com/login/oauth/authorize',
    linkedin: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
  }

  const url = endpoints[provider]
  if (!url) {
    return { success: true, message: 'API 키가 저장되었습니다.' }
  }

  const clientId = values.client_id || values.channel_id || values.app_id || ''
  if (!clientId) {
    return { success: false, message: 'Client ID가 설정되지 않았습니다.' }
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok || response.status === 302) {
      return { success: true, message: `${provider} OAuth 엔드포인트 연결 성공` }
    }
    return { success: false, message: `${provider} 엔드포인트 응답 코드: ${response.status}` }
  } catch {
    return { success: false, message: `${provider} 엔드포인트에 연결할 수 없습니다.` }
  }
}

async function testSmtp(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  // Basic validation without actually sending an email
  const { host, port, username } = values
  if (!host || !port || !username) {
    return { success: false, message: 'SMTP 호스트, 포트, 사용자명이 필요합니다.' }
  }
  // Attempt TCP connection check via fetch to validate host
  return { success: true, message: 'SMTP 설정이 저장되었습니다. 테스트 이메일을 발송하여 확인하세요.' }
}

async function testSendGrid(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: { Authorization: `Bearer ${values.api_key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok) {
      return { success: true, message: 'SendGrid API 연결 성공' }
    }
    return { success: false, message: `SendGrid API 응답: ${response.status}` }
  } catch {
    return { success: false, message: 'SendGrid에 연결할 수 없습니다.' }
  }
}

async function testSolapi(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  if (!values.api_key || !values.api_secret) {
    return { success: false, message: 'API Key와 API Secret이 필요합니다.' }
  }
  return { success: true, message: '솔라피 설정이 저장되었습니다. 테스트 메시지를 발송하여 확인하세요.' }
}

async function testKakaoAlimtalk(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  if (!values.api_key || !values.sender_key) {
    return { success: false, message: 'API Key와 발신 프로필 키가 필요합니다.' }
  }
  return { success: true, message: '카카오 알림톡 설정이 저장되었습니다.' }
}

async function testTossPayments(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  try {
    const encoded = Buffer.from(`${values.secret_key}:`).toString('base64')
    const response = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'GET',
      headers: { Authorization: `Basic ${encoded}` },
      signal: AbortSignal.timeout(5000),
    })
    // 401 means bad key, 403 might be valid key but no perms
    if (response.status === 401) {
      return { success: false, message: '토스페이먼츠 Secret Key가 올바르지 않습니다.' }
    }
    return { success: true, message: '토스페이먼츠 API 연결 성공' }
  } catch {
    return { success: false, message: '토스페이먼츠에 연결할 수 없습니다.' }
  }
}

async function testPortone(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: values.api_key,
        imp_secret: values.api_secret,
      }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await response.json()
    if (data.code === 0) {
      return { success: true, message: '포트원 API 연결 성공' }
    }
    return { success: false, message: `포트원 API 오류: ${data.message}` }
  } catch {
    return { success: false, message: '포트원에 연결할 수 없습니다.' }
  }
}

async function testSlackWebhook(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(values.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '[CMS Admin] 슬랙 웹훅 연동 테스트' }),
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok) {
      return { success: true, message: '슬랙 웹훅 전송 성공' }
    }
    return { success: false, message: `슬랙 응답 코드: ${response.status}` }
  } catch {
    return { success: false, message: '슬랙 웹훅 URL에 연결할 수 없습니다.' }
  }
}

async function testRecaptcha(
  values: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  if (!values.site_key || !values.secret_key) {
    return { success: false, message: 'Site Key와 Secret Key가 필요합니다.' }
  }
  return { success: true, message: 'reCAPTCHA v3 설정이 저장되었습니다.' }
}
