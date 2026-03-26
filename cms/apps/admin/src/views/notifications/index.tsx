'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import {
  Send,
  Mail,
  ListOrdered,
  History,
  Webhook,
  BarChart3,
} from 'lucide-react'
import { SendNotification } from './components/send-notification'
import { EmailTemplates } from './components/email-templates'
import { NotificationQueue } from './components/notification-queue'
import { NotificationLogs } from './components/notification-logs'
import { WebhookSettings } from './components/webhook-settings'
import { NotificationStats } from './components/notification-stats'

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="send">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="send" className="gap-1.5">
            <Send className="h-4 w-4" />
            수동발송
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Mail className="h-4 w-4" />
            이메일 템플릿
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5">
            <ListOrdered className="h-4 w-4" />
            발송 큐
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History className="h-4 w-4" />
            발송 이력
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5">
            <Webhook className="h-4 w-4" />
            웹훅
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            통계
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <div className="rounded-lg border bg-card p-6">
            <SendNotification />
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="rounded-lg border bg-card p-6">
            <EmailTemplates />
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <div className="rounded-lg border bg-card p-6">
            <NotificationQueue />
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="rounded-lg border bg-card p-6">
            <NotificationLogs />
          </div>
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="rounded-lg border bg-card p-6">
            <WebhookSettings />
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-4">
            <NotificationStats />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
