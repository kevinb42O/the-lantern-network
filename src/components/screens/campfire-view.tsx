import { useState, useEffect, useRef } from 'react'
<<<<<<< Updated upstream
import { Fire, PaperPlaneRight, Sparkle, ShieldCheck, Flag } from '@phosphor-icons/react'
=======
import { Fire, PaperPlaneRight, ChatsCircle, Wrench, ForkKnife, Lightbulb } from '@phosphor-icons/react'
>>>>>>> Stashed changes
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
<<<<<<< Updated upstream
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
=======
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Message, User, Chat } from '@/lib/types'
>>>>>>> Stashed changes
import { toast } from 'sonner'
import type { Message, User, ReportCategory } from '@/lib/types'

interface CampfireViewProps {
  user: User
  messages: Message[]
  chats: Chat[]
  onSendMessage: (content: string) => void
<<<<<<< Updated upstream
  adminUserIds?: string[]
  moderatorUserIds?: string[]
  onUserClick?: (userId: string) => void
}

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'other', label: 'Other' }
]

export function CampfireView({ user, messages, onSendMessage, adminUserIds = [], moderatorUserIds = [], onUserClick }: CampfireViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null)
  const [reportCategory, setReportCategory] = useState<ReportCategory>('harassment')
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
=======
  onOpenChat: (chatId: string) => void
}

const categoryIcons = {
  Mechanical: Wrench,
  Food: ForkKnife,
  Talk: ChatsCircle,
  Other: Lightbulb
}

export function CampfireView({ user, messages, chats, onSendMessage, onOpenChat }: CampfireViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messageCount, setMessageCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'campfire' | 'messages'>('campfire')
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  const handleReportMessage = (message: Message) => {
    setReportingMessage(message)
    setReportCategory('harassment')
    setReportDescription('')
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!reportingMessage || !reportDescription.trim()) {
      toast.error('Please provide a description')
      return
    }

    setSubmittingReport(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('You must be logged in to report')
        return
      }

      const { error } = await supabase.from('reports').insert({
        reporter_id: userData.user.id,
        reported_user_id: reportingMessage.userId,
        report_type: 'message',
        target_id: reportingMessage.id,
        category: reportCategory,
        description: reportDescription.trim(),
        status: 'pending'
      })

      if (error) {
        console.error('Error submitting report:', error)
        toast.error('Failed to submit report')
        return
      }

      toast.success('Report submitted. Thank you for helping keep our community safe.')
      setShowReportModal(false)
      setReportingMessage(null)
    } catch (err) {
      console.error('Report error:', err)
      toast.error('Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
=======
  // Get user's chats and sort by last activity
  const userChats = chats
    .filter(c => c.participants.ownerId === user.id || c.participants.helperId === user.id)
    .sort((a, b) => b.lastActivity - a.lastActivity)

  // Get unread count (chats with messages newer than last viewed)
  const getLastMessage = (chatId: string) => {
    const chatMsgs = messages.filter(m => m.chatId === chatId)
    return chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null
  }

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
>>>>>>> Stashed changes
  }

  return (
    <div className="flex flex-col h-full bg-background">
<<<<<<< Updated upstream
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
                onReport={handleReportMessage}
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

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag size={24} weight="duotone" className="text-red-400" />
              Report Message
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>

          {reportingMessage && (
            <div className="space-y-4 py-2">
              {/* Message preview */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Message from {reportingMessage.username}:</p>
                <p className="text-sm text-foreground line-clamp-3">{reportingMessage.content}</p>
              </div>

              {/* Category selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={reportCategory === cat.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReportCategory(cat.value)}
                      className="rounded-xl text-xs"
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description <span className="text-red-400">*</span>
                </Label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please describe what's wrong with this message..."
                  className="w-full h-24 px-3 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                  onClick={handleSubmitReport}
                  disabled={submittingReport || !reportDescription.trim()}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
=======
      <div className="p-4 border-b border-border bg-card/30">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'campfire' | 'messages')}>
          <TabsList className="w-full">
            <TabsTrigger value="campfire" className="flex-1 gap-2">
              <Fire size={18} weight="duotone" />
              Campfire
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 gap-2">
              <ChatsCircle size={18} weight="duotone" />
              Messages
              {userChats.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {userChats.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'campfire' ? (
        <>
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
                <span>Press Enter to send</span>
                <span className={messageCount >= 20 ? 'text-destructive font-medium' : ''}>
                  {messageCount}/20 messages
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {userChats.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
                  <ChatsCircle size={64} className="text-muted-foreground" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No messages yet
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  When you help someone or someone helps you, your conversations will appear here
                </p>
              </div>
            ) : (
              userChats.map((chat) => {
                const lastMessage = getLastMessage(chat.id)
                const otherName = chat.participants.ownerId === user.id 
                  ? chat.participants.helperName 
                  : chat.participants.ownerName
                const isOwner = chat.participants.ownerId === user.id
                const CategoryIcon = categoryIcons[chat.flareCategory]

                return (
                  <button
                    key={chat.id}
                    onClick={() => onOpenChat(chat.id)}
                    className="w-full p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {otherName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {otherName}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {timeAgo(chat.lastActivity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryIcon size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {isOwner ? 'Helping you' : 'You\'re helping'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage 
                            ? `${lastMessage.userId === user.id ? 'You: ' : ''}${lastMessage.content}`
                            : chat.flareDescription
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      )}
>>>>>>> Stashed changes
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
  onReport?: (message: Message) => void
}

function MessageBubble({ message, isCurrentUser, isAdmin = false, isModerator = false, animationDelay = 0, onUserClick, onReport }: MessageBubbleProps) {
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
      className={`flex gap-3 fade-in-up group ${isCurrentUser ? 'flex-row-reverse' : ''}`}
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
          {/* Report button - only show for other users' messages */}
          {!isCurrentUser && onReport && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReport(message)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
              title="Report message"
            >
              <Flag size={14} />
            </button>
          )}
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
