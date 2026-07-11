import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeTyping(channelId: string, currentUserId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!channelId || !currentUserId) return

    const channel = supabase.channel(`typing:${channelId}`, {
      config: { presence: { key: currentUserId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ typing: boolean }>()
        const currentlyTyping: string[] = []

        for (const [userId, userPresences] of Object.entries(state)) {
          if (userId === currentUserId) continue // Ignore self
          if (userPresences.some((p) => p.typing)) {
            currentlyTyping.push(userId)
          }
        }

        setTypingUsers(currentlyTyping)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [channelId, currentUserId])

  const notifyTyping = () => {
    if (!channelRef.current) return

    channelRef.current.track({ typing: true })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.track({ typing: false })
      }
    }, 3000)
  }

  return { typingUsers, notifyTyping }
}
