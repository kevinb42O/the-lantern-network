import { useState, useEffect, useRef } from 'react'
import { Fire, PaperPlaneRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Message, User } from '@/lib/types'
import { toast } from 'sonner'

// Fake conversation messages to simulate an active neighborhood chat
const FAKE_MESSAGES: Message[] = [
  {
    id: 'fake-1',
    userId: 'user-maria',
    username: 'Maria_Gardens',
    content: 'Hey everyone! Just made some fresh lemonade. Anyone want to stop by? 🍋',
    timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    type: 'campfire'
  },
  {
    id: 'fake-2',
    userId: 'user-james',
    username: 'James_Oak',
    content: 'Count me in! I\'ll bring those cookies I mentioned yesterday',
    timestamp: Date.now() - 2.5 * 60 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-3',
    userId: 'user-elena',
    username: 'Elena_River',
    content: 'Has anyone seen a gray tabby cat around Maple Street? My neighbor\'s cat Whiskers got out this morning 🐱',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-4',
    userId: 'user-david',
    username: 'David_Hill',
    content: 'I saw a cat near the community garden about an hour ago! Will keep an eye out',
    timestamp: Date.now() - 1.5 * 60 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-5',
    userId: 'user-maria',
    username: 'Maria_Gardens',
    content: 'Oh no! I\'ll check my backyard too. Whiskers loves to hide in bushes',
    timestamp: Date.now() - 1.2 * 60 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-6',
    userId: 'user-sofia',
    username: 'Sofia_Sunset',
    content: 'Quick reminder: community clean-up is this Saturday at 9am! ✨ We still need volunteers',
    timestamp: Date.now() - 45 * 60 * 1000, // 45 min ago
    type: 'campfire'
  },
  {
    id: 'fake-7',
    userId: 'user-james',
    username: 'James_Oak',
    content: 'I\'m in for Saturday. Can bring extra gloves and trash bags',
    timestamp: Date.now() - 30 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-8',
    userId: 'user-elena',
    username: 'Elena_River',
    content: 'UPDATE: Whiskers is home safe! Found him sleeping under David\'s porch 😂 Thanks everyone!',
    timestamp: Date.now() - 15 * 60 * 1000,
    type: 'campfire'
  },
  {
    id: 'fake-9',
    userId: 'user-david',
    username: 'David_Hill',
    content: 'Glad he\'s safe! That cat is always on adventures lol',
    timestamp: Date.now() - 5 * 60 * 1000,
    type: 'campfire'
  }
]

interface CampfireViewProps {
  user: User
  messages: Message[]
  onSendMessage: (content: string) => void
}

export function CampfireView({ user, messages, onSendMessage }: CampfireViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messageCount, setMessageCount] = useState(0)

  // Combine fake messages with real messages
  const allMessages = [...FAKE_MESSAGES, ...messages]
  
  const campfireMessages = allMessages
    .filter(m => m.type === 'campfire')
    .sort((a, b) => a.timestamp - b.timestamp)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [campfireMessages.length])

  // Count only the user's real messages (not fake ones) in the last 24 hours
  useEffect(() => {
    const twentyFourHours = 24 * 60 * 60 * 1000
    const recentUserMessages = messages.filter(
      m => m.type === 'campfire' && m.userId === user.id && Date.now() - m.timestamp < twentyFourHours
    )
    setMessageCount(recentUserMessages.length)
  }, [messages, user.id])

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
              disabled={!inputValue.trim() || messageCount >= 20}
              size="icon"
              className="shrink-0 h-10 w-10"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            <span className={messageCount >= 20 ? 'text-destructive font-medium' : ''}>
              {messageCount}/20 messages today
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
