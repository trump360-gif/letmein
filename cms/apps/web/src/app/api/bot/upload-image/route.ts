import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64, filename } = body

    if (!image_base64 || !filename) {
      return NextResponse.json({ success: false, error: 'image_base64 and filename required' }, { status: 400 })
    }

    const uploadDir = process.env.BOT_UPLOAD_DIR || join(process.cwd(), 'public/uploads/bot')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 안전한 파일명: 타임스탬프 + 원본명 (경로 순회 방지)
    const safeName = `${Date.now()}_${filename.replace(/[^a-z0-9._-]/gi, '_')}`
    const filePath = join(uploadDir, safeName)

    const buffer = Buffer.from(image_base64, 'base64')
    await writeFile(filePath, buffer)

    // public URL 계산
    const baseUrl = process.env.NEXT_PUBLIC_URL || ''
    const publicPath = `/uploads/bot/${safeName}`
    const url = `${baseUrl}${publicPath}`

    return NextResponse.json({ success: true, url }, { status: 201 })
  } catch (e) {
    console.error('[bot/upload-image]', e)
    return NextResponse.json({ success: false, error: 'internal error' }, { status: 500 })
  }
}
