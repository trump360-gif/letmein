import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null, status: 'active' },
      select: { id: true, email: true, nickname: true, passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // 마지막 로그인 시간 업데이트
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {})

    const token = await createSession({ id: String(user.id), email: user.email ?? '', nickname: user.nickname })
    const { name, value, options } = setSessionCookie(token)

    const res = NextResponse.json({ success: true, user: { id: String(user.id), email: user.email, nickname: user.nickname } })
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    return res
  } catch (e) {
    console.error('[login]', e)
    return NextResponse.json({ success: false, error: '로그인에 실패했습니다.' }, { status: 500 })
  }
}
