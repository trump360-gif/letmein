'use client'

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'

interface BarChartSeries {
  dataKey: string
  name: string
  color: string
  stackId?: string
}

interface BarChartProps {
  title?: string
  data: Record<string, string | number>[]
  xDataKey?: string
  series: BarChartSeries[]
  height?: number
  className?: string
  layout?: 'horizontal' | 'vertical'
  colors?: string[]
}

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
]

export function BarChart({
  title,
  data,
  xDataKey = 'date',
  series,
  height = 300,
  className,
  layout = 'horizontal',
  colors,
}: BarChartProps) {
  const useCustomColors = colors && colors.length > 0 && series.length === 1

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout={layout === 'vertical' ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            {layout === 'vertical' ? (
              <>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey={xDataKey} type="category" tick={{ fontSize: 11 }} width={80} />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xDataKey}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) => {
                    if (value.length === 10) {
                      const parts = value.split('-')
                      return `${parts[1]}/${parts[2]}`
                    }
                    return value
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} width={40} />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                stackId={s.stackId}
                radius={[2, 2, 0, 0]}
              >
                {useCustomColors &&
                  data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
