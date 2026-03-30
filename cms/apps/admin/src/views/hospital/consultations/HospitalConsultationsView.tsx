'use client'

import { useState } from 'react'
import {
  useConsultationsQuery,
  useRespondToConsultationMutation,
  type ConsultationItem,
  type ConsultationStatus,
} from '@/features/hospital-portal/consultations'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function CharCounter({ current, max }: { current: number; max: number }) {
  return (
    <span
      className={`text-xs tabular-nums ${
        current > max ? 'text-red-500' : 'text-muted-foreground'
      }`}
    >
      {current} / {max}
    </span>
  )
}

function ResponseForm({
  consultation,
  onSuccess,
}: {
  consultation: ConsultationItem
  onSuccess: () => void
}) {
  const [intro, setIntro] = useState('')
  const [experience, setExperience] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useRespondToConsultationMutation()

  const isValid = message.length >= 10 && message.length <= 3000 &&
    intro.length <= 60 && experience.length <= 60

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await mutation.mutateAsync({
        requestId: consultation.requestId,
        data: {
          intro: intro.trim() || undefined,
          experience: experience.trim() || undefined,
          message,
        },
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '응답 발송에 실패했습니다')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">응답 작성</h3>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            소개 <span className="text-muted-foreground/60">(선택)</span>
          </label>
          <CharCounter current={intro.length} max={60} />
        </div>
        <input
          type="text"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          maxLength={60}
          placeholder="병원 소개를 간략히 입력해주세요"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            경험 <span className="text-muted-foreground/60">(선택)</span>
          </label>
          <CharCounter current={experience.length} max={60} />
        </div>
        <input
          type="text"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          maxLength={60}
          placeholder="관련 시술 경험을 간략히 입력해주세요"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            메시지 <span className="text-red-500">*</span>
          </label>
          <CharCounter current={message.length} max={3000} />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={3000}
          rows={5}
          placeholder="환자에게 전달할 상세 메시지를 입력해주세요 (최소 10자)"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        {message.length > 0 && message.length < 10 && (
          <p className="text-xs text-red-500">메시지는 최소 10자 이상 입력해주세요</p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={!isValid || mutation.isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {mutation.isPending ? '발송 중...' : '응답 발송'}
      </button>
    </form>
  )
}

function DetailPanel({
  consultation,
}: {
  consultation: ConsultationItem | null
}) {
  const [responded, setResponded] = useState(false)

  if (!consultation) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        목록에서 상담 요청을 선택하세요
      </div>
    )
  }

  const isResponded = consultation.status === 'responded' || responded

  return (
    <div className="space-y-6 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
              {consultation.category.name}
            </span>
            {isResponded ? (
              <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                응답완료
              </span>
            ) : (
              <span className="rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium">
                대기
              </span>
            )}
            {consultation.photoPublic && (
              <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                사진 공개
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            접수일: {formatDate(consultation.createdAt)}
          </p>
        </div>
      </div>

      {/* 부위 상세 */}
      {consultation.details.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">시술 부위</p>
          <div className="flex flex-wrap gap-1.5">
            {consultation.details.map((d) => (
              <span
                key={d.id}
                className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 시기 */}
      {consultation.preferredPeriod && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">희망 시기</p>
          <p className="text-sm">{consultation.preferredPeriod}</p>
        </div>
      )}

      {/* 상담 내용 */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">상담 내용</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {consultation.description}
        </p>
      </div>

      {/* 코디네이터 메모 */}
      {consultation.coordinatorNote && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
          <p className="text-xs font-medium text-yellow-700">코디네이터 메모</p>
          <p className="text-sm text-yellow-900">{consultation.coordinatorNote}</p>
        </div>
      )}

      <div className="border-t border-border" />

      {/* 응답 폼 또는 완료 안내 */}
      {isResponded ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 space-y-1">
          <p className="text-sm font-medium text-green-800">이미 응답을 발송했습니다</p>
          {consultation.response?.created_at && (
            <p className="text-xs text-green-700">
              응답일시: {formatDate(consultation.response.created_at)}
            </p>
          )}
        </div>
      ) : (
        <ResponseForm
          consultation={consultation}
          onSuccess={() => setResponded(true)}
        />
      )}
    </div>
  )
}

const TAB_OPTIONS: { label: string; value: ConsultationStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '대기', value: 'pending' },
  { label: '응답완료', value: 'responded' },
]

export default function HospitalConsultationsView() {
  const [activeTab, setActiveTab] = useState<ConsultationStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, isError } = useConsultationsQuery(activeTab)
  const consultations = data?.consultations ?? []
  const selected = consultations.find((c) => c.requestId === selectedId) ?? null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">상담 요청</h1>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveTab(tab.value)
              setSelectedId(null)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 본문: 좌우 분할 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* 좌측: 목록 */}
        <div className="w-full md:w-80 shrink-0 space-y-2">
          {isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              불러오는 중...
            </p>
          )}
          {isError && (
            <p className="py-6 text-center text-sm text-red-500">
              목록을 불러오지 못했습니다
            </p>
          )}
          {!isLoading && !isError && consultations.length === 0 && (
            <p className="rounded-lg border bg-card py-8 text-center text-sm text-muted-foreground">
              {activeTab === 'pending'
                ? '대기 중인 상담 요청이 없습니다'
                : activeTab === 'responded'
                  ? '응답 완료된 상담 요청이 없습니다'
                  : '상담 요청이 없습니다'}
            </p>
          )}
          {consultations.map((c) => (
            <button
              key={c.requestId}
              type="button"
              onClick={() => setSelectedId(c.requestId)}
              className={`w-full rounded-lg border p-4 text-left space-y-2 transition-colors hover:bg-muted/50 ${
                selectedId === c.requestId
                  ? 'border-primary bg-primary/5'
                  : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                  {c.category.name}
                </span>
                {c.status === 'responded' ? (
                  <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                    응답완료
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-medium">
                    대기
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-1">
                {c.description}
              </p>
            </button>
          ))}
        </div>

        {/* 우측: 상세 + 응답 폼 */}
        <div className="flex-1 rounded-lg border bg-card p-5 min-h-[400px]">
          <DetailPanel key={selectedId} consultation={selected} />
        </div>
      </div>
    </div>
  )
}
