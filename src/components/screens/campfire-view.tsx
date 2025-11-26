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
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Fire size={24} weight="duotone" className="text-primary lantern-glow" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              The Campfire
            </h1>
            <p className="text-sm text-muted-foreground">
              Messages disappear after 24 hours
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {campfireMessages.length === 0 ? (
            <div className="text-center py-12">
              <Fire size={64} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                The campfire is quiet tonight
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to share something
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

      <div className="p-4 border-t border-border">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            placeholder="Share with the neighborhood..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={500}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {messageCount}/20 messages in the last 24 hours
        </p>
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
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {message.username.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-sm font-medium text-foreground ${isCurrentUser ? 'order-2' : ''}`}>
            {isCurrentUser ? 'You' : message.username}
          </span>
          <span className={`text-xs text-muted-foreground ${isCurrentUser ? 'order-1' : ''}`}>
            {timeAgo()}
          </span>
        </div>
        <div
          className={`
            inline-block p-3 rounded-lg max-w-md
            ${isCurrentUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card text-card-foreground'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}
