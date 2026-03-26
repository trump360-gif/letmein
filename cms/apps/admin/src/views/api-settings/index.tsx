'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { Loader2 } from 'lucide-react'
import { useApiKeys } from '@/features/api-integration'
import { SocialLoginTab } from './components/social-login-tab'
import { NotificationApiTab } from './components/notification-api-tab'
import { PaymentTab } from './components/payment-tab'
import { MiscIntegrationTab } from './components/misc-integration-tab'

export function ApiSettingsPage() {
  const { data, isLoading, isError } = useApiKeys()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>API 키 설정을 불러오는데 실패했습니다.</p>
        <p className="text-sm">페이지를 새로고침 해주세요.</p>
      </div>
    )
  }

  const services = data.services

  return (
    <div className="space-y-6">
      <Tabs defaultValue="social">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="social">소셜 로그인</TabsTrigger>
          <TabsTrigger value="notification">알림 API</TabsTrigger>
          <TabsTrigger value="payment">결제/본인인증</TabsTrigger>
          <TabsTrigger value="misc">기타 연동</TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <SocialLoginTab services={services} />
        </TabsContent>

        <TabsContent value="notification">
          <NotificationApiTab services={services} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentTab services={services} />
        </TabsContent>

        <TabsContent value="misc">
          <MiscIntegrationTab services={services} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
