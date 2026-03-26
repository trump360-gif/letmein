'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@letmein/ui'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  FileText,
  FolderOpen,
  Trash2,
} from 'lucide-react'
import { useBannerGroups } from '@/features/banner-editor'
import {
  useBannerDraftStore,
  useBannerTemplateStore,
  type BannerFormData,
} from '@/features/banner-editor/store'
import type { BannerCreateInput } from '@letmein/types'
import { bannerSchema, DEFAULT_VALUES, STEPS, type BannerFormValues } from './banner-wizard-types'
import { StepBasicInfo, StepContent, StepLinkUtm, StepScheduleTarget, StepAbTest } from './wizard-steps'

// ==================== Props ====================

interface BannerWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (values: any) => Promise<void>
  isPending: boolean
}

// ==================== Component ====================

export function BannerWizardModal({ open, onOpenChange, onSubmit, isPending }: BannerWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showDrafts, setShowDrafts] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')

  const { data: groupsData } = useBannerGroups()
  const draftStore = useBannerDraftStore()
  const templateStore = useBannerTemplateStore()

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const watchLinkUrl = form.watch('linkUrl')
  const watchUtmCampaign = form.watch('utmCampaign')

  const utmPreview = useMemo(() => {
    if (!watchLinkUrl || !watchUtmCampaign) return ''
    const sep = watchLinkUrl.includes('?') ? '&' : '?'
    return `${watchLinkUrl}${sep}utm_source=admin&utm_medium=banner&utm_campaign=${watchUtmCampaign}`
  }, [watchLinkUrl, watchUtmCampaign])

  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setShowDrafts(false)
      setShowTemplates(false)
      setShowSaveTemplate(false)
    }
  }, [open])

  const handleSaveDraft = useCallback(() => {
    const values = form.getValues()
    draftStore.saveDraft(values as BannerFormData, currentStep)
  }, [form, currentStep, draftStore])

  const handleLoadDraft = useCallback(
    (draftId: string) => {
      const draft = draftStore.loadDraft(draftId)
      if (draft) {
        draftStore.setActiveDraft(draftId)
        form.reset({ ...DEFAULT_VALUES, ...draft.data } as BannerFormValues)
        setCurrentStep(draft.currentStep)
        setShowDrafts(false)
      }
    },
    [draftStore, form],
  )

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const template = templateStore.templates.find((t) => t.id === templateId)
      if (template) {
        form.reset({ ...DEFAULT_VALUES, ...template.data } as BannerFormValues)
        setCurrentStep(0)
        setShowTemplates(false)
      }
    },
    [templateStore, form],
  )

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return
    const values = form.getValues()
    templateStore.saveTemplate(templateName.trim(), templateDesc.trim(), values as BannerCreateInput)
    setTemplateName('')
    setTemplateDesc('')
    setShowSaveTemplate(false)
  }, [form, templateName, templateDesc, templateStore])

  const canProceed = useCallback(() => {
    if (currentStep === 0) {
      const name = form.getValues('name')
      return !!name?.trim()
    }
    return true
  }, [currentStep, form])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) setCurrentStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const handleFinalSubmit = async () => {
    const valid = await form.trigger()
    if (!valid) {
      const errors = form.formState.errors
      if (errors.name || errors.position || errors.type || errors.groupId || errors.sortOrder || errors.isActive) {
        setCurrentStep(0)
      } else if (errors.pcImageId || errors.mobileImageId || errors.tabletImageId || errors.altText || errors.textContent || errors.bgColor || errors.textColor) {
        setCurrentStep(1)
      } else if (errors.linkUrl || errors.openNewTab || errors.utmCampaign) {
        setCurrentStep(2)
      }
      return
    }
    const values = form.getValues()
    await onSubmit(values)
    if (draftStore.activeDraftId) draftStore.deleteDraft(draftStore.activeDraftId)
    form.reset(DEFAULT_VALUES)
    setCurrentStep(0)
  }

  const handleClose = (value: boolean) => {
    if (!value) {
      const name = form.getValues('name')
      if (name?.trim()) handleSaveDraft()
      draftStore.setActiveDraft(null)
    }
    onOpenChange(value)
  }

  const groups = groupsData?.groups ?? []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>배너 추가</DialogTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm"
                onClick={() => { setShowDrafts(!showDrafts); setShowTemplates(false); setShowSaveTemplate(false) }}>
                <FileText className="mr-1 h-3 w-3" />
                임시저장 ({draftStore.drafts.length})
              </Button>
              <Button type="button" variant="outline" size="sm"
                onClick={() => { setShowTemplates(!showTemplates); setShowDrafts(false); setShowSaveTemplate(false) }}>
                <FolderOpen className="mr-1 h-3 w-3" />
                템플릿
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Draft List */}
        {showDrafts && (
          <ListPanel
            title="임시저장 목록"
            items={draftStore.drafts}
            emptyText="저장된 임시저장이 없습니다."
            onAction={() => handleSaveDraft()}
            actionLabel="현재 상태 저장"
            renderItem={(draft) => (
              <span className="font-medium">{(draft.data as BannerFormValues).name || '(이름 없음)'}
                <span className="ml-2 text-xs text-muted-foreground">
                  Step {draft.currentStep + 1} - {new Date(draft.savedAt).toLocaleString('ko-KR')}
                </span>
              </span>
            )}
            onItemClick={(draft) => handleLoadDraft(draft.id)}
            onItemDelete={(draft) => draftStore.deleteDraft(draft.id)}
          />
        )}

        {/* Template List */}
        {showTemplates && (
          <ListPanel
            title="템플릿 목록"
            items={templateStore.templates}
            emptyText="저장된 템플릿이 없습니다."
            onAction={() => { setShowSaveTemplate(!showSaveTemplate); setShowTemplates(false) }}
            actionLabel="현재 상태를 템플릿으로 저장"
            actionVariant="outline"
            renderItem={(tpl) => (
              <>
                <span className="font-medium">{tpl.name}</span>
                {tpl.description && <span className="ml-2 text-xs text-muted-foreground">{tpl.description}</span>}
              </>
            )}
            onItemClick={(tpl) => handleLoadTemplate(tpl.id)}
            onItemDelete={(tpl) => templateStore.deleteTemplate(tpl.id)}
          />
        )}

        {/* Save Template Form */}
        {showSaveTemplate && (
          <div className="flex-shrink-0 rounded-md border bg-muted/50 p-3 space-y-2">
            <span className="text-sm font-medium">템플릿으로 저장</span>
            <div className="flex gap-2">
              <Input placeholder="템플릿 이름 *" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="flex-1" />
              <Input placeholder="설명 (선택)" value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} className="flex-1" />
              <Button type="button" size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim()}>저장</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowSaveTemplate(false)}>취소</Button>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="flex-shrink-0 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button type="button"
                    onClick={() => { if (index <= currentStep || canProceed()) setCurrentStep(index) }}
                    className="flex flex-col items-center gap-1 group">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-primary/80' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{STEPS[currentStep].description}</p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="banner-wizard-form" onSubmit={form.handleSubmit(() => handleFinalSubmit())}>
            {currentStep === 0 && <StepBasicInfo form={form} groups={groups} />}
            {currentStep === 1 && <StepContent form={form} />}
            {currentStep === 2 && <StepLinkUtm form={form} utmPreview={utmPreview} />}
            {currentStep === 3 && <StepScheduleTarget form={form} />}
            {currentStep === 4 && <StepAbTest form={form} />}
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="mr-1 h-3 w-3" /> 임시저장
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)}>
              <FileText className="mr-1 h-3 w-3" /> 템플릿 저장
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> 이전
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed()}>
                다음 <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinalSubmit} disabled={isPending}>
                {isPending ? '생성 중...' : '배너 생성'} <Check className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Reusable List Panel ====================

function ListPanel<T extends { id: string }>({
  title,
  items,
  emptyText,
  onAction,
  actionLabel,
  actionVariant = 'ghost',
  renderItem,
  onItemClick,
  onItemDelete,
}: {
  title: string
  items: T[]
  emptyText: string
  onAction: () => void
  actionLabel: string
  actionVariant?: 'ghost' | 'outline'
  renderItem: (item: T) => React.ReactNode
  onItemClick: (item: T) => void
  onItemDelete: (item: T) => void
}) {
  return (
    <div className="flex-shrink-0 rounded-md border bg-muted/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <Button type="button" variant={actionVariant} size="sm" onClick={onAction}>
          <Save className="mr-1 h-3 w-3" /> {actionLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
      ) : (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id}
              className="flex items-center justify-between rounded-md bg-background p-2 text-sm hover:bg-accent cursor-pointer"
              onClick={() => onItemClick(item)}>
              <div>{renderItem(item)}</div>
              <Button type="button" variant="ghost" size="sm"
                onClick={(e) => { e.stopPropagation(); onItemDelete(item) }}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
