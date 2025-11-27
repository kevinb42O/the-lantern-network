import { useState, useEffect, useRef } from 'react'
import { Fire, PaperPlaneRight, Sparkle, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Message, User } from '@/lib/types'

interface CampfireViewProps {
  user: User
  messages: Message[]
  onSendMessage: (content: string) => void
  adminUserIds?: string[]
  moderatorUserIds?: string[]
  onUserClick?: (userId: string) => void
}

export function CampfireView({ user, messages, onSendMessage, adminUserIds = [], moderatorUserIds = [], onUserClick }: CampfireViewProps) {
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
      {/* Header with campfire ambiance */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-orange-950/30 via-card/80 to-transparent">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl animate-pulse" />
            <div className="relative p-3 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20">
              <Fire size={28} weight="duotone" className="text-orange-400 lantern-glow" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              The Campfire
              <span className="text-orange-400">🔥</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Gather with your neighbors • Messages fade after 24h
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Live</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto pb-4">
          {campfireMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 mb-6">
                <Fire size={48} weight="duotone" className="text-orange-400 bounce-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                The campfire is quiet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Be the first to share something with the neighborhood!
              </p>
            </div>
          ) : (
            campfireMessages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.userId === user.id}
                isAdmin={adminUserIds.includes(message.userId)}
                isModerator={moderatorUserIds.includes(message.userId)}
                animationDelay={index * 0.02}
                onUserClick={onUserClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Share something with the neighborhood..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                className="w-full h-12 px-5 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoComplete="off"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 h-12 w-12 rounded-2xl btn-glow"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
            <span className="flex items-center gap-1">
              Press Enter to send
            </span>
            <span>{campfireMessages.length} messages around the fire</span>
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
  isModerator?: boolean
  animationDelay?: number
  onUserClick?: (userId: string) => void
}

function MessageBubble({ message, isCurrentUser, isAdmin = false, isModerator = false, animationDelay = 0, onUserClick }: MessageBubbleProps) {
  const messageAge = Date.now() - message.timestamp
  const hoursOld = messageAge / (1000 * 60 * 60)
  // Messages fade more gracefully
  const opacity = Math.max(0.4, 1 - (hoursOld / 24) * 0.6)

  const timeAgo = () => {
    const seconds = Math.floor(messageAge / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Display name
  const displayName = isCurrentUser ? 'You' : message.username

  // Get ring/avatar styles based on role
  const getRingStyle = () => {
    if (isAdmin) return 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background'
    if (isModerator) return 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-background'
    return ''
  }

  const getAvatarBgStyle = () => {
    if (isAdmin) return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
    if (isModerator) return 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
    return 'bg-gradient-to-br from-primary/30 to-accent/20 text-foreground'
  }

  const getNameStyle = () => {
    if (isAdmin) return 'text-amber-400'
    if (isModerator) return 'text-cyan-400'
    return 'text-foreground'
  }

  return (
    <div
      className={`flex gap-3 fade-in-up ${isCurrentUser ? 'flex-row-reverse' : ''}`}
      style={{ opacity, animationDelay: `${animationDelay}s` }}
    >
      <button
        onClick={() => onUserClick?.(message.userId)}
        className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
        aria-label={`View ${message.username}'s profile`}
      >
        <Avatar className={`flex-shrink-0 h-10 w-10 cursor-pointer ${getRingStyle()}`}>
          <AvatarFallback className={`text-sm font-semibold ${getAvatarBgStyle()}`}>
            {message.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      
      <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => onUserClick?.(message.userId)}
            className={`text-sm font-semibold hover:underline cursor-pointer ${getNameStyle()}`}
            aria-label={`View ${message.username}'s profile`}
          >
            {displayName}
          </button>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium border border-amber-500/30">
              <Sparkle size={10} weight="fill" />
              Admin
            </span>
          )}
          {isModerator && !isAdmin && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium border border-cyan-500/30">
              <ShieldCheck size={10} weight="fill" />
              Mod
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {timeAgo()}
          </span>
        </div>
        <div
          className={`
            inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isCurrentUser 
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-lg shadow-primary/20' 
              : 'bg-card text-card-foreground border border-border/50 rounded-bl-md'
            }
            ${isAdmin && !isCurrentUser ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5' : ''}
            ${isModerator && !isAdmin && !isCurrentUser ? 'border-cyan-400/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5' : ''}
          `}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}
