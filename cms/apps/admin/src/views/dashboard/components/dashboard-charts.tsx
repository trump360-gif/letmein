'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { useDashboardChart } from '@/features/dashboard/queries'

const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = mod
    function WrappedLineChart({ data, lines }: { data: unknown[]; lines: { dataKey: string; name: string; stroke: string }[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(v) => {
                const d = new Date(v)
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }
    return WrappedLineChart
  }),
  { ssr: false, loading: () => <ChartLoading /> },
)

const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
    function WrappedBarChart({ data }: { data: unknown[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
            <Tooltip />
            <Bar dataKey="postCount" name="게시물 수" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }
    return WrappedBarChart
  }),
  { ssr: false, loading: () => <ChartLoading /> },
)

function ChartLoading() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <p className="text-sm text-muted-foreground">차트 로딩 중...</p>
    </div>
  )
}

const PERIOD_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
] as const

export function DashboardCharts() {
  const [days, setDays] = useState(7)
  const { data, isLoading } = useDashboardChart(days)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDays(opt.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              days === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">신규 가입 추이</TabsTrigger>
          <TabsTrigger value="content">게시물/댓글 추이</TabsTrigger>
          <TabsTrigger value="boards">게시판별 활성도</TabsTrigger>
          <TabsTrigger value="ai">AI 생성 추이</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">신규 가입 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartLoading /> : (
                <LazyLineChart
                  data={data?.daily ?? []}
                  lines={[
                    { dataKey: 'newUsers', name: '신규 가입', stroke: 'hsl(var(--primary))' },
                    { dataKey: 'activeUsers', name: '활성 사용자', stroke: 'hsl(var(--chart-2, 160 60% 45%))' },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">게시물/댓글 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartLoading /> : (
                <LazyLineChart
                  data={data?.daily ?? []}
                  lines={[
                    { dataKey: 'newPosts', name: '게시물', stroke: 'hsl(var(--primary))' },
                    { dataKey: 'newComments', name: '댓글', stroke: 'hsl(var(--chart-3, 30 80% 55%))' },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boards">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">게시판별 활성도 (상위 10개)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartLoading /> : (
                <LazyBarChart data={data?.boardActivity ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI 자동 생성 추이</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <ChartLoading /> : (
                <LazyLineChart
                  data={data?.aiDaily ?? []}
                  lines={[
                    { dataKey: 'success', name: '성공', stroke: 'hsl(142 76% 36%)' },
                    { dataKey: 'failed', name: '실패/스킵', stroke: 'hsl(0 84% 60%)' },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
