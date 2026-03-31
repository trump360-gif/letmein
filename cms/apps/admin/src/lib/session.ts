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

/**
 * 현재 세션의 role을 반환한다. ('admin' | 'hospital' | null)
 * hospital_token 또는 admin_token을 모두 확인한다.
 */
export async function getSessionRole(): Promise<'admin' | 'hospital' | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('hospital_token')?.value ?? cookieStore.get('admin_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    const role = payload.role as string | undefined
    if (role === 'admin' || role === 'hospital') return role
    return null
  } catch {
    return null
  }
}

/**
 * role=hospital 세션에서 hospitalId를 BigInt로 반환한다.
 * role이 hospital이 아니거나 hospitalId가 없으면 null을 반환한다.
 * hospital_token을 우선 확인하고, 없으면 admin_token을 확인한다.
 */
export async function getSessionHospitalId(): Promise<bigint | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('hospital_token')?.value ?? cookieStore.get('admin_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    if (payload.role !== 'hospital') return null
    const hospitalId = payload.hospitalId as string | undefined
    if (!hospitalId) return null
    return BigInt(hospitalId)
  } catch {
    return null
  }
}
