'use client'

import type { ApiKeyConfig } from '@letmein/types'
import { ServiceCard } from './service-card'

interface SocialLoginTabProps {
  services: ApiKeyConfig[]
}

export function SocialLoginTab({ services }: SocialLoginTabProps) {
  const socialServices = services.filter((s) => s.category === 'social')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">소셜 로그인</h3>
        <p className="text-sm text-muted-foreground">
          외부 소셜 계정으로 로그인할 수 있도록 OAuth 연동을 설정합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {socialServices.map((config) => (
          <ServiceCard key={config.service} config={config} />
        ))}
      </div>
    </div>
  )
}
