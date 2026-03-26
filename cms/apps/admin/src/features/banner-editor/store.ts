import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BannerCreateInput, BannerDraft, BannerTemplate } from '@letmein/types'

export type BannerFormData = Partial<BannerCreateInput>

const DRAFT_STORAGE_KEY = 'banner-drafts'
const TEMPLATE_STORAGE_KEY = 'banner-templates'

// ==================== Draft Store ====================

interface BannerDraftState {
  drafts: BannerDraft[]
  activeDraftId: string | null

  saveDraft: (data: BannerFormData, currentStep: number) => string
  loadDraft: (id: string) => BannerDraft | undefined
  deleteDraft: (id: string) => void
  setActiveDraft: (id: string | null) => void
  getActiveDraft: () => BannerDraft | undefined
  clearAll: () => void
}

export const useBannerDraftStore = create<BannerDraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      activeDraftId: null,

      saveDraft: (data, currentStep) => {
        const { activeDraftId, drafts } = get()
        const now = new Date().toISOString()

        if (activeDraftId) {
          set({
            drafts: drafts.map((d) =>
              d.id === activeDraftId
                ? { ...d, data, currentStep, savedAt: now }
                : d,
            ),
          })
          return activeDraftId
        }

        const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const draft: BannerDraft = { id, data, currentStep, savedAt: now }
        set({ drafts: [...drafts, draft], activeDraftId: id })
        return id
      },

      loadDraft: (id) => get().drafts.find((d) => d.id === id),

      deleteDraft: (id) => {
        const { drafts, activeDraftId } = get()
        set({
          drafts: drafts.filter((d) => d.id !== id),
          activeDraftId: activeDraftId === id ? null : activeDraftId,
        })
      },

      setActiveDraft: (id) => set({ activeDraftId: id }),
      getActiveDraft: () => {
        const { drafts, activeDraftId } = get()
        return drafts.find((d) => d.id === activeDraftId)
      },
      clearAll: () => set({ drafts: [], activeDraftId: null }),
    }),
    { name: DRAFT_STORAGE_KEY },
  ),
)

// ==================== Template Store ====================

interface BannerTemplateState {
  templates: BannerTemplate[]

  saveTemplate: (name: string, description: string, data: BannerCreateInput) => string
  deleteTemplate: (id: string) => void
  updateTemplate: (id: string, name: string, description: string, data: BannerCreateInput) => void
}

export const useBannerTemplateStore = create<BannerTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      saveTemplate: (name, description, data) => {
        const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const now = new Date().toISOString()
        const template: BannerTemplate = {
          id,
          name,
          description,
          data,
          createdAt: now,
          updatedAt: now,
        }
        set({ templates: [...get().templates, template] })
        return id
      },

      deleteTemplate: (id) =>
        set({ templates: get().templates.filter((t) => t.id !== id) }),

      updateTemplate: (id, name, description, data) => {
        const now = new Date().toISOString()
        set({
          templates: get().templates.map((t) =>
            t.id === id ? { ...t, name, description, data, updatedAt: now } : t,
          ),
        })
      },
    }),
    { name: TEMPLATE_STORAGE_KEY },
  ),
)
