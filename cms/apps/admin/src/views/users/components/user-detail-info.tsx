'use client'

import { format } from 'date-fns'
import { Mail, Phone, Calendar, Shield, Star, Coins, Clock, AlertTriangle } from 'lucide-react'
import { USER_STATUS, USER_GRADES } from '@/shared/lib/constants'
import type { UserDetail } from '@letmein/types'

interface UserDetailInfoProps {
  user: UserDetail
}

function InfoRow({ icon: Icon, label, value, className }: { icon: typeof Mail; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${className || ''}`}>{value}</p>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600',
  dormant: 'text-yellow-600',
  suspended: 'text-red-600',
  withdrawn: 'text-gray-400',
}

export function UserDetailInfo({ user }: UserDetailInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          기본 정보
        </h3>
        <InfoRow icon={Mail} label="이메일" value={user.email || '미등록'} />
        <InfoRow icon={Phone} label="전화번호" value={user.phone || '미등록'} />
        <InfoRow
          icon={Calendar}
          label="가입일"
          value={format(new Date(user.createdAt), 'yyyy.MM.dd HH:mm')}
        />
        <InfoRow
          icon={Clock}
          label="최근 로그인"
          value={user.lastLoginAt ? format(new Date(user.lastLoginAt), 'yyyy.MM.dd HH:mm') : '없음'}
        />
        <InfoRow
          icon={Shield}
          label="소셜 로그인"
          value={user.socialProvider || '일반 가입'}
        />
      </div>

      {/* Grade & Points */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          등급 / 포인트 / 상태
        </h3>
        <InfoRow
          icon={Star}
          label="등급"
          value={USER_GRADES[user.grade] || `Lv.${user.grade}`}
          className="text-primary"
        />
        <InfoRow
          icon={Coins}
          label="포인트"
          value={`${user.points.toLocaleString()} P`}
        />
        <InfoRow
          icon={Shield}
          label="상태"
          value={USER_STATUS[user.status as keyof typeof USER_STATUS] || user.status}
          className={STATUS_COLORS[user.status]}
        />
        {user.status === 'suspended' && user.suspendedUntil && (
          <InfoRow
            icon={AlertTriangle}
            label="정지 해제일"
            value={format(new Date(user.suspendedUntil), 'yyyy.MM.dd HH:mm')}
            className="text-red-600"
          />
        )}
        {user.suspensionReason && (
          <InfoRow
            icon={AlertTriangle}
            label="정지 사유"
            value={user.suspensionReason}
            className="text-red-600"
          />
        )}
      </div>

      {/* Activity Stats */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          활동 통계
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{user.postCount}</p>
            <p className="text-xs text-muted-foreground">게시글</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{user.commentCount}</p>
            <p className="text-xs text-muted-foreground">댓글</p>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          인증 현황
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">이메일 인증</span>
            <span className={`text-sm font-medium ${user.emailVerifiedAt ? 'text-green-600' : 'text-gray-400'}`}>
              {user.emailVerifiedAt ? format(new Date(user.emailVerifiedAt), 'yyyy.MM.dd') : '미인증'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">전화번호 인증</span>
            <span className={`text-sm font-medium ${user.phoneVerifiedAt ? 'text-green-600' : 'text-gray-400'}`}>
              {user.phoneVerifiedAt ? format(new Date(user.phoneVerifiedAt), 'yyyy.MM.dd') : '미인증'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">본인 인증</span>
            <span className={`text-sm font-medium ${user.identityVerifiedAt ? 'text-green-600' : 'text-gray-400'}`}>
              {user.identityVerifiedAt ? format(new Date(user.identityVerifiedAt), 'yyyy.MM.dd') : '미인증'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
