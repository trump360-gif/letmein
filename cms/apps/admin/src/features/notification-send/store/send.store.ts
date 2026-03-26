import { create } from 'zustand'
import type { NotificationChannel, NotificationPriority, TargetType } from '@letmein/types'

interface SendNotificationState {
  // Form state
  targetType: TargetType
  targetValue: string
  channels: NotificationChannel[]
  priority: NotificationPriority
  title: string
  body: string
  linkUrl: string
  scheduledAt: string

  // Actions
  setTargetType: (targetType: TargetType) => void
  setTargetValue: (targetValue: string) => void
  toggleChannel: (channel: NotificationChannel) => void
  setChannels: (channels: NotificationChannel[]) => void
  setPriority: (priority: NotificationPriority) => void
  setTitle: (title: string) => void
  setBody: (body: string) => void
  setLinkUrl: (linkUrl: string) => void
  setScheduledAt: (scheduledAt: string) => void
  reset: () => void
}

const initialState = {
  targetType: 'all' as TargetType,
  targetValue: '',
  channels: ['inapp'] as NotificationChannel[],
  priority: 2 as NotificationPriority,
  title: '',
  body: '',
  linkUrl: '',
  scheduledAt: '',
}

export const useSendNotificationStore = create<SendNotificationState>((set) => ({
  ...initialState,

  setTargetType: (targetType) => set({ targetType, targetValue: '' }),
  setTargetValue: (targetValue) => set({ targetValue }),
  toggleChannel: (channel) =>
    set((state) => {
      const exists = state.channels.includes(channel)
      return {
        channels: exists
          ? state.channels.filter((c) => c !== channel)
          : [...state.channels, channel],
      }
    }),
  setChannels: (channels) => set({ channels }),
  setPriority: (priority) => set({ priority }),
  setTitle: (title) => set({ title }),
  setBody: (body) => set({ body }),
  setLinkUrl: (linkUrl) => set({ linkUrl }),
  setScheduledAt: (scheduledAt) => set({ scheduledAt }),
  reset: () => set(initialState),
}))
