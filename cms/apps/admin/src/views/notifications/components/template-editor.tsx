'use client'

import { useState } from 'react'
import { Button, Input, Label, Textarea, Badge } from '@letmein/ui'
import { ArrowLeft, Save, Eye, EyeOff, SendHorizontal, Loader2 } from 'lucide-react'
import { useUpdateEmailTemplate, useSendTestEmail } from '@/features/notification-send'
import { TEMPLATE_VARIABLES, type EmailTemplate } from '@letmein/types'

interface TemplateEditorProps {
  template: EmailTemplate
  onClose: () => void
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const [subject, setSubject] = useState(template.subject)
  const [htmlBody, setHtmlBody] = useState(template.htmlBody)
  const [textBody, setTextBody] = useState(template.textBody || '')
  const [showPreview, setShowPreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  const updateMutation = useUpdateEmailTemplate()
  const testMutation = useSendTestEmail()

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      type: template.type,
      payload: { subject, htmlBody, textBody: textBody || undefined },
    })
  }

  const handleTestSend = async () => {
    if (!testEmail) return
    await testMutation.mutateAsync({ type: template.type, email: testEmail })
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('htmlBody') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = htmlBody.substring(0, start) + variable + htmlBody.substring(end)
    setHtmlBody(newValue)

    // Restore cursor position after variable
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    })
  }

  // Preview: replace variables with sample data
  const getPreviewHtml = () => {
    let preview = htmlBody
    preview = preview.replace(/\{\{이름\}\}/g, '홍길동')
    preview = preview.replace(/\{\{닉네임\}\}/g, 'testuser')
    preview = preview.replace(/\{\{등급\}\}/g, 'VIP')
    preview = preview.replace(/\{\{포인트\}\}/g, '10,000')
    preview = preview.replace(/\{\{링크\}\}/g, 'https://example.com')
    preview = preview.replace(/\{\{날짜\}\}/g, new Date().toLocaleDateString('ko-KR'))
    preview = preview.replace(/\{\{사이트명\}\}/g, 'CMS Admin')
    return preview
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록
          </Button>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <Badge variant="outline">{template.type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="mr-1 h-4 w-4" />
            ) : (
              <Eye className="mr-1 h-4 w-4" />
            )}
            {showPreview ? '편집' : '미리보기'}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            저장
          </Button>
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          템플릿이 저장되었습니다.
        </div>
      )}

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">이메일 제목</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="이메일 제목"
        />
      </div>

      {/* Variable Buttons */}
      <div className="space-y-2">
        <Label>변수 삽입</Label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="rounded-md border border-dashed border-primary/50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
              title={v.description}
            >
              {v.key}
            </button>
          ))}
        </div>
      </div>

      {/* HTML Body or Preview */}
      {showPreview ? (
        <div className="space-y-2">
          <Label>미리보기</Label>
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              제목: {subject.replace(/\{\{이름\}\}/g, '홍길동').replace(/\{\{사이트명\}\}/g, 'CMS Admin')}
            </p>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="htmlBody">HTML 본문</Label>
          <Textarea
            id="htmlBody"
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={15}
            className="font-mono text-sm"
            placeholder="<html>...</html>"
          />
        </div>
      )}

      {/* Text Body */}
      <div className="space-y-2">
        <Label htmlFor="textBody">텍스트 본문 (선택)</Label>
        <Textarea
          id="textBody"
          value={textBody}
          onChange={(e) => setTextBody(e.target.value)}
          rows={4}
          placeholder="HTML을 지원하지 않는 클라이언트용 텍스트"
        />
      </div>

      {/* Test Send */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <Label className="font-semibold">테스트 발송</Label>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSend}
            disabled={testMutation.isPending || !testEmail}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="mr-1 h-4 w-4" />
            )}
            테스트 발송
          </Button>
        </div>
        {testMutation.isSuccess && (
          <p className="text-sm text-green-600">테스트 이메일 발송이 예약되었습니다.</p>
        )}
        {testMutation.isError && (
          <p className="text-sm text-destructive">테스트 발송에 실패했습니다.</p>
        )}
      </div>
    </div>
  )
}
