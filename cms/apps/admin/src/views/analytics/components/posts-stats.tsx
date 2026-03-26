'use client'

import { usePostStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { LineChart } from '@/widgets/chart/line-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { FileText, MessageSquare, Eye } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface PostsStatsProps {
  params: StatsRequestParams
}

export function PostsStats({ params }: PostsStatsProps) {
  const { data, isLoading } = usePostStats(params)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="전체 게시물"
          value={data.totalPosts}
          icon={FileText}
        />
        <StatsCard
          title="기간 내 게시물"
          value={data.periodNewPosts}
          icon={FileText}
          change={data.periodNewPostChange}
          changeLabel="전 기간 대비"
        />
        <StatsCard
          title="일 평균 게시물"
          value={data.dailyPosts.length > 0
            ? Math.round(data.dailyPosts.reduce((s, d) => s + d.value, 0) / data.dailyPosts.length)
            : 0
          }
          icon={MessageSquare}
        />
      </div>

      <LineChart
        title="일별 게시물 / 댓글 추이"
        data={data.dailyPosts.map((d, i) => ({
          date: d.date,
          posts: d.value,
          comments: data.dailyComments[i]?.value ?? 0,
        }))}
        series={[
          { dataKey: 'posts', name: '게시물', color: '#6366f1' },
          { dataKey: 'comments', name: '댓글', color: '#10b981' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">TOP 10 게시물 (조회수)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.boardName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              ))}
              {data.topPosts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  해당 기간에 게시물이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">게시판별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topBoards.map((board, index) => (
                <div
                  key={board.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-medium">{board.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{board.postCount}건</span>
                    <span>{board.commentCount}댓글</span>
                    <span>{board.viewCount.toLocaleString()}조회</span>
                  </div>
                </div>
              ))}
              {data.topBoards.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  해당 기간에 게시물이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
