import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getServiceDefinition } from '@/shared/lib/api-service-defs'
import { encrypt, decrypt } from '@/shared/lib/encryption'
import type { ApiKeyUpdateRequest } from '@letmein/types'

export async function PATCH(
  request: NextRequest,
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

    const body = (await request.json()) as ApiKeyUpdateRequest
    const prefix = `api.${service}`

    // Upsert helper
    const upsertSetting = async (key: string, value: string) => {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value, valueType: 'string' },
        update: { value },
      })
    }

    // Validate: cannot enable without required fields
    if (body.enabled === true && body.values) {
      const missingFields: string[] = []
      for (const field of def.fields) {
        if (field.required) {
          const newVal = body.values[field.key]
          if (!newVal) {
            // Check existing value
            const existing = await prisma.siteSetting.findUnique({
              where: { key: `${prefix}.${field.key}` },
            })
            const existingVal = existing?.value
              ? field.masked
                ? decrypt(existing.value)
                : existing.value
              : ''
            if (!existingVal) {
              missingFields.push(field.label)
            }
          }
        }
      }
      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `필수 항목이 비어있습니다: ${missingFields.join(', ')}`,
            },
          },
          { status: 400 },
        )
      }
    }

    // Update enabled flag
    if (body.enabled !== undefined) {
      await upsertSetting(`${prefix}.__enabled`, String(body.enabled))
    }

    // Update mode
    if (body.mode) {
      await upsertSetting(`${prefix}.__mode`, body.mode)
    }

    // Update field values
    if (body.values) {
      for (const field of def.fields) {
        const newValue = body.values[field.key]
        if (newValue !== undefined && newValue !== '') {
          const storedValue = field.masked ? encrypt(newValue) : newValue
          await upsertSetting(`${prefix}.${field.key}`, storedValue)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { service, updated: true },
    })
  } catch (error) {
    console.error('Failed to update API key:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'API 키 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
