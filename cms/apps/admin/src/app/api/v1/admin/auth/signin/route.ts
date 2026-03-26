import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const ADMIN_EMAIL = 'admin@admin.com'
const ADMIN_PASSWORD = '1234'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
        { status: 401 },
      )
    }

    const token = await new SignJWT({ email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(SECRET)

    const res = NextResponse.json({
      success: true,
      data: {
        admin: { email, role: 'admin', name: 'Admin' },
        accessToken: token,
      },
    })

    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '로그인에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
