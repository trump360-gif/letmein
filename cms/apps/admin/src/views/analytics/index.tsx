'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { CalendarDays } from 'lucide-react'
import { useStatsSummary } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { UsersStats } from './components/users-stats'
import { PostsStats } from './components/posts-stats'
import { ReportsStats } from './components/reports-stats'
import { NotificationStats } from './components/notification-stats'
import { ExportDialog } from './components/export-dialog'
import type { StatsPeriod, StatsRequestParams } from '@letmein/types'
import { Users, FileText, Flag } from 'lucide-react'

function calcChange(today: number, yesterday: number): number {
  if (yesterday === 0) return 0
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [activeTab, setActiveTab] = useState('users')

  const { data: summary, isLoading: summaryLoading } = useStatsSummary()

  const params: StatsRequestParams = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) {
      return { period, from: customFrom, to: customTo }
    }
    return { period }
  }, [period, customFrom, customTo])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <ExportDialog params={params} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="오늘 신규 가입"
          value={summary?.todayNewUsers ?? 0}
          icon={Users}
          change={summary ? calcChange(summary.todayNewUsers, summary.yesterdayNewUsers) : undefined}
          changeLabel="전일 대비"
          loading={summaryLoading}
        />
        <StatsCard
          title="오늘 게시물"
          value={summary?.todayNewPosts ?? 0}
          icon={FileText}
          change={summary ? calcChange(summary.todayNewPosts, summary.yesterdayNewPosts) : undefined}
          changeLabel="전일 대비"
          loading={summaryLoading}
        />
        <StatsCard
          title="오늘 댓글"
          value={summary?.todayNewComments ?? 0}
          icon={FileText}
          change={summary ? calcChange(summary.todayNewComments, summary.yesterdayNewComments) : undefined}
          changeLabel="전일 대비"
          loading={summaryLoading}
        />
        <StatsCard
          title="미처리 신고"
          value={summary?.pendingReports ?? 0}
          icon={Flag}
          change={summary ? calcChange(summary.todayNewReports, summary.yesterdayNewReports) : undefined}
          changeLabel="전일 대비"
          loading={summaryLoading}
        />
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border bg-muted p-1">
          {(['7d', '30d', '90d'] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === '7d' && '7일'}
              {p === '30d' && '30일'}
              {p === '90d' && '90일'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPeriod('custom')}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              period === 'custom'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            직접 설정
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            />
            <span className="text-muted-foreground">~</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">회원</TabsTrigger>
          <TabsTrigger value="posts">게시물</TabsTrigger>
          <TabsTrigger value="reports">신고/제재</TabsTrigger>
          <TabsTrigger value="notifications">알림</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersStats params={params} />
        </TabsContent>
        <TabsContent value="posts">
          <PostsStats params={params} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsStats params={params} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationStats params={params} />
        </TabsContent>
      </Tabs>

      {/* GA4 Guide */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
        <h3 className="text-sm font-medium">GA4 연동 안내</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          페이지뷰, 이벤트 추적, 실시간 사용자 등 고급 웹 애널리틱스는 Google Analytics 4를 연동하여 확인하세요.
          사이트 설정 &gt; 외부 서비스에서 GA4 측정 ID(G-XXXXXXX)를 입력하면 자동으로 연동됩니다.
        </p>
      </div>
    </div>
  )
}
