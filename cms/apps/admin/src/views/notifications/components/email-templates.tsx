'use client'

import { useState } from 'react'
import { Button, Badge } from '@letmein/ui'
import { Pencil, Loader2 } from 'lucide-react'
import { useEmailTemplates } from '@/features/notification-send'
import type { EmailTemplate } from '@letmein/types'
import { TemplateEditor } from './template-editor'

export function EmailTemplates() {
  const { data: templates, isLoading } = useEmailTemplates()
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">템플릿 로딩 중...</span>
      </div>
    )
  }

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        이메일 템플릿을 관리합니다. HTML 편집 및 변수 치환을 지원합니다.
      </p>

      {!templates || templates.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">등록된 이메일 템플릿이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="outline">{template.type}</Badge>
                  {template.isSystem && <Badge variant="secondary">시스템</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">제목: {template.subject}</p>
                <p className="text-xs text-muted-foreground">
                  수정일: {new Date(template.updatedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTemplate(template)}
              >
                <Pencil className="mr-1 h-4 w-4" />
                편집
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
