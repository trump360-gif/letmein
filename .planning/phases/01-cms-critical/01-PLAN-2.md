---
phase: 01-cms-critical
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx
  - cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx
  - cms/apps/admin/src/app/(dashboard)/premium/actions.ts
  - cms/apps/admin/src/app/api/v1/admin/premium/route.ts
  - cms/packages/types/src/letmein.ts
autonomous: true
requirements:
  - CMS-04
  - CMS-05

must_haves:
  truths:
    - "어드민이 병원 목록에서 병원을 클릭하면 상세 페이지로 이동해 병원 정보·전문분야·의료진을 볼 수 있다"
    - "어드민이 특정 병원 사용자에게 프리미엄 구독을 신규 부여(tier + 만료일 설정)할 수 있다"
    - "프리미엄 페이지에서 부여 버튼 클릭 시 hospitalId, tier, expiresAt을 받아 HospitalSubscription을 생성한다"
  artifacts:
    - path: "cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx"
      provides: "병원 상세 Server Component — prisma로 hospital + specialties + doctors 조회"
      exports: ["default Page"]
    - path: "cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx"
      provides: "병원 상세 UI — 기본정보/전문분야/의료진 섹션을 탭 없이 펼쳐서 표시 (CLAUDE.md 규칙)"
    - path: "cms/apps/admin/src/app/(dashboard)/premium/actions.ts"
      provides: "grantSubscription Server Action — 신규 구독 생성 + hospital.isPremium/premiumTier 업데이트"
      contains: "grantSubscription"
  key_links:
    - from: "cms/apps/admin/src/views/hospitals/components/hospital-table.tsx"
      to: "cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx"
      via: "병원명 <Link href={`/hospitals/${h.id}`}>"
      pattern: "/hospitals/[id]"
    - from: "cms/apps/admin/src/views/premium/index.tsx"
      to: "cms/apps/admin/src/app/(dashboard)/premium/actions.ts"
      via: "grantSubscription(hospitalId, tier, expiresAt) Server Action 호출"
      pattern: "grantSubscription"
---

<objective>
두 가지 어드민 기능 누락을 추가한다: (1) 병원 상세 페이지 (정보·전문분야·의료진 조회), (2) 프리미엄 구독 부여 기능 (현재 취소만 가능).

Purpose: 어드민이 병원을 검토하고 프리미엄 혜택을 수동으로 부여할 수 있어야 비즈니스 운영이 가능하다.
Output: /hospitals/[id] 상세 페이지, 프리미엄 부여 Server Action + UI 버튼
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
<!-- Prisma Hospital + related models -->
```
model Hospital {
  id                 BigInt               @id @default(autoincrement())
  userId             BigInt               @map("user_id")
  name               String
  businessNumber     String?
  licenseImage       String?
  description        String?
  address            String?
  phone              String?
  operatingHours     String?
  profileImage       String?
  status             String?              @default("pending")
  isPremium          Boolean?             @default(false)
  premiumTier        String?
  specialties        HospitalSpecialty[]
  doctors            HospitalDoctor[]
  subscriptions      HospitalSubscription[]
}

model HospitalSpecialty {
  id         BigInt            @id @default(autoincrement())
  hospitalId BigInt            @map("hospital_id")
  categoryId Int?              @map("category_id")
  hospital   Hospital          @relation(...)
  category   ProcedureCategory @relation(...)
}

model HospitalDoctor {
  id           BigInt   @id @default(autoincrement())
  hospitalId   BigInt   @map("hospital_id")
  name         String
  title        String?
  experience   String?
  profileImage String?  @map("profile_image")
  sortOrder    Int?     @default(0) @map("sort_order")
}

model HospitalSubscription {
  id           BigInt    @id @default(autoincrement())
  hospitalId   BigInt    @map("hospital_id")
  tier         String    @default("basic")    // 'basic' | 'standard' | 'premium'
  status       String    @default("active")   // 'active' | 'expired' | 'cancelled'
  startedAt    DateTime  @default(now())
  expiresAt    DateTime
  monthlyPrice Int       @map("monthly_price")
}
```

<!-- Existing TypeScript types in @letmein/types -->
```typescript
export interface HospitalDoctor {
  id: number
  hospitalId: number
  name: string
  title: string | null
  experience: string | null
  profileImage: string | null
  sortOrder: number
  createdAt: string
}

export interface HospitalSubscription {
  id: number
  hospitalId: number
  tier: SubscriptionTier       // 'basic' | 'standard' | 'premium'
  status: SubscriptionStatus   // 'active' | 'expired' | 'cancelled'
  startedAt: string
  expiresAt: string
  cancelledAt: string | null
  monthlyPrice: number
  createdAt: string
  updatedAt: string
  hospitalName?: string
}
```

<!-- Existing hospital table component (partial) — to add link to detail -->
<!-- File: cms/apps/admin/src/views/hospitals/components/hospital-table.tsx -->
<!-- HospitalTable renders hospital rows; hospital.name cell needs <Link href={`/hospitals/${h.id}`}> -->

<!-- Existing premium view — to add grant UI -->
<!-- File: cms/apps/admin/src/views/premium/index.tsx -->
<!-- PremiumPage already has cancelSubscription; needs grantSubscription form/button -->

<!-- CMS UI rules (from CLAUDE.md):
  - Accordion/Collapsible 절대 사용 금지
  - 복잡한 폼은 Wizard/Stepper 방식
  - 드롭다운 전면 금지 → tier 선택은 칩(chip) 버튼으로
-->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: 병원 상세 페이지 생성 (CMS-04)</name>
  <files>
    cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx,
    cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx,
    cms/packages/types/src/letmein.ts,
    cms/apps/admin/src/views/hospitals/components/hospital-table.tsx
  </files>
  <read_first>
    - cms/apps/admin/src/app/(dashboard)/hospitals/page.tsx (기존 패턴 참고)
    - cms/apps/admin/src/views/hospitals/index.tsx
    - cms/apps/admin/src/views/hospitals/components/hospital-table.tsx
    - cms/packages/types/src/letmein.ts (HospitalDoctor, Hospital 타입 확인)
  </read_first>
  <action>
    **Step 1 — HospitalDetail 타입 추가 (letmein.ts)**

    `cms/packages/types/src/letmein.ts`에 아래 인터페이스를 Hospital 블록 아래에 추가한다:

    ```typescript
    export interface HospitalSpecialty {
      id: number
      hospitalId: number
      categoryId: number | null
      categoryName: string | null
    }

    export interface HospitalDetail extends Hospital {
      specialties: HospitalSpecialty[]
      doctors: HospitalDoctor[]
    }
    ```

    **Step 2 — HospitalDetailView 컴포넌트 생성**

    `cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx` 생성:

    ```typescript
    'use client'

    import Link from 'next/link'
    import type { HospitalDetail } from '@letmein/types'
    import { cn } from '@letmein/utils'

    const STATUS_COLORS: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    }

    const STATUS_LABELS: Record<string, string> = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거부됨',
      suspended: '정지됨',
    }

    interface HospitalDetailViewProps {
      hospital: HospitalDetail
    }

    export function HospitalDetailView({ hospital }: HospitalDetailViewProps) {
      return (
        <div className="space-y-8">
          {/* 헤더 */}
          <div className="flex items-center gap-4">
            <Link
              href="/hospitals"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← 병원 목록
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{hospital.name}</h2>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[hospital.status] ?? 'bg-gray-100')}>
                  {STATUS_LABELS[hospital.status] ?? hospital.status}
                </span>
                {hospital.isPremium && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    {hospital.premiumTier ?? 'Premium'}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">ID: {hospital.id}</p>
            </div>
          </div>

          {/* 기본 정보 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold">기본 정보</h3>
            <div className="rounded-lg border">
              <table className="w-full">
                <tbody className="divide-y">
                  {[
                    ['사업자번호', hospital.businessNumber ?? '-'],
                    ['주소', hospital.address ?? '-'],
                    ['전화번호', hospital.phone ?? '-'],
                    ['영업시간', hospital.operatingHours ?? '-'],
                    ['케이스 수', String(hospital.caseCount)],
                    ['등록일', new Date(hospital.createdAt).toLocaleDateString('ko-KR')],
                    ['승인일', hospital.approvedAt ? new Date(hospital.approvedAt).toLocaleDateString('ko-KR') : '-'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="w-32 bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground">{label}</td>
                      <td className="px-4 py-3 text-sm">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 소개 */}
          {hospital.description && (
            <section>
              <h3 className="mb-4 text-lg font-semibold">병원 소개</h3>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {hospital.description}
              </div>
            </section>
          )}

          {/* 전문분야 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold">
              전문분야 <span className="text-sm font-normal text-muted-foreground">({hospital.specialties.length}개)</span>
            </h3>
            {hospital.specialties.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 전문분야가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hospital.specialties.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-border px-3 py-1 text-sm"
                  >
                    {s.categoryName ?? `카테고리 #${s.categoryId}`}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 의료진 */}
          <section>
            <h3 className="mb-4 text-lg font-semibold">
              의료진 <span className="text-sm font-normal text-muted-foreground">({hospital.doctors.length}명)</span>
            </h3>
            {hospital.doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 의료진이 없습니다.</p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">이름</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">직함</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">경력</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {hospital.doctors.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{d.title ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{d.experience ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )
    }
    ```

    **Step 3 — Server Component 페이지 생성**

    `cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx` 생성:

    ```typescript
    import { notFound } from 'next/navigation'
    import { prisma } from '@letmein/db'
    import { HospitalDetailView } from '@/views/hospitals/detail/HospitalDetailView'
    import type { HospitalDetail } from '@letmein/types'

    export default async function Page({ params }: { params: { id: string } }) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: BigInt(params.id) },
        include: {
          user: { select: { nickname: true } },
          specialties: {
            include: { category: { select: { name: true } } },
          },
          doctors: { orderBy: { sortOrder: 'asc' } },
        },
      })

      if (!hospital) notFound()

      const data: HospitalDetail = {
        id: Number(hospital.id),
        userId: Number(hospital.userId),
        name: hospital.name,
        businessNumber: hospital.businessNumber,
        licenseImage: hospital.licenseImage,
        description: hospital.description,
        address: hospital.address,
        phone: hospital.phone,
        operatingHours: hospital.operatingHours,
        profileImage: hospital.profileImage,
        status: (hospital.status ?? 'pending') as HospitalDetail['status'],
        isPremium: hospital.isPremium ?? false,
        premiumTier: hospital.premiumTier,
        introVideoUrl: hospital.introVideoUrl,
        detailedDescription: hospital.detailedDescription,
        caseCount: hospital.caseCount ?? 0,
        approvedAt: hospital.approvedAt?.toISOString() ?? null,
        createdAt: (hospital.createdAt ?? new Date()).toISOString(),
        updatedAt: (hospital.updatedAt ?? new Date()).toISOString(),
        userName: hospital.user.nickname ?? undefined,
        specialties: hospital.specialties.map((s) => ({
          id: Number(s.id),
          hospitalId: Number(s.hospitalId),
          categoryId: s.categoryId,
          categoryName: s.category?.name ?? null,
        })),
        doctors: hospital.doctors.map((d) => ({
          id: Number(d.id),
          hospitalId: Number(d.hospitalId),
          name: d.name,
          title: d.title,
          experience: d.experience,
          profileImage: d.profileImage ?? null,
          sortOrder: d.sortOrder ?? 0,
          createdAt: (d.createdAt ?? new Date()).toISOString(),
        })),
      }

      return <HospitalDetailView hospital={data} />
    }
    ```

    **Step 4 — hospital-table.tsx에 상세 링크 추가**

    `hospital-table.tsx`에서 병원명 셀을 클릭하면 상세 페이지로 이동하도록 수정한다:

    ```typescript
    import Link from 'next/link'
    // ...
    // 기존: <td className="px-4 py-3 text-sm font-medium">{h.name}</td>
    // 변경:
    <td className="px-4 py-3 text-sm font-medium">
      <Link
        href={`/hospitals/${h.id}`}
        className="hover:underline"
        data-testid={`hospital-detail-link-${h.id}`}
      >
        {h.name}
      </Link>
    </td>
    ```
  </action>
  <verify>
    <automated>
      # 페이지 파일 존재 여부 확인
      test -f /Users/jeonminjun/claude/letmein/cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx && \
      echo "PASS: 병원 상세 페이지 존재" || echo "FAIL: 페이지 없음"
    </automated>
  </verify>
  <acceptance_criteria>
    - /hospitals/[id] 경로에 페이지가 존재한다
    - 병원 기본정보, 전문분야(칩), 의료진(테이블)을 한 페이지에 펼쳐 보여준다 (Accordion 없음)
    - 병원 목록 테이블의 병원명이 /hospitals/[id] 링크로 감싸진다
    - HospitalSpecialty 타입이 letmein.ts에 추가된다
    - 빌드 오류 없음
  </acceptance_criteria>
</task>

<task type="auto" tdd="false">
  <name>Task 2: 프리미엄 구독 부여 기능 (CMS-05)</name>
  <files>
    cms/apps/admin/src/app/(dashboard)/premium/actions.ts,
    cms/apps/admin/src/views/premium/index.tsx
  </files>
  <read_first>
    - cms/apps/admin/src/app/(dashboard)/premium/actions.ts
    - cms/apps/admin/src/views/premium/index.tsx
    - cms/apps/admin/src/views/premium/components/subscription-table.tsx
  </read_first>
  <action>
    현재 premium/actions.ts에는 `cancelSubscription`만 있다. `grantSubscription`을 추가한다.

    **Step 1 — actions.ts에 grantSubscription 추가**

    ```typescript
    'use server'

    import { prisma } from '@letmein/db'
    import { revalidatePath } from 'next/cache'

    export async function cancelSubscription(subscriptionId: number) {
      await prisma.hospitalSubscription.update({
        where: { id: BigInt(subscriptionId) },
        data: { status: 'cancelled', cancelledAt: new Date() },
      })
      revalidatePath('/premium')
    }

    export async function grantSubscription(
      hospitalId: number,
      tier: 'basic' | 'standard' | 'premium',
      expiresAt: string, // ISO date string e.g. "2026-12-31"
    ) {
      const monthlyPrice = { basic: 99000, standard: 199000, premium: 399000 }[tier]

      await prisma.$transaction(async (tx) => {
        // 기존 active 구독이 있으면 만료 처리
        await tx.hospitalSubscription.updateMany({
          where: { hospitalId: BigInt(hospitalId), status: 'active' },
          data: { status: 'expired' },
        })

        // 새 구독 생성
        await tx.hospitalSubscription.create({
          data: {
            hospitalId: BigInt(hospitalId),
            tier,
            status: 'active',
            startedAt: new Date(),
            expiresAt: new Date(expiresAt),
            monthlyPrice,
          },
        })

        // 병원 isPremium / premiumTier 업데이트
        await tx.hospital.update({
          where: { id: BigInt(hospitalId) },
          data: { isPremium: true, premiumTier: tier },
        })
      })

      revalidatePath('/premium')
    }
    ```

    **Step 2 — PremiumPage에 부여 UI 추가 (premium/index.tsx)**

    드롭다운 금지 — tier 선택은 칩 버튼으로. 부여 폼은 인라인 섹션으로 표시 (접었다 펼치는 UI 사용 금지, CLAUDE.md 규칙).

    기존 `PremiumPage` 컴포넌트에 부여 폼 섹션을 추가한다:

    ```typescript
    // 기존 import에 추가:
    import { useState } from 'react'
    import { grantSubscription } from '@/app/(dashboard)/premium/actions'

    // PremiumPage 함수 내부에 상태 추가:
    const [grantHospitalId, setGrantHospitalId] = useState('')
    const [grantTier, setGrantTier] = useState<'basic' | 'standard' | 'premium'>('basic')
    const [grantExpiresAt, setGrantExpiresAt] = useState(() => {
      const d = new Date()
      d.setFullYear(d.getFullYear() + 1)
      return d.toISOString().split('T')[0] // YYYY-MM-DD
    })
    const [isGranting, setIsGranting] = useState(false)
    const [grantError, setGrantError] = useState<string | null>(null)

    const handleGrant = async () => {
      const id = parseInt(grantHospitalId, 10)
      if (!id || isNaN(id)) { setGrantError('병원 ID를 입력하세요.'); return }
      setIsGranting(true)
      setGrantError(null)
      try {
        await grantSubscription(id, grantTier, grantExpiresAt)
        setGrantHospitalId('')
        setGrantError(null)
      } catch (e) {
        setGrantError('구독 부여에 실패했습니다.')
      } finally {
        setIsGranting(false)
      }
    }
    ```

    JSX에서 기존 `<div className="space-y-6">` 안, 헤더 아래에 부여 섹션을 삽입한다:

    ```typescript
    {/* 구독 부여 섹션 */}
    <div className="rounded-lg border p-5">
      <h3 className="mb-4 text-base font-semibold">프리미엄 구독 부여</h3>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">병원 ID</label>
          <input
            type="number"
            placeholder="예: 42"
            value={grantHospitalId}
            onChange={(e) => setGrantHospitalId(e.target.value)}
            className="h-9 w-36 rounded-md border px-3 text-sm"
            data-testid="grant-hospital-id"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">티어</label>
          <div className="flex gap-2" data-testid="grant-tier-selector">
            {(['basic', 'standard', 'premium'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setGrantTier(t)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors capitalize',
                  grantTier === t
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">만료일</label>
          <input
            type="date"
            value={grantExpiresAt}
            onChange={(e) => setGrantExpiresAt(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
            data-testid="grant-expires-at"
          />
        </div>
        <button
          onClick={handleGrant}
          disabled={isGranting}
          className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid="grant-subscription-btn"
        >
          {isGranting ? '처리 중...' : '구독 부여'}
        </button>
      </div>
      {grantError && (
        <p className="mt-2 text-sm text-red-600" role="alert">{grantError}</p>
      )}
    </div>
    ```

    주의: 기존 `cancelSubscription`, 필터, `SubscriptionTable` 코드는 그대로 유지한다.
  </action>
  <verify>
    <automated>
      # grantSubscription이 actions.ts에 존재하는지 확인
      grep -q "grantSubscription" /Users/jeonminjun/claude/letmein/cms/apps/admin/src/app/(dashboard)/premium/actions.ts && \
      echo "PASS: grantSubscription 존재" || echo "FAIL: grantSubscription 없음"
    </automated>
  </verify>
  <acceptance_criteria>
    - grantSubscription(hospitalId, tier, expiresAt) Server Action이 존재한다
    - 기존 active 구독은 expired로 업데이트 후 새 구독이 생성된다
    - hospital.isPremium = true, premiumTier = tier로 업데이트된다
    - 프리미엄 페이지에 병원ID 입력 + tier 칩 선택 + 만료일 + 부여 버튼 폼이 표시된다
    - 드롭다운 없음 (tier 선택은 칩 버튼)
    - 빌드 오류 없음
  </acceptance_criteria>
</task>

</tasks>

<verification>
1. /hospitals/[id] 경로로 접속 시 병원 기본정보·전문분야·의료진이 표시된다
2. hospital-table에서 병원명 클릭 시 상세 페이지로 이동한다
3. /premium 페이지에 "프리미엄 구독 부여" 섹션이 표시된다
4. 부여 섹션에 드롭다운이 없다 (tier는 칩 버튼)
5. grantSubscription Server Action이 HospitalSubscription을 생성한다
6. cms 빌드 오류 없음
</verification>

<success_criteria>
- 어드민이 /hospitals → 병원명 클릭 → 상세 페이지에서 정보·전문분야·의료진을 확인할 수 있다
- 어드민이 /premium → 부여 폼에 병원ID·tier·만료일 입력 → 구독 생성됨
- 코드에 드롭다운(select) UI가 사용되지 않음 (UI 규칙 준수)
</success_criteria>

<output>
완료 후 `.planning/phases/01-cms-critical/01-02-SUMMARY.md` 생성
</output>
