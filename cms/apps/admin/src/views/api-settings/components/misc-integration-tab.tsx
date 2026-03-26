'use client'

import type { ApiKeyConfig } from '@letmein/types'
import { ServiceCard } from './service-card'

interface MiscIntegrationTabProps {
  services: ApiKeyConfig[]
}

export function MiscIntegrationTab({ services }: MiscIntegrationTabProps) {
  const miscServices = services.filter((s) => s.category === 'misc')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">기타 연동</h3>
        <p className="text-sm text-muted-foreground">
          분석, 검색엔진, 보안, 알림 웹훅 등 기타 외부 서비스를 연동합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {miscServices.map((config) => (
          <ServiceCard key={config.service} config={config} />
        ))}
      </div>
    </div>
  )
}
