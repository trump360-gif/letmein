import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

export async function POST() {
  const token = await new SignJWT({
    sub: '1',
    role: 'admin',
    email: 'admin@letmein.kr',
    name: 'Admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)

  const res = NextResponse.json({
    success: true,
    data: {
      admin: { id: 1, email: 'admin@letmein.kr', name: 'Admin', role: 'admin' },
      accessToken: token,
    },
  })

  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  })

  return res
}
