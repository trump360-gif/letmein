'use client'

import Link from 'next/link'
import { Bell, ShieldBan, Building2, Star } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@letmein/ui'

const actions = [
  {
    label: '병원 승인',
    href: '/hospitals',
    icon: Building2,
  },
  {
    label: '출연자 관리',
    href: '/cast-members',
    icon: Star,
  },
  {
    label: '공지 발송',
    href: '/operations/notifications?action=create',
    icon: Bell,
  },
  {
    label: '금칙어 관리',
    href: '/members/banned-words',
    icon: ShieldBan,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">빠른 액션</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
