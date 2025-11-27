import { useState, useEffect, useRef } from 'react'
import { Fire, PaperPlaneRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Message, User } from '@/lib/types'

interface CampfireViewProps {
  user: User
  messages: Message[]
  onSendMessage: (content: string) => void
  adminUserIds?: string[]
}

export function CampfireView({ user, messages, onSendMessage, adminUserIds = [] }: CampfireViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const campfireMessages = messages
    .filter(m => m.type === 'campfire')
    .sort((a, b) => a.timestamp - b.timestamp)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [campfireMessages.length])

  const handleSend = () => {
    if (!inputValue.trim()) return

    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
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
              {campfireMessages.length} {campfireMessages.length === 1 ? 'message' : 'messages'} • Messages fade after 24h
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto pb-4">
          {campfireMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.userId === user.id}
              isAdmin={adminUserIds.includes(message.userId)}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card/50 relative z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Share with the neighborhood..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              className="flex-1 h-10 px-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoComplete="off"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 h-10 w-10"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            <span>{campfireMessages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  isAdmin?: boolean
}

function MessageBubble({ message, isCurrentUser, isAdmin = false }: MessageBubbleProps) {
  const messageAge = Date.now() - message.timestamp
  const hoursOld = messageAge / (1000 * 60 * 60)
  const opacity = Math.max(0.3, 1 - (hoursOld / 24) * 0.7)

  const timeAgo = () => {
    const seconds = Math.floor(messageAge / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Display name - show real username, mark as admin if applicable
  const displayName = isCurrentUser ? 'You' : message.username

  return (
    <div
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
      style={{ opacity }}
    >
      <Avatar className={`flex-shrink-0 h-10 w-10 ${isAdmin ? 'ring-2 ring-amber-400' : ''}`}>
        <AvatarFallback className={`text-sm font-semibold ${
          isAdmin 
            ? 'bg-amber-500 text-white' 
            : 'bg-primary/20 text-primary'
        }`}>
          {message.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <span className={`text-sm font-semibold ${isAdmin ? 'text-amber-400' : 'text-foreground'}`}>
            {displayName}
          </span>
          {isAdmin && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
              ADMIN
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {timeAgo()}
          </span>
        </div>
        <div
          className={`
            inline-block p-3 rounded-2xl text-sm
            ${isCurrentUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-card text-card-foreground border border-border rounded-bl-md'
            }
            ${isAdmin && !isCurrentUser ? 'border-amber-400/50' : ''}
          `}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}
