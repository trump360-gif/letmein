'use client'

import type { ApiKeyConfig } from '@letmein/types'
import { ServiceCard } from './service-card'

interface NotificationApiTabProps {
  services: ApiKeyConfig[]
}

export function NotificationApiTab({ services }: NotificationApiTabProps) {
  const notificationServices = services.filter((s) => s.category === 'notification')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">알림 API</h3>
        <p className="text-sm text-muted-foreground">
          카카오 알림톡, SMS, 이메일 등 알림 발송을 위한 외부 API를 설정합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {notificationServices.map((config) => (
          <ServiceCard key={config.service} config={config} />
        ))}
      </div>
    </div>
  )
}
