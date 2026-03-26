'use client'

import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'

interface LineChartSeries {
  dataKey: string
  name: string
  color: string
  strokeDasharray?: string
}

interface LineChartProps {
  title?: string
  data: Record<string, string | number>[]
  xDataKey?: string
  series: LineChartSeries[]
  height?: number
  className?: string
}

export function LineChart({
  title,
  data,
  xDataKey = 'date',
  series,
  height = 300,
  className,
}: LineChartProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xDataKey}
              className="text-xs"
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) => {
                if (value.length === 10) {
                  const parts = value.split('-')
                  return `${parts[1]}/${parts[2]}`
                }
                return value
              }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 11 }} width={40} />
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
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
