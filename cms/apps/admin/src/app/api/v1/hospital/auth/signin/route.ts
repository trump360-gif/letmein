import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@letmein/db'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '이메일과 비밀번호를 입력하세요.' } },
        { status: 400 },
      )
    }

    const credential = await prisma.adminCredential.findUnique({ where: { email } })

    if (!credential || !credential.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
        { status: 401 },
      )
    }

    if (credential.role !== 'hospital') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '병원 계정이 아닙니다.' } },
        { status: 401 },
      )
    }

    const passwordOk = await bcrypt.compare(password, credential.passwordHash)
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
        { status: 401 },
      )
    }

    const hospitalId = credential.hospitalId
    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '병원 계정에 병원 정보가 연결되어 있지 않습니다.' } },
        { status: 401 },
      )
    }

    const token = await new SignJWT({
      sub: credential.id.toString(),
      email: credential.email,
      name: credential.name,
      role: 'hospital',
      hospitalId: hospitalId.toString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET)

    const res = NextResponse.json({
      success: true,
      data: {
        user: {
          id: Number(credential.id),
          email: credential.email,
          name: credential.name,
          role: 'hospital' as const,
          hospitalId: Number(hospitalId),
        },
        accessToken: token,
      },
    })

    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch (error) {
    console.error('Hospital signin error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '로그인에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
