import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { SERVICE_DEFINITIONS } from '@/shared/lib/api-service-defs'
import { decrypt, maskValue } from '@/shared/lib/encryption'
import type { ApiKeyConfig, EnvironmentMode, ServiceStatus } from '@letmein/types'

export async function GET() {
  try {
    // Fetch all api.* settings from SiteSetting
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          startsWith: 'api.',
        },
      },
    })

    // Build a lookup map: key -> value
    const settingsMap = new Map<string, string>()
    for (const s of settings) {
      settingsMap.set(s.key, s.value ?? '')
    }

    const services: ApiKeyConfig[] = SERVICE_DEFINITIONS.map((def) => {
      const prefix = `api.${def.service}`
      const enabled = settingsMap.get(`${prefix}.__enabled`) === 'true'
      const mode = (settingsMap.get(`${prefix}.__mode`) as EnvironmentMode) || 'test'
      const lastTestedAt = settingsMap.get(`${prefix}.__last_tested_at`) || null
      const lastTestResult =
        (settingsMap.get(`${prefix}.__last_test_result`) as 'success' | 'fail') || null

      // Determine status
      let status: ServiceStatus = 'inactive'
      if (enabled) {
        status = lastTestResult === 'fail' ? 'error' : 'active'
      }

      // Build values with masking
      const values: Record<string, string> = {}
      for (const field of def.fields) {
        const raw = settingsMap.get(`${prefix}.${field.key}`) || ''
        if (field.masked && raw) {
          const decrypted = decrypt(raw)
          values[field.key] = maskValue(decrypted)
        } else {
          values[field.key] = raw
        }
      }

      return {
        service: def.service,
        category: def.category,
        displayName: def.displayName,
        enabled,
        mode,
        status,
        fields: def.fields,
        values,
        lastTestedAt,
        lastTestResult,
      }
    })

    return NextResponse.json({ success: true, data: { services } })
  } catch (error) {
    console.error('Failed to fetch API keys:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'API 키 목록을 가져오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
