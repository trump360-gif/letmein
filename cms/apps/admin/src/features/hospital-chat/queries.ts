'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchHospitalChatRooms,
  fetchMessages,
  sendMessage,
  createVisitCard,
  fetchVisitCards,
} from './api'

export function useHospitalChatRooms() {
  return useQuery({
    queryKey: ['hospital-chat-rooms'],
    queryFn: fetchHospitalChatRooms,
  })
}

export function useChatMessages(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => fetchMessages(roomId),
    enabled,
    refetchInterval: false,
  })
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => sendMessage(roomId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
      queryClient.invalidateQueries({ queryKey: ['hospital-chat-rooms'] })
    },
  })
}

export function useCreateVisitCard(roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ scheduledAt, note }: { scheduledAt: string; note?: string }) =>
      createVisitCard(roomId, scheduledAt, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
      queryClient.invalidateQueries({ queryKey: ['visit-cards', roomId] })
    },
  })
}

export function useVisitCards(roomId: string) {
  return useQuery({
    queryKey: ['visit-cards', roomId],
    queryFn: () => fetchVisitCards(roomId),
    enabled: !!roomId,
  })
}
