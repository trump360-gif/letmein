import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname } = await request.json()

    if (!email || !password || !nickname) {
      return NextResponse.json({ success: false, error: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json({ success: false, error: '닉네임은 2~20자여야 합니다.' }, { status: 400 })
    }

    // 중복 확인
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }], deletedAt: null },
    })
    if (existing) {
      const field = existing.email === email ? '이메일' : '닉네임'
      return NextResponse.json({ success: false, error: `이미 사용 중인 ${field}입니다.` }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname,
        name: nickname,
        status: 'active',
      },
      select: { id: true, email: true, nickname: true },
    })

    const token = await createSession({ id: String(user.id), email: user.email ?? '', nickname: user.nickname })
    const { name, value, options } = setSessionCookie(token)

    const res = NextResponse.json({ success: true, user: { id: String(user.id), email: user.email, nickname: user.nickname } }, { status: 201 })
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
    return res
  } catch (e) {
    console.error('[signup]', e)
    return NextResponse.json({ success: false, error: '회원가입에 실패했습니다.' }, { status: 500 })
  }
}
