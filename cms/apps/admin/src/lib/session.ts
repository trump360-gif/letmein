import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'beauti-admin-secret-key')

/**
 * Server Action / Route Handler에서 현재 로그인 어드민의 ID를 반환한다.
 * JWT cookie의 `sub` claim을 BigInt로 변환해 반환한다.
 * 세션이 없거나 유효하지 않으면 null을 반환한다.
 */
export async function getSessionAdminId(): Promise<bigint | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    const sub = payload.sub
    if (!sub) return null
    return BigInt(sub)
  } catch {
    return null
  }
}
