import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

// 어드민 전용 라우트 패턴 (hospital 계정 접근 차단)
const ADMIN_ONLY_PREFIXES = [
  '/coordinator', '/hospitals', '/cast-members', '/cast-stories',
  '/episodes', '/premium', '/ads', '/members', '/operations',
  '/contents', '/config',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로: /login, /hospital-login, /api 통과
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/hospital-login') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_token')?.value

  if (!token) {
    // 병원 라우트(/hospital/*)는 /hospital-login으로, 나머지는 /login으로
    if (pathname.startsWith('/hospital')) {
      return NextResponse.redirect(new URL('/hospital-login', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const role = payload.role as string

    if (role === 'hospital') {
      // hospital 계정이 어드민 전용 라우트에 접근 시 대시보드로 리다이렉트
      const isAdminRoute = ADMIN_ONLY_PREFIXES.some(p => pathname.startsWith(p))
      if (isAdminRoute || pathname === '/') {
        return NextResponse.redirect(new URL('/hospital/dashboard', request.url))
      }
      // /hospital/* 라우트는 통과
      return NextResponse.next()
    } else {
      // admin 계정이 /hospital/* 에 접근 시 어드민 대시보드로 리다이렉트
      if (pathname.startsWith('/hospital')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return NextResponse.next()
    }
  } catch {
    const res = pathname.startsWith('/hospital')
      ? NextResponse.redirect(new URL('/hospital-login', request.url))
      : NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('admin_token')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
