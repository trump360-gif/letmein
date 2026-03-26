import Link from 'next/link'
import { HeartHandshake, Building2, Star, BadgeCheck, Crown } from 'lucide-react'
import { Card, CardContent } from '@letmein/ui'

interface LetMeInStatsProps {
  pendingConsultations: number
  pendingHospitals: number
  pendingCastMembers: number
  pendingAdCreatives: number
  activeSubscriptions: number
}

interface StatCardProps {
  title: string
  value: number
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: 'warning' | 'info'
}

function StatCard({ title, value, href, icon: Icon, badge }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${value > 0 && badge === 'warning' ? 'text-amber-600' : ''}`}
            data-testid={`letmein-stat-${title}`}
          >
            {value.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function LetMeInStats({
  pendingConsultations,
  pendingHospitals,
  pendingCastMembers,
  pendingAdCreatives,
  activeSubscriptions,
}: LetMeInStatsProps) {
  return (
    <div data-testid="letmein-stats">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
        LetMeIn 현황
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="대기 상담 요청"
          value={pendingConsultations}
          href="/coordinator"
          icon={HeartHandshake}
          badge="warning"
        />
        <StatCard
          title="승인 대기 병원"
          value={pendingHospitals}
          href="/hospitals?status=pending"
          icon={Building2}
          badge="warning"
        />
        <StatCard
          title="인증 대기 출연자"
          value={pendingCastMembers}
          href="/cast-members?status=pending"
          icon={Star}
          badge="warning"
        />
        <StatCard
          title="심사 대기 광고"
          value={pendingAdCreatives}
          href="/ads?reviewStatus=pending"
          icon={BadgeCheck}
          badge="warning"
        />
        <StatCard
          title="활성 프리미엄 구독"
          value={activeSubscriptions}
          href="/premium?status=active"
          icon={Crown}
          badge="info"
        />
      </div>
    </div>
  )
}
