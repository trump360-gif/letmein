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
