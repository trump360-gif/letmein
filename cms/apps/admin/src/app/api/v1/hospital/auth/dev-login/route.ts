import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@letmein/db'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

export async function POST() {
  // 첫 번째 approved 병원을 찾아서 로그인
  const hospital = await prisma.hospital.findFirst({
    where: { status: 'approved' },
    select: { id: true, name: true, userId: true },
  })

  if (!hospital) {
    return NextResponse.json(
      { success: false, error: 'No approved hospital found' },
      { status: 404 },
    )
  }

  const token = await new SignJWT({
    sub: String(hospital.userId),
    role: 'hospital',
    hospitalId: String(hospital.id),
    email: `hospital-${hospital.id}@letmein.kr`,
    name: hospital.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)

  const res = NextResponse.json({
    success: true,
    data: {
      admin: {
        id: Number(hospital.userId),
        email: `hospital-${hospital.id}@letmein.kr`,
        name: hospital.name,
        role: 'hospital',
        hospitalId: Number(hospital.id),
      },
      accessToken: token,
    },
  })

  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return res
}
