'use client'

import { Users, FileText, AlertTriangle, UserPlus, Bot } from 'lucide-react'
import { useDashboardStats } from '@/features/dashboard'
import { StatsCard } from '@/widgets/stats-card'

export function StatCards() {
  const { data, isLoading } = useDashboardStats()

  const cards = [
    {
      title: '총 회원수',
      value: data?.totalUsers ?? 0,
      icon: Users,
      change: null,
      changeLabel: undefined,
    },
    {
      title: '오늘 신규 가입',
      value: data?.todayNewUsers ?? 0,
      icon: UserPlus,
      change: data?.changes.newUsers ?? null,
      changeLabel: '어제 대비',
    },
    {
      title: '오늘 게시물',
      value: data?.todayNewPosts ?? 0,
      icon: FileText,
      change: data?.changes.newPosts ?? null,
      changeLabel: '어제 대비',
    },
    {
      title: '미처리 신고',
      value: data?.pendingReports ?? 0,
      icon: AlertTriangle,
      change: null,
      changeLabel: undefined,
    },
    {
      title: '오늘 AI 생성',
      value: data?.aiStats?.todaySuccess ?? 0,
      icon: Bot,
      change: null,
      changeLabel: data?.aiStats?.todayFailed
        ? `실패/스킵 ${data.aiStats.todayFailed}건`
        : undefined,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <StatsCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          change={card.change}
          changeLabel={card.changeLabel}
          loading={isLoading}
        />
      ))}
    </div>
  )
}
