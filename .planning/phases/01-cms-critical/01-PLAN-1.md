---
phase: 01-cms-critical
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/admin/auth/signin/route.ts
  - cms/apps/admin/src/lib/session.ts
  - cms/packages/db/prisma/schema.prisma
  - cms/apps/admin/src/app/(dashboard)/coordinator/actions.ts
  - cms/apps/admin/src/app/api/v1/admin/consultations/[id]/match/route.ts
  - cms/apps/admin/src/app/api/v1/admin/ads/creatives/[id]/review/route.ts
  - cms/apps/admin/src/app/(dashboard)/ads/actions.ts
  - cms/apps/admin/src/app/(dashboard)/cast-members/actions.ts
  - cms/apps/admin/src/app/api/v1/admin/cast-members/[id]/route.ts
  - cms/apps/admin/src/app/api/v1/admin/reports/[id]/process/route.ts
  - cms/apps/admin/src/app/api/v1/admin/sanctions/route.ts
  - cms/apps/admin/src/app/api/v1/admin/sanctions/[id]/route.ts
autonomous: true
requirements:
  - CMS-01
  - CMS-02
  - CMS-03

must_haves:
  truths:
    - "어드민이 DB에 등록된 email+password로 로그인할 수 있다 (하드코딩 admin@admin.com/1234 사용 불가)"
    - "로그인 성공 시 JWT payload에 실제 AdminUser.id와 email이 포함된다"
    - "coordinator/actions.ts의 matchHospital은 BigInt(1) 대신 세션에서 추출한 adminId를 사용한다"
    - "매칭 완료 시 채팅방(chat_rooms)이 매칭된 병원 수만큼 DB에 생성된다"
    - "BigInt(1) 하드코딩이 모든 Server Action과 API Route에서 제거된다"
  artifacts:
    - path: "cms/apps/admin/src/lib/session.ts"
      provides: "JWT 쿠키 파싱 → adminId(bigint) 반환하는 getSessionAdminId() 헬퍼"
      exports: ["getSessionAdminId"]
    - path: "cms/packages/db/prisma/schema.prisma"
      provides: "AdminCredential 모델 (email, passwordHash)"
      contains: "model AdminCredential"
  key_links:
    - from: "cms/apps/admin/src/app/api/v1/admin/auth/signin/route.ts"
      to: "prisma.adminCredential"
      via: "findUnique by email + bcrypt compare"
      pattern: "adminCredential.findUnique"
    - from: "cms/apps/admin/src/app/(dashboard)/coordinator/actions.ts"
      to: "cms/apps/admin/src/lib/session.ts"
      via: "getSessionAdminId() call"
      pattern: "getSessionAdminId"
    - from: "coordinator/actions.ts matchHospital"
      to: "prisma.chatRoom.create"
      via: "transaction after coordinatorMatch.create"
      pattern: "chatRoom.create"
---

<objective>
세 가지 CMS 핵심 결함을 수정한다: (1) 하드코딩 로그인 자격증명을 DB 기반 인증으로 교체, (2) 세션에서 실제 adminId를 읽도록 정상화, (3) 코디네이터 매칭 시 채팅방 자동 생성.

Purpose: 현재 CMS는 프로덕션에서 사용 불가한 상태다. admin@admin.com/1234로 누구나 접근할 수 있고, 모든 write 작업이 userId=1로 기록되고, 매칭을 완료해도 유저-병원 채팅방이 생성되지 않아 코디네이터 워크플로우가 단절된다.
Output: DB 기반 인증, getSessionAdminId() 헬퍼, 채팅방 자동 생성이 포함된 coordinator actions
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/codebase/ARCHITECTURE.md

<!-- Key interfaces the executor needs. No codebase exploration required. -->

<interfaces>
<!-- Prisma AdminUser model (existing — has no email/password, links to User via user_id) -->
```
model AdminUser {
  id         BigInt    @id @default(autoincrement())
  user_id    BigInt    @unique
  role_id    BigInt?
  created_at DateTime? @default(now())
  users      User      @relation(...)
  AdminRole  AdminRole? @relation(...)
}
```

<!-- Prisma ChatRoom model (existing) -->
```
model ChatRoom {
  id            BigInt   @id @default(autoincrement())
  requestId     BigInt?  @map("request_id")
  userId        BigInt   @map("user_id")
  hospitalId    BigInt   @map("hospital_id")
  status        String?  @default("active")
  createdAt     DateTime? @default(now())
}
```

<!-- Prisma CoordinatorMatch model (existing) -->
```
model CoordinatorMatch {
  requestId  BigInt  @map("request_id")
  hospitalId BigInt  @map("hospital_id")
  matchedBy  BigInt  @map("matched_by")   // <-- currently hardcoded BigInt(1)
  note       String?
  @@unique([requestId, hospitalId])
}
```

<!-- ConsultationRequest has userId field needed to create ChatRoom -->
```
model ConsultationRequest {
  id     BigInt @id
  userId BigInt @map("user_id")
  ...
}
```

<!-- JWT payload structure from existing signin route -->
```typescript
// Current (signin/route.ts) — hardcoded, no id:
{ email, role: 'admin' }

// Target — must include id so session helper can extract it:
{ sub: string,  // AdminCredential.id as string
  email: string,
  name: string,
  role: 'admin' }
```

<!-- AdminUser type from @letmein/types -->
```typescript
export interface AdminUser {
  id: number
  email: string
  nickname: string
  role: AdminRoleType
  permissions: string[]
  lastLoginAt: string | null
  createdAt: string
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: DB 기반 어드민 인증 (CMS-03)</name>
  <files>
    cms/packages/db/prisma/schema.prisma,
    cms/apps/admin/src/app/api/v1/admin/auth/signin/route.ts,
    cms/apps/admin/src/lib/session.ts
  </files>
  <read_first>
    - cms/apps/admin/src/app/api/v1/admin/auth/signin/route.ts
    - cms/packages/db/prisma/schema.prisma (AdminUser, User 모델 확인)
  </read_first>
  <action>
    **Step 1 — AdminCredential 모델 추가 (schema.prisma)**

    기존 AdminUser 모델 아래에 다음 모델을 추가한다. AdminUser는 건드리지 않는다.

    ```prisma
    model AdminCredential {
      id           BigInt    @id @default(autoincrement())
      email        String    @unique @db.VarChar(255)
      passwordHash String    @map("password_hash") @db.VarChar(255)
      name         String    @default("Admin") @db.VarChar(100)
      isActive     Boolean   @default(true) @map("is_active")
      createdAt    DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
      updatedAt    DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

      @@map("admin_credentials")
    }
    ```

    schema 변경 후 `cd /Users/jeonminjun/claude/letmein/cms && npx prisma db push --schema=packages/db/prisma/schema.prisma` 실행해 테이블을 생성한다.

    그 다음 시드 계정을 삽입한다 (bcrypt로 'admin1234' 해시):
    ```bash
    cd /Users/jeonminjun/claude/letmein/cms
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const db = new PrismaClient();
    async function seed() {
      const hash = await bcrypt.hash('admin1234', 10);
      await db.adminCredential.upsert({
        where: { email: 'admin@letmein.kr' },
        update: {},
        create: { email: 'admin@letmein.kr', passwordHash: hash, name: '슈퍼어드민' }
      });
      console.log('Seeded admin@letmein.kr / admin1234');
      await db.\$disconnect();
    }
    seed().catch(e => { console.error(e); process.exit(1); });
    "
    ```

    **Step 2 — signin/route.ts 교체 (CMS-03)**

    파일 전체를 교체한다. bcryptjs (이미 cms 의존성에 있거나 없으면 `npm install bcryptjs` in cms/apps/admin) 사용.

    ```typescript
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

        const passwordOk = await bcrypt.compare(password, credential.passwordHash)
        if (!passwordOk) {
          return NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
            { status: 401 },
          )
        }

        const token = await new SignJWT({
          sub: credential.id.toString(),
          email: credential.email,
          name: credential.name,
          role: 'admin',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(SECRET)

        const res = NextResponse.json({
          success: true,
          data: {
            admin: {
              id: Number(credential.id),
              email: credential.email,
              name: credential.name,
              role: 'admin',
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
        console.error('Signin error:', error)
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: '로그인에 실패했습니다.' } },
          { status: 500 },
        )
      }
    }
    ```

    **Step 3 — session.ts 생성 (CMS-02용 공유 헬퍼)**

    `cms/apps/admin/src/lib/session.ts` 신규 생성:

    ```typescript
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
    ```

    이 헬퍼는 다음 Task에서 모든 BigInt(1) 하드코딩 교체에 사용된다.
  </action>
  <verify>
    <automated>
      cd /Users/jeonminjun/claude/letmein/cms && \
      curl -s -X POST http://localhost:3001/api/v1/admin/auth/signin \
        -H 'Content-Type: application/json' \
        -d '{"email":"admin@letmein.kr","password":"admin1234"}' | grep -q '"success":true' && \
      echo "PASS: DB 기반 로그인 성공" || echo "FAIL: 로그인 실패"
    </automated>
  </verify>
  <done>
    - admin_credentials 테이블이 DB에 존재하고 시드 계정(admin@letmein.kr)이 있다
    - POST /api/v1/admin/auth/signin에 admin@letmein.kr / admin1234로 요청 시 200 + JWT 반환
    - 틀린 비밀번호는 401 반환
    - JWT payload에 sub(adminCredential.id), email, role이 포함된다
    - getSessionAdminId() 헬퍼가 cms/apps/admin/src/lib/session.ts에 존재한다
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: 세션 정상화 + 채팅방 자동 생성 (CMS-02 + CMS-01)</name>
  <files>
    cms/apps/admin/src/app/(dashboard)/coordinator/actions.ts,
    cms/apps/admin/src/app/api/v1/admin/consultations/[id]/match/route.ts,
    cms/apps/admin/src/app/api/v1/admin/ads/creatives/[id]/review/route.ts,
    cms/apps/admin/src/app/(dashboard)/ads/actions.ts,
    cms/apps/admin/src/app/(dashboard)/cast-members/actions.ts,
    cms/apps/admin/src/app/api/v1/admin/cast-members/[id]/route.ts,
    cms/apps/admin/src/app/api/v1/admin/reports/[id]/process/route.ts,
    cms/apps/admin/src/app/api/v1/admin/sanctions/route.ts,
    cms/apps/admin/src/app/api/v1/admin/sanctions/[id]/route.ts
  </files>
  <read_first>
    - cms/apps/admin/src/app/(dashboard)/coordinator/actions.ts
    - cms/apps/admin/src/app/(dashboard)/ads/actions.ts
    - cms/apps/admin/src/app/(dashboard)/cast-members/actions.ts
    - cms/apps/admin/src/app/api/v1/admin/ads/creatives/[id]/review/route.ts
    - cms/apps/admin/src/app/api/v1/admin/cast-members/[id]/route.ts
    - cms/apps/admin/src/app/api/v1/admin/reports/[id]/process/route.ts
    - cms/apps/admin/src/app/api/v1/admin/sanctions/route.ts
    - cms/apps/admin/src/app/api/v1/admin/sanctions/[id]/route.ts
  </read_first>
  <action>
    **CMS-01 + CMS-02: coordinator/actions.ts 전면 수정 (가장 중요)**

    현재 `matchHospital`은:
    1. `matchedBy: BigInt(1)` 하드코딩 (CMS-02 버그)
    2. ChatRoom을 생성하지 않음 (CMS-01 버그 — 코디네이터 워크플로우 단절의 핵심 원인)

    `coordinator/actions.ts`를 다음으로 교체한다:

    ```typescript
    'use server'

    import { prisma } from '@letmein/db'
    import { revalidatePath } from 'next/cache'
    import { getSessionAdminId } from '@/lib/session'

    export async function matchHospital(requestId: number, hospitalId: number, note: string) {
      const adminId = await getSessionAdminId()
      if (!adminId) throw new Error('인증이 필요합니다.')

      await prisma.$transaction(async (tx) => {
        // 1. 상담 요청의 userId 조회 (ChatRoom 생성에 필요)
        const request = await tx.consultationRequest.findUniqueOrThrow({
          where: { id: BigInt(requestId) },
          select: { userId: true },
        })

        // 2. 코디네이터 매칭 생성
        await tx.coordinatorMatch.create({
          data: {
            requestId: BigInt(requestId),
            hospitalId: BigInt(hospitalId),
            matchedBy: adminId,   // per CMS-02: BigInt(1) → 실제 세션 ID
            note: note || null,
          },
        })

        // 3. 채팅방 자동 생성 (per CMS-01)
        await tx.chatRoom.create({
          data: {
            requestId: BigInt(requestId),
            userId: request.userId,
            hospitalId: BigInt(hospitalId),
            status: 'active',
          },
        })

        // 4. 상담 요청 상태 업데이트
        await tx.consultationRequest.update({
          where: { id: BigInt(requestId) },
          data: { status: 'matched', matchedAt: new Date() },
        })
      })

      revalidatePath('/coordinator')
    }

    export async function updateConsultationStatus(requestId: number, status: string, note?: string) {
      await prisma.consultationRequest.update({
        where: { id: BigInt(requestId) },
        data: {
          status,
          coordinatorNote: note ?? null,
        },
      })
      revalidatePath('/coordinator')
    }
    ```

    **CMS-02: consultations/[id]/match/route.ts 수정**

    `matchedBy: BigInt(1)` → `getSessionAdminId()` 교체:
    ```typescript
    import { getSessionAdminId } from '@/lib/session'
    // ...
    const adminId = await getSessionAdminId() ?? BigInt(1) // fallback only if no session
    // CoordinatorMatch 생성 시:
    matchedBy: adminId,
    ```
    또한 이 route도 ChatRoom을 생성하지 않으므로 coordinator/actions.ts와 동일한 패턴으로 ChatRoom 생성 로직을 추가한다 (requestId → consultationRequest.userId 조회 후 chatRoom.create).

    **CMS-02: 나머지 BigInt(1) 하드코딩 일괄 교체**

    아래 패턴으로 각 파일을 수정한다. Server Action(`'use server'`)이면 `getSessionAdminId()`를, Route Handler이면 request 쿠키에서 읽는다. Server Action에서는 `@/lib/session`의 `getSessionAdminId()`를 import한다. Route Handler에서도 동일하게 import 가능하다 (`cookies()` 내부에서 `next/headers` 사용).

    수정 파일별 변경 요약:

    | 파일 | 변경 내용 |
    |------|-----------|
    | `ads/actions.ts` | `reviewedBy: BigInt(1)` × 2 → `await getSessionAdminId() ?? BigInt(1)` |
    | `ads/creatives/[id]/review/route.ts` | `reviewedBy: BigInt(1)` → `await getSessionAdminId() ?? BigInt(1)` |
    | `cast-members/actions.ts` | `verifiedBy: BigInt(1)` × 2 → `await getSessionAdminId() ?? BigInt(1)` |
    | `cast-members/[id]/route.ts` | `data.verifiedBy = BigInt(1)` → `await getSessionAdminId() ?? BigInt(1)` |
    | `reports/[id]/process/route.ts` | `adminUserId = BigInt(1)` → `await getSessionAdminId() ?? BigInt(1)` |
    | `sanctions/route.ts` | `adminUserId = BigInt(1)` → `await getSessionAdminId() ?? BigInt(1)` |
    | `sanctions/[id]/route.ts` | `adminUserId = BigInt(1)` → `await getSessionAdminId() ?? BigInt(1)` |

    null fallback(`?? BigInt(1)`)을 유지하는 이유: Route Handler는 session 없이도 호출될 수 있고, 이 Phase에서 강제 인증은 별도 scope이므로 graceful fallback으로 처리한다. Server Action은 `throw new Error('인증이 필요합니다.')` 처리한다.
  </action>
  <verify>
    <automated>
      # BigInt(1) 하드코딩이 coordinator/actions.ts에서 완전히 제거됐는지 확인
      grep -n "BigInt(1)" /Users/jeonminjun/claude/letmein/cms/apps/admin/src/app/(dashboard)/coordinator/actions.ts && echo "FAIL: BigInt(1) 잔존" || echo "PASS: coordinator actions 정리됨"
    </automated>
  </verify>
  <acceptance_criteria>
    - coordinator/actions.ts의 matchHospital은 BigInt(1) 대신 getSessionAdminId()를 사용한다
    - matchHospital 트랜잭션 내에 chatRoom.create가 포함된다 (requestId, userId, hospitalId 포함)
    - 매칭 완료 후 chat_rooms 테이블에 해당 요청-병원 조합의 채팅방 레코드가 생성된다
    - 7개 파일에서 BigInt(1) 하드코딩이 getSessionAdminId() 호출로 교체된다
    - 빌드 오류 없음: `cd /Users/jeonminjun/claude/letmein/cms && npx turbo build --filter=admin 2>&1 | tail -5`
  </acceptance_criteria>
</task>

</tasks>

<verification>
1. admin_credentials 테이블이 PostgreSQL에 존재한다
2. POST /api/v1/admin/auth/signin으로 DB 인증이 동작한다 (admin@letmein.kr/admin1234)
3. JWT에 `sub` claim이 포함된다 (getSessionAdminId()가 파싱 가능)
4. coordinator/actions.ts에서 BigInt(1)이 0건 검색된다
5. coordinator/actions.ts 트랜잭션에 chatRoom.create가 포함된다
6. cms 빌드가 오류 없이 통과한다
</verification>

<success_criteria>
- 하드코딩 admin@admin.com/1234로는 로그인 불가 — DB에 없는 계정
- admin@letmein.kr / admin1234로 로그인 성공
- 매칭 완료 시 chat_rooms 레코드 생성됨
- BigInt(1) 하드코딩이 coordinator, ads, cast-members, reports, sanctions 파일에서 제거됨
</success_criteria>

<output>
완료 후 `.planning/phases/01-cms-critical/01-01-SUMMARY.md` 생성
</output>
