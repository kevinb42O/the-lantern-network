import { useState, useEffect, useRef } from 'react'
import { Fire, PaperPlaneRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Message, User } from '@/lib/types'
import { toast } from 'sonner'

interface CampfireViewProps {
  user: User
  messages: Message[]
  onSendMessage: (content: string) => void
}

export function CampfireView({ user, messages, onSendMessage }: CampfireViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messageCount, setMessageCount] = useState(0)

  const campfireMessages = messages
    .filter(m => m.type === 'campfire')
    .sort((a, b) => a.timestamp - b.timestamp)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [campfireMessages.length])

  useEffect(() => {
    const twentyFourHours = 24 * 60 * 60 * 1000
    const recentMessages = campfireMessages.filter(
      m => Date.now() - m.timestamp < twentyFourHours
    )
    setMessageCount(recentMessages.length)
  }, [campfireMessages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    if (messageCount >= 20) {
      toast.error('Message limit reached. Please try again later.')
      return
    }

    onSendMessage(inputValue.trim())
    setInputValue('')
    setMessageCount(prev => prev + 1)
    toast.success('Message sent to the campfire')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Fire size={28} weight="duotone" className="text-primary lantern-glow" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              The Campfire
            </h1>
            <p className="text-sm text-muted-foreground">
              {campfireMessages.length === 0 
                ? 'Start a conversation with your neighbors'
                : `${campfireMessages.length} ${campfireMessages.length === 1 ? 'message' : 'messages'} • Messages fade after 24h`
              }
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto pb-4">
          {campfireMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-full bg-primary/10 mb-4">
                <Fire size={64} className="text-primary lantern-glow" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Gather around the campfire
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Share stories, ask questions, or just say hello to your neighbors
              </p>
            </div>
          ) : (
            campfireMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.userId === user.id}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card/50">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Share with the neighborhood..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || messageCount >= 20}
              size="icon"
              className="shrink-0"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className={messageCount >= 20 ? 'text-destructive font-medium' : ''}>
              {messageCount}/20 messages
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const messageAge = Date.now() - message.timestamp
  const hoursOld = messageAge / (1000 * 60 * 60)
  const opacity = Math.max(0.3, 1 - (hoursOld / 24) * 0.7)

  const timeAgo = () => {
    const seconds = Math.floor(messageAge / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
      style={{ opacity }}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="text-sm bg-primary/20 text-primary font-semibold">
          {message.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm font-semibold text-foreground">
            {isCurrentUser ? 'You' : message.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo()}
          </span>
        </div>
        <div
          className={`
            inline-block p-3 rounded-2xl
            ${isCurrentUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-card text-card-foreground border border-border rounded-bl-md'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}
