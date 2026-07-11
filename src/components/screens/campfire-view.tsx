// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { Fire, PaperPlaneRight, Sparkle, ShieldCheck, Flag } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { CampfireEffects } from '@/components/ui/campfire-effects'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useCampfireMessages, useSendCampfireMessage } from '@/hooks/useCampfire'
import { useDeleteMessage } from '@/hooks/useMessages'
import { isAdminEmail } from '@/lib/admin'
import { ELDER_TRUST_THRESHOLD } from '@/lib/economy'
import { useOutletContext } from 'react-router-dom'
import { MediaComposer } from '@/components/chat/MediaComposer'
import { MessageMedia } from '@/components/chat/MessageMedia'
import { MessageReactions } from '@/components/chat/MessageReactions'
import { useToggleReaction } from '@/hooks/useMessageReactions'
import type { Message, ReportCategory } from '@/lib/types'

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'harassment', label: 'Intimidatie' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_content', label: 'Ongepaste inhoud' },
  { value: 'safety_concern', label: 'Veiligheidsprobleem' },
  { value: 'other', label: 'Overig' }
]

export function CampfireView() {
  const { user: authUser, profile } = useAuth()
  const { data: campfireData } = useCampfireMessages()
  const sendMessage = useSendCampfireMessage()
  const deleteMessage = useDeleteMessage()
  const outletContext = useOutletContext<{ onUserClick?: (userId: string) => void }>()
  const onUserClick = outletContext?.onUserClick

  if (!authUser || !profile) return null

  const messages = campfireData?.messages || []
  const adminUserIds = campfireData?.adminIds || []
  const moderatorUserIds = campfireData?.moderatorIds || []

  // Build user data from auth context
  const user = {
    id: authUser.id,
    username: profile.display_name,
    isAdmin: isAdminEmail(authUser.email),
  }

  const onSendMessage = (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'gif' | null) => {
    sendMessage.mutate({ content, mediaUrl, mediaType })
  }

  const [inputValue, setInputValue] = useState('')
  const [pendingMedia, setPendingMedia] = useState<{ mediaUrl: string; mediaType: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const toggleReactionMutation = useToggleReaction()
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null)
  const [reportCategory, setReportCategory] = useState<ReportCategory>('harassment')
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  const campfireMessages = messages
    .filter(m => m.type === 'campfire')
    .sort((a, b) => a.timestamp - b.timestamp)

  // Group messages
  const renderMessageList = () => {
    const list: React.ReactNode[] = []
    let lastDateStr = ''
    
    for (let i = 0; i < campfireMessages.length; i++) {
      const msg = campfireMessages[i]
      const prevMsg = i > 0 ? campfireMessages[i - 1] : null
      
      const date = new Date(msg.timestamp)
      const dateStr = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
      const isToday = dateStr === new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
      const isYesterday = dateStr === new Date(Date.now() - 86400000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
      
      const displayDate = isToday ? 'Vandaag' : isYesterday ? 'Gisteren' : dateStr
      
      if (displayDate !== lastDateStr) {
        list.push(
          <div key={`date-${displayDate}`} className="flex justify-center my-6">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {displayDate}
            </span>
          </div>
        )
        lastDateStr = displayDate
      }
      
      const isSameUser = prevMsg && prevMsg.userId === msg.userId
      const isCloseTime = prevMsg && (msg.timestamp - prevMsg.timestamp) < 2 * 60 * 1000 // 2 mins
      const isGrouped = isSameUser && isCloseTime && lastDateStr === displayDate

      list.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isCurrentUser={msg.userId === user.id}
          isAdmin={adminUserIds.includes(msg.userId)}
          isModerator={moderatorUserIds.includes(msg.userId)}
          animationDelay={0.02}
          onUserClick={onUserClick}
          onReport={handleReportMessage}
          onToggleReaction={(reaction) => toggleReactionMutation.mutate({ messageId: msg.id, reaction })}
          onDelete={(id) => deleteMessage.mutate({ messageId: id })}
          isGrouped={Boolean(isGrouped)}
        />
      )
    }
    
    return list
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [campfireMessages.length])

  const handleSend = () => {
    if (!inputValue.trim() && !pendingMedia) return

    onSendMessage(inputValue.trim(), pendingMedia?.mediaUrl, pendingMedia?.mediaType)
    setInputValue('')
    setPendingMedia(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReportMessage = (message: Message) => {
    setReportingMessage(message)
    setReportCategory('harassment')
    setReportDescription('')
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!reportingMessage || !reportDescription.trim()) {
      toast.error('Geef een beschrijving')
      return
    }

    setSubmittingReport(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('Je moet aangemeld zijn om te melden')
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
        toast.error('Melding indienen mislukt')
        return
      }

      toast.success('Melding ingediend. Bedankt voor het helpen onze gemeenschap veilig te houden.')
      setShowReportModal(false)
      setReportingMessage(null)
    } catch (err) {
      console.error('Report error:', err)
      toast.error('Melding indienen mislukt')
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-5 border-b border-border bg-gradient-to-b from-orange-950/30 via-card/80 to-transparent">
        <div className="flex items-center gap-4 max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto w-full">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl animate-pulse" />
            <div className="relative p-3 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20">
              <Fire size={28} weight="duotone" className="text-orange-400 lantern-glow" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              't Kampvuur
              <span className="text-orange-400">🔥</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Kom samen met je buren • Berichten verdwijnen na 24u
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Live</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 relative" ref={scrollRef}>
        <CampfireEffects />
        <AmbientBackground variant="campfire" />
        <div className="space-y-4 max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto w-full pb-4 relative z-10">
          {campfireMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 mb-6">
                <Fire size={48} weight="duotone" className="text-orange-400 bounce-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                't Kampvuur is rustig
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Wees de eerste om iets te delen met de buurt!
              </p>
            </div>
          ) : (
            renderMessageList()
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-2 border-t border-border bg-card/80 backdrop-blur-sm relative z-10">
        <div className="max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto w-full">
          <MediaComposer
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            pendingMedia={pendingMedia}
            onPendingMediaChange={setPendingMedia}
            onError={(err) => toast.error(err)}
            placeholder="Deel iets met de buurt..."
          />
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag size={24} weight="duotone" className="text-red-400" />
              Bericht melden
            </DialogTitle>
            <DialogDescription>
              Help ons de gemeenschap veilig te houden door ongepaste inhoud te melden
            </DialogDescription>
          </DialogHeader>

          {reportingMessage && (
            <div className="space-y-4 py-2">
              {/* Message preview */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Bericht van {reportingMessage.username}:</p>
                <p className="text-sm text-foreground line-clamp-3">{reportingMessage.content}</p>
              </div>

              {/* Category selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categorie</Label>
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
                  Beschrijving <span className="text-red-400">*</span>
                </Label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Beschrijf wat er mis is met dit bericht..."
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
                  Annuleren
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                  onClick={handleSubmitReport}
                  disabled={submittingReport || !reportDescription.trim()}
                >
                  {submittingReport ? 'Versturen...' : 'Melding versturen'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  onToggleReaction?: (reaction: string) => void
  onDelete?: (messageId: string) => void
  onReply?: (message: Message) => void
  isGrouped?: boolean
}

function MessageBubble({ message, isCurrentUser, isAdmin = false, isModerator = false, animationDelay = 0, onUserClick, onReport, onToggleReaction, onDelete, onReply, isGrouped = false }: MessageBubbleProps) {
  const messageAge = Date.now() - message.timestamp
  const hoursOld = messageAge / (1000 * 60 * 60)
  // Messages fade more gracefully
  const opacity = Math.max(0.4, 1 - (hoursOld / 24) * 0.6)

  const timeAgo = () => {
    const seconds = Math.floor(messageAge / 1000)
    if (seconds < 60) return 'zojuist'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m geleden`
    return `${Math.floor(seconds / 3600)}u geleden`
  }

  // Display name
  const displayName = isCurrentUser ? 'Jij' : message.username

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

  const isDeleted = Boolean(message.deletedAt)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`flex gap-3 fade-in-up group ${isCurrentUser ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-1' : 'mt-4'} ${isDeleted ? 'opacity-70' : ''}`}
          style={{ opacity, animationDelay: `${animationDelay}s` }}
        >
          <div className="w-10 flex-shrink-0 flex justify-center">
            {!isGrouped && (
              <button
                onClick={() => onUserClick?.(message.userId)}
                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
                aria-label={`Bekijk ${message.username}'s profiel`}
              >
                <Avatar className={`h-10 w-10 cursor-pointer ${getRingStyle()}`}>
                  <AvatarFallback className={`text-sm font-semibold ${getAvatarBgStyle()}`}>
                    {message.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
          
          <div className={`flex-1 max-w-[75%] ${isCurrentUser ? 'text-right' : ''}`}>
            {!isGrouped && (
              <div className={`flex items-center gap-2 mb-1.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => onUserClick?.(message.userId)}
                  className={`text-sm font-semibold hover:underline cursor-pointer ${getNameStyle()}`}
                  aria-label={`Bekijk ${message.username}'s profiel`}
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
                    title="Bericht melden"
                  >
                    <Flag size={14} />
                  </button>
                )}
              </div>
            )}
            
            {/* Message Content */}
            <div
              className={`
                inline-block p-3 rounded-2xl text-left relative group/message
                ${isCurrentUser 
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-md shadow-md shadow-orange-500/20' 
                  : 'bg-card text-card-foreground border border-border rounded-bl-md'
                }
              `}
            >
              {isDeleted ? (
                <p className="italic text-muted-foreground/80 flex items-center gap-2 text-sm">
                  Dit bericht is verwijderd
                </p>
              ) : (
                <>
                  {message.mediaUrl && (
                    <div className="mb-2">
                      <MessageMedia mediaUrl={message.mediaUrl} mediaType={message.mediaType || undefined} />
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                </>
              )}
              
              {/* Reactions */}
              {!isDeleted && (
                <MessageReactions
                  message={message as any}
                  currentUserId="dummy"
                  align={isCurrentUser ? 'right' : 'left'}
                  onToggleReaction={onToggleReaction || (() => {})}
                />
              )}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      
      {!isDeleted && (
        <ContextMenuContent className="w-48 bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
          <ContextMenuItem 
            className="cursor-pointer flex items-center gap-2"
            onClick={() => {
              navigator.clipboard.writeText(message.content)
              toast.success('Gekopieerd naar klembord')
            }}
          >
            <span>Kopiëren</span>
          </ContextMenuItem>
          {onReply && (
            <ContextMenuItem 
              className="cursor-pointer flex items-center gap-2"
              onClick={() => onReply(message)}
            >
              <span>Beantwoorden</span>
            </ContextMenuItem>
          )}
          {isCurrentUser && onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem 
                className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(message.id)}
              >
                <span>Verwijderen</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}
