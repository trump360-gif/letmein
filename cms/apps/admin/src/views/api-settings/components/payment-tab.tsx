'use client'

import type { ApiKeyConfig } from '@letmein/types'
import { ServiceCard } from './service-card'

interface PaymentTabProps {
  services: ApiKeyConfig[]
}

export function PaymentTab({ services }: PaymentTabProps) {
  const paymentServices = services.filter((s) => s.category === 'payment')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">결제 / 본인인증</h3>
        <p className="text-sm text-muted-foreground">
          결제 게이트웨이 및 본인인증 서비스를 연동합니다.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {paymentServices.map((config) => (
          <ServiceCard key={config.service} config={config} />
        ))}
      </div>
    </div>
  )
}
