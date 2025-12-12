import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, PaperPlaneRight, Wrench, ForkKnife, ChatsCircle, Lightbulb } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Chat, Message, User } from '@/lib/types'

interface ChatViewProps {
  user: User
  chat: Chat
  messages: Message[]
  onSendMessage: (content: string, chatId: string) => void
  onBack: () => void
}

const categoryIcons = {
  Mechanical: Wrench,
  Food: ForkKnife,
  Talk: ChatsCircle,
  Other: Lightbulb
}

export function ChatView({ user, chat, messages, onSendMessage, onBack }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const chatMessages = messages
    .filter(m => m.chatId === chat.id)
    .sort((a, b) => a.timestamp - b.timestamp)

  const otherParticipant = chat.participants.ownerId === user.id
    ? { id: chat.participants.helperId, name: chat.participants.helperName }
    : { id: chat.participants.ownerId, name: chat.participants.ownerName }

  const isOwner = chat.participants.ownerId === user.id
  const CategoryIcon = categoryIcons[chat.flareCategory]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages.length])

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendMessage(inputValue.trim(), chat.id)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={24} />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {otherParticipant.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {otherParticipant.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isOwner ? 'Helping you' : 'You\'re helping'}
            </p>
          </div>
        </div>

        {/* Flare info banner */}
        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <CategoryIcon size={16} className="text-primary" weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {chat.flareCategory}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chat.flareDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto pb-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-3">
                <ChatsCircle size={48} className="text-primary" weight="duotone" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Start the conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {isOwner 
                  ? `${otherParticipant.name} offered to help! Say hello and coordinate.`
                  : `You offered to help! Introduce yourself and discuss how you can assist.`
                }
              </p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.userId === user.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                    {message.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[75%] ${message.userId === user.id ? 'text-right' : ''}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${message.userId === user.id ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-foreground">
                      {message.userId === user.id ? 'You' : message.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(message.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`
                      inline-block p-3 rounded-2xl
                      ${message.userId === user.id 
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
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
