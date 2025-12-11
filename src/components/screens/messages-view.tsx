import { useState, useEffect, useCallback } from 'react'
import { ChatCircle, Check, X, PaperPlaneRight, Fire, Lamp, ArrowLeft, CheckCircle, Hourglass, XCircle, HandHeart, Sparkle, Coins, Megaphone, Gift, CheckFat, UserCirclePlus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AmbientBackground } from '@/components/ui/ambient-background'
import type { User, Flare, Message, HelpRequest, Announcement, AnnouncementRecipient, CircleConnection } from '@/lib/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCircleConnections, useConnectionRequests, useAcceptConnectionRequest, useDeclineConnectionRequest, useCircleMessages, useSendCircleMessage, useRemoveFromCircle, MAX_TRUST_LEVEL } from '@/hooks/useCircle'

type MessagesTab = 'conversations' | 'circle' | 'requests'

interface MessagesViewProps {
  user: User
  flares: Flare[]
  messages: Message[]
  helpRequests: HelpRequest[]
  onAcceptHelp: (helpRequestId: string) => void
  onDenyHelp: (helpRequestId: string) => void
  onSendMessage: (helpRequestId: string, content: string) => void
  onCompleteFlare: (flareId: string, helperId: string) => void
  onMarkAsRead?: () => void
  onUserClick?: (userId: string) => void
  initialCircleChatUserId?: string | null
}

export function MessagesView({ 
  user, 
  flares, 
  messages, 
  helpRequests,
  onAcceptHelp,
  onDenyHelp,
  onSendMessage,
  onCompleteFlare,
  onMarkAsRead,
  onUserClick,
  initialCircleChatUserId
}: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<HelpRequest | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [activeTab, setActiveTab] = useState<MessagesTab>('conversations')
  
  // Circle chat state
  const [selectedCircleMember, setSelectedCircleMember] = useState<CircleConnection | null>(null)
  const [circleChatInput, setCircleChatInput] = useState('')
  
  // Circle hooks
  const { data: circleConnections = [], refetch: refetchCircle } = useCircleConnections()
  const { data: connectionRequests, refetch: refetchRequests } = useConnectionRequests()
  const acceptRequest = useAcceptConnectionRequest()
  const declineRequest = useDeclineConnectionRequest()
  const { data: circleMessages = [], refetch: refetchCircleMessages } = useCircleMessages(selectedCircleMember?.connectedUserId || null)
  const sendCircleMessage = useSendCircleMessage()
  const removeFromCircle = useRemoveFromCircle()
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<(Announcement & { recipient?: AnnouncementRecipient })[]>([])
  const [claimingGift, setClaimingGift] = useState<string | null>(null)

  // Handle initial circle chat user ID (from profile modal)
  useEffect(() => {
    if (initialCircleChatUserId && circleConnections.length > 0) {
      const member = circleConnections.find(c => c.connectedUserId === initialCircleChatUserId)
      if (member) {
        setSelectedCircleMember(member)
        setActiveTab('circle')
      }
    }
  }, [initialCircleChatUserId, circleConnections])

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch active announcements
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching announcements:', error)
        return
      }

      if (!announcementsData || announcementsData.length === 0) {
        setAnnouncements([])
        return
      }

      // Get sender names
      const senderIds = [...new Set(announcementsData.map(a => a.sender_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds)

      const profileMap: Record<string, { name: string; avatar: string | null }> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url }
      })

      // Get user's recipient records
      const { data: recipientData } = await supabase
        .from('announcement_recipients')
        .select('*')
        .eq('user_id', authUser.id)

      const recipientMap: Record<string, AnnouncementRecipient> = {}
      recipientData?.forEach(r => {
        recipientMap[r.announcement_id] = r
      })

      const announcementsWithData = announcementsData.map(a => ({
        ...a,
        sender_name: profileMap[a.sender_id]?.name || 'Unknown',
        sender_avatar: profileMap[a.sender_id]?.avatar || null,
        recipient: recipientMap[a.id]
      }))

      setAnnouncements(announcementsWithData)
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
  }, [])

  // Mark announcement as read
  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Check if already has a recipient record
      const announcement = announcements.find(a => a.id === announcementId)
      if (announcement?.recipient?.read_at) return

      if (announcement?.recipient) {
        // Update existing record
        await supabase
          .from('announcement_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('id', announcement.recipient.id)
      } else {
        // Insert new record
        await supabase
          .from('announcement_recipients')
          .insert({
            announcement_id: announcementId,
            user_id: authUser.id,
            read_at: new Date().toISOString()
          })
      }

      fetchAnnouncements()
    } catch (err) {
      console.error('Error marking announcement as read:', err)
    }
  }

  // Claim gift from announcement
  const claimAnnouncementGift = async (announcement: Announcement & { recipient?: AnnouncementRecipient }) => {
    if (claimingGift) return
    if (announcement.recipient?.gift_claimed) {
      toast.error('Gift already claimed!')
      return
    }
    if (announcement.gift_amount <= 0) return

    setClaimingGift(announcement.id)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        toast.error('Not authenticated')
        return
      }

      // Check if already claimed (server-side check for race conditions)
      const { data: existingRecipient } = await supabase
        .from('announcement_recipients')
        .select('*')
        .eq('announcement_id', announcement.id)
        .eq('user_id', authUser.id)
        .single()

      if (existingRecipient?.gift_claimed) {
        toast.error('Gift already claimed!')
        fetchAnnouncements()
        return
      }

      // Update or insert recipient record with gift claimed
      if (existingRecipient) {
        const { error: updateError } = await supabase
          .from('announcement_recipients')
          .update({
            gift_claimed: true,
            gift_claimed_at: new Date().toISOString(),
            read_at: existingRecipient.read_at || new Date().toISOString()
          })
          .eq('id', existingRecipient.id)

        if (updateError) {
          console.error('Error updating recipient:', updateError)
          toast.error('Failed to claim gift')
          return
        }
      } else {
        const { error: insertError } = await supabase
          .from('announcement_recipients')
          .insert({
            announcement_id: announcement.id,
            user_id: authUser.id,
            read_at: new Date().toISOString(),
            gift_claimed: true,
            gift_claimed_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting recipient:', insertError)
          toast.error('Failed to claim gift')
          return
        }
      }

      // Get current user profile to update balance
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('lantern_balance')
        .eq('user_id', authUser.id)
        .single()

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError)
        toast.error('Failed to update balance')
        return
      }

      // Update user's lantern balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ lantern_balance: profileData.lantern_balance + announcement.gift_amount })
        .eq('user_id', authUser.id)

      if (balanceError) {
        console.error('Error updating balance:', balanceError)
        toast.error('Failed to update balance')
        return
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: authUser.id,
          type: 'announcement_gift',
          amount: announcement.gift_amount,
          description: `Gift from announcement: ${announcement.title}`
        })

      if (txError) {
        console.error('Error creating transaction:', txError)
        // Not critical, gift was still claimed
      }

      toast.success(`🎁 You received ${announcement.gift_amount} lantern${announcement.gift_amount > 1 ? 's' : ''}!`)
      fetchAnnouncements()
    } catch (err) {
      console.error('Error claiming gift:', err)
      toast.error('Failed to claim gift')
    } finally {
      setClaimingGift(null)
    }
  }

  // Mark messages as read when component mounts
  useEffect(() => {
    if (onMarkAsRead) {
      onMarkAsRead()
    }
    fetchAnnouncements()
  }, [onMarkAsRead, fetchAnnouncements])

  // Get help requests where user is involved (either as helper or flare owner)
  const myHelpRequests = helpRequests.filter(
    hr => hr.helperId === user.id || hr.flareOwnerId === user.id
  )

  // Pending requests on MY flares (someone wants to help me)
  const pendingRequestsForMe = myHelpRequests.filter(
    hr => hr.flareOwnerId === user.id && hr.status === 'pending'
  )

  // Pending requests I SENT (waiting for response)
  const myPendingOffers = myHelpRequests.filter(
    hr => hr.helperId === user.id && hr.status === 'pending'
  )

  // My denied requests (to show feedback)
  const myDeniedOffers = myHelpRequests.filter(
    hr => hr.helperId === user.id && hr.status === 'denied'
  )

  // Active conversations (accepted only)
  const activeConversations = myHelpRequests.filter(
    hr => hr.status === 'accepted'
  )

  const getFlareForRequest = (helpRequest: HelpRequest): Flare | undefined => {
    return flares.find(f => f.id === helpRequest.flareId)
  }

  const getChatMessages = (helpRequestId: string): Message[] => {
    return messages
      .filter(m => m.chatId === helpRequestId)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedConversation) return
    onSendMessage(selectedConversation.id, chatInput.trim())
    setChatInput('')
  }

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCompleteTask = () => {
    if (!selectedConversation) return
    const flare = getFlareForRequest(selectedConversation)
    if (!flare) return
    
    if (user.lanternBalance < 1) {
      toast.error('Not enough lanterns to complete this task')
      return
    }
    
    onCompleteFlare(flare.id, selectedConversation.helperId)
    toast.success('🏮 Task completed! 1 Lantern sent as thanks!')
    setSelectedConversation(null)
  }

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getTimeAgoFromString = (dateString: string): string => {
    return getTimeAgo(new Date(dateString).getTime())
  }

  const getOtherParticipant = (hr: HelpRequest) => {
    if (hr.flareOwnerId === user.id) {
      return { id: hr.helperId, username: hr.helperUsername }
    }
    return { id: hr.flareOwnerId, username: hr.flareOwnerUsername }
  }

  // Trust level to flame icons
  const getTrustFlames = (level: number): string => {
    return '🔥'.repeat(Math.min(level, MAX_TRUST_LEVEL))
  }

  // Handle Circle message send
  const handleSendCircleMessage = async () => {
    if (!circleChatInput.trim() || !selectedCircleMember) return
    try {
      await sendCircleMessage.mutateAsync({
        receiverId: selectedCircleMember.connectedUserId,
        content: circleChatInput.trim()
      })
      setCircleChatInput('')
      refetchCircleMessages()
    } catch {
      toast.error('Failed to send message')
    }
  }

  const handleCircleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendCircleMessage()
    }
  }

  // Handle accept/decline connection request
  const handleAcceptConnectionRequest = async (requestId: string) => {
    try {
      await acceptRequest.mutateAsync(requestId)
      toast.success("You're connected! 🔥")
      refetchRequests()
      refetchCircle()
    } catch {
      toast.error('Failed to accept request')
    }
  }

  const handleDeclineConnectionRequest = async (requestId: string) => {
    try {
      await declineRequest.mutateAsync(requestId)
      toast.info('Request declined')
      refetchRequests()
    } catch {
      toast.error('Failed to decline request')
    }
  }

  // Handle remove from circle
  const handleRemoveFromCircle = async (connectedUserId: string) => {
    if (!confirm('Remove from your circle? You can always add them back later.')) return
    try {
      await removeFromCircle.mutateAsync(connectedUserId)
      toast.info('Removed from circle')
      setSelectedCircleMember(null)
      refetchCircle()
    } catch {
      toast.error('Failed to remove from circle')
    }
  }

  // Count pending incoming requests
  const pendingRequestCount = connectionRequests?.incoming.length || 0

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Circle Chat View */}
      {selectedCircleMember ? (
        <div className="flex flex-col h-full relative z-10">
          {/* Circle Chat Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedCircleMember(null)}
              >
                <ArrowLeft size={20} />
              </Button>
              <button
                onClick={() => onUserClick?.(selectedCircleMember.connectedUserId)}
                className="focus:outline-none"
              >
                <Avatar className="h-10 w-10 ring-2 ring-amber-500/30">
                  <AvatarImage src={selectedCircleMember.connectedUserAvatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-foreground font-semibold">
                    {selectedCircleMember.connectedUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {selectedCircleMember.connectedUserName}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 border-0">
                    {getTrustFlames(selectedCircleMember.trustLevel)} Trust
                  </Badge>
                  {selectedCircleMember.metThroughFlareName && (
                    <span className="text-xs text-muted-foreground">
                      Met via: {selectedCircleMember.metThroughFlareName}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-red-400"
                onClick={() => handleRemoveFromCircle(selectedCircleMember.connectedUserId)}
              >
                Remove
              </Button>
            </div>
          </div>
          
          {/* Circle Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {circleMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Start a conversation with {selectedCircleMember.connectedUserName}!</p>
              </div>
            ) : (
              circleMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.senderAvatar || undefined} />
                    <AvatarFallback className="text-xs bg-amber-500/20 text-amber-400">
                      {msg.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${msg.senderId === user.id ? 'text-right' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {msg.senderId === user.id ? 'You' : msg.senderName}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                        msg.senderId === user.id
                          ? 'bg-amber-500 text-white rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Circle Chat Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={circleChatInput}
                onChange={(e) => setCircleChatInput(e.target.value)}
                onKeyDown={handleCircleChatKeyDown}
                className="flex-1 h-10 px-4 rounded-full border border-amber-500/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <Button
                size="icon"
                className="rounded-full h-10 w-10 bg-amber-500 hover:bg-amber-600"
                onClick={handleSendCircleMessage}
                disabled={!circleChatInput.trim() || sendCircleMessage.isPending}
              >
                <PaperPlaneRight size={18} weight="fill" />
              </Button>
            </div>
          </div>
        </div>
      ) : !selectedConversation ? (
        <>
          {/* Ambient Background */}
          <AmbientBackground variant="messages" />
          
          {/* Header */}
          <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent relative z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <ChatCircle size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'circle' 
                    ? `${circleConnections.length} in your circle`
                    : activeTab === 'requests'
                      ? `${pendingRequestCount} pending request${pendingRequestCount !== 1 ? 's' : ''}`
                      : myHelpRequests.length === 0 
                        ? 'No conversations yet' 
                        : `${pendingRequestsForMe.length} pending request${pendingRequestsForMe.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4 max-w-2xl mx-auto w-full relative z-10">
            <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/50">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'conversations'
                    ? 'bg-card text-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <ChatCircle size={14} weight={activeTab === 'conversations' ? 'duotone' : 'regular'} />
                Chats
                {pendingRequestsForMe.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {pendingRequestsForMe.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('circle')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'circle'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-md border border-amber-500/20'
                    : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <Fire size={14} weight={activeTab === 'circle' ? 'duotone' : 'regular'} />
                Circle
                {circleConnections.length > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    {circleConnections.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'requests'
                    ? 'bg-card text-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <UserCirclePlus size={14} weight={activeTab === 'requests' ? 'duotone' : 'regular'} />
                Requests
                {pendingRequestCount > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingRequestCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6 max-w-2xl mx-auto relative z-10">
              {/* Tab Content */}
              {activeTab === 'circle' ? (
                /* Circle Tab */
                <div className="space-y-3">
                  {circleConnections.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-6">
                        <Fire size={48} weight="duotone" className="text-amber-400 bounce-subtle" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Your Circle is Empty
                      </h3>
                      <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        Add neighbors to your Trust Circle to message them anytime - no flare needed!
                      </p>
                    </div>
                  ) : (
                    circleConnections.map((connection, index) => (
                      <Card
                        key={connection.id}
                        className="p-4 cursor-pointer card-hover border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => setSelectedCircleMember(connection)}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onUserClick?.(connection.connectedUserId)
                            }}
                            className="focus:outline-none"
                          >
                            <Avatar className="h-12 w-12 ring-2 ring-amber-500/30">
                              <AvatarImage src={connection.connectedUserAvatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-foreground font-semibold">
                                {connection.connectedUserName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {connection.connectedUserName}
                              </span>
                              <span className="text-sm">{getTrustFlames(connection.trustLevel)}</span>
                            </div>
                            {connection.metThroughFlareName && (
                              <p className="text-xs text-muted-foreground">
                                Met through: {connection.metThroughFlareName}
                              </p>
                            )}
                            {connection.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {connection.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : activeTab === 'requests' ? (
                /* Requests Tab */
                <div className="space-y-6">
                  {/* Incoming Requests */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <UserCirclePlus size={14} className="text-amber-400" />
                      Incoming Requests ({connectionRequests?.incoming.length || 0})
                    </h2>
                    {connectionRequests?.incoming.length === 0 ? (
                      <Card className="p-6 text-center bg-muted/20 border-dashed">
                        <p className="text-sm text-muted-foreground">
                          No pending requests
                        </p>
                      </Card>
                    ) : (
                      connectionRequests?.incoming.map((request, index) => (
                        <Card
                          key={request.id}
                          className="p-4 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 fade-in-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => onUserClick?.(request.fromUserId)}
                              className="focus:outline-none"
                            >
                              <Avatar className="h-12 w-12 ring-2 ring-amber-500/30">
                                <AvatarImage src={request.fromUserAvatar || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-foreground font-semibold">
                                  {(request.fromUserName || 'A').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground">
                                  {request.fromUserName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgoFromString(request.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                wants to add you to their circle
                              </p>
                              {request.flareName && (
                                <div className="flex items-center gap-2 text-xs bg-muted/30 px-2 py-1 rounded-md w-fit">
                                  <Fire size={14} className="text-amber-400" />
                                  <span className="text-foreground">Met via: {request.flareName}</span>
                                </div>
                              )}
                              {request.message && (
                                <div className="bg-card/80 rounded-xl p-3 mt-2 border border-border/50">
                                  <p className="text-sm text-foreground italic">
                                    "{request.message}"
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="gap-2 rounded-xl flex-1 bg-amber-500 hover:bg-amber-600"
                                  onClick={() => handleAcceptConnectionRequest(request.id)}
                                  disabled={acceptRequest.isPending}
                                >
                                  <Check size={16} weight="bold" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 rounded-xl"
                                  onClick={() => handleDeclineConnectionRequest(request.id)}
                                  disabled={declineRequest.isPending}
                                >
                                  <X size={16} weight="bold" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Outgoing Requests */}
                  {(connectionRequests?.outgoing.length || 0) > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Hourglass size={14} className="text-muted-foreground" />
                        Sent Requests ({connectionRequests?.outgoing.filter(r => r.status === 'pending').length || 0})
                      </h2>
                      {connectionRequests?.outgoing.filter(r => r.status === 'pending').map((request, index) => (
                        <Card
                          key={request.id}
                          className="p-4 border-border/50 bg-muted/20 fade-in-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onUserClick?.(request.toUserId)}
                              className="focus:outline-none"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={request.toUserAvatar || undefined} />
                                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                  {(request.toUserName || 'A').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1">
                              <span className="font-medium text-foreground">
                                {request.toUserName}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Waiting for response...
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                              <Hourglass size={12} className="mr-1" />
                              Pending
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Conversations Tab - Original Content */
                <>
              {/* Announcements Section */}
              {announcements.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Megaphone size={14} className="text-amber-400" />
                    Announcements ({announcements.filter(a => !a.recipient?.read_at).length} unread)
                  </h2>
                  {announcements.map((announcement, index) => {
                    const isUnread = !announcement.recipient?.read_at
                    const hasGift = announcement.gift_amount > 0
                    const giftClaimed = announcement.recipient?.gift_claimed
                    
                    return (
                      <Card 
                        key={announcement.id} 
                        className={`p-4 card-hover fade-in-up ${
                          hasGift && !giftClaimed 
                            ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5' 
                            : isUnread 
                              ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5'
                              : 'bg-card/80 border-border/50'
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => markAnnouncementAsRead(announcement.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className={`h-12 w-12 ring-2 ${hasGift && !giftClaimed ? 'ring-amber-500/30' : isUnread ? 'ring-primary/30' : 'ring-border'}`}>
                            <AvatarImage src={announcement.sender_avatar || undefined} />
                            <AvatarFallback className={`font-semibold ${hasGift && !giftClaimed ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-300' : 'bg-gradient-to-br from-primary/30 to-accent/20 text-foreground'}`}>
                              {(announcement.sender_name || 'A').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground">
                                  {announcement.title}
                                </span>
                                {isUnread && (
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                    New
                                  </Badge>
                                )}
                                {hasGift && (
                                  <Badge className={`text-xs ${giftClaimed ? 'bg-muted text-muted-foreground border-muted' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                    <Gift size={10} className="mr-1" />
                                    {giftClaimed ? 'Claimed' : `${announcement.gift_amount} 🏮`}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {announcement.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                from {announcement.sender_name}
                              </span>
                              {hasGift && !giftClaimed && (
                                <Button 
                                  size="sm"
                                  className="gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    claimAnnouncementGift(announcement)
                                  }}
                                  disabled={claimingGift === announcement.id}
                                >
                                  <Gift size={14} />
                                  {claimingGift === announcement.id ? 'Claiming...' : 'Claim Gift 🎁'}
                                </Button>
                              )}
                              {hasGift && giftClaimed && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                                  <CheckFat size={12} className="text-green-500" />
                                  Gift Claimed ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Pending Help Requests ON MY FLARES Section */}
              {pendingRequestsForMe.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    Neighbors Want to Help ({pendingRequestsForMe.length})
                  </h2>
                  {pendingRequestsForMe.map((hr, index) => {
                    const flare = getFlareForRequest(hr)
                    return (
                      <Card 
                        key={hr.id} 
                        className="p-4 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 card-hover fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground font-semibold">
                              {hr.helperUsername.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground flex items-center gap-2">
                                {hr.helperUsername}
                                <HandHeart size={16} className="text-primary" />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(hr.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              wants to help with your flare
                            </p>
                            {flare && (
                              <div className="flex items-center gap-2 text-xs bg-muted/30 px-2 py-1 rounded-md w-fit">
                                <Fire size={14} className="text-primary" />
                                <span className="text-foreground font-medium">{flare.category}</span>
                              </div>
                            )}
                            {hr.message && (
                              <div className="bg-card/80 rounded-xl p-3 mt-2 border border-border/50">
                                <p className="text-sm text-foreground italic">
                                  "{hr.message}"
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="gap-2 rounded-xl flex-1 sm:flex-none"
                                onClick={() => onAcceptHelp(hr.id)}
                              >
                                <Check size={16} weight="bold" />
                                Accept Help
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2 rounded-xl"
                                onClick={() => onDenyHelp(hr.id)}
                              >
                                <X size={16} weight="bold" />
                                Decline
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <Lamp size={12} />
                              1 Lantern will be sent when task is complete
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* My Pending Offers (waiting for response) */}
              {myPendingOffers.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Hourglass size={14} className="text-amber-400" />
                    Your Pending Offers ({myPendingOffers.length})
                  </h2>
                  {myPendingOffers.map(hr => {
                    const flare = getFlareForRequest(hr)
                    return (
                      <Card key={hr.id} className="p-4 border-yellow-500/30 bg-yellow-500/5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-yellow-500/20 text-yellow-500 font-semibold">
                              {hr.flareOwnerUsername.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {hr.flareOwnerUsername}
                              </span>
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">
                                <Hourglass size={12} className="mr-1" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              You offered to help with:
                            </p>
                            {flare && (
                              <div className="flex items-center gap-2 text-xs">
                                <Fire size={14} className="text-primary" />
                                <span className="text-foreground">{flare.category}</span>
                                <span className="text-muted-foreground truncate">
                                  - {flare.description.slice(0, 50)}...
                                </span>
                              </div>
                            )}
                            {hr.message && (
                              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                                <p className="text-sm text-foreground italic">
                                  Your message: "{hr.message}"
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Waiting for {hr.flareOwnerUsername} to respond...
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* My Denied Offers */}
              {myDeniedOffers.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <XCircle size={14} className="text-muted-foreground" />
                    Declined ({myDeniedOffers.length})
                  </h2>
                  {myDeniedOffers.map(hr => {
                    const flare = getFlareForRequest(hr)
                    return (
                      <Card key={hr.id} className="p-4 border-muted bg-muted/20 opacity-60">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                              {hr.flareOwnerUsername.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-muted-foreground">
                                {hr.flareOwnerUsername}
                              </span>
                              <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                                <XCircle size={12} className="mr-1" />
                                Declined
                              </Badge>
                            </div>
                            {flare && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Fire size={14} />
                                <span>{flare.category}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Your offer was declined. Don't worry, there are other ways to help!
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Active Conversations Section */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <ChatCircle size={14} />
                  Active Conversations ({activeConversations.length})
                </h2>
                {activeConversations.length === 0 && pendingRequestsForMe.length === 0 && myPendingOffers.length === 0 && myDeniedOffers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 mb-6">
                      <ChatCircle size={48} weight="duotone" className="text-primary bounce-subtle" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Your inbox is empty
                    </h3>
                    <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      When you offer to help with a flare or someone offers to help you, conversations will appear here.
                    </p>
                  </div>
                ) : activeConversations.length === 0 ? (
                  <Card className="p-6 text-center bg-muted/20 border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No active conversations yet — accept a help request to start chatting!
                    </p>
                  </Card>
                ) : (
                  activeConversations.map((hr, index) => {
                    const flare = getFlareForRequest(hr)
                    const other = getOtherParticipant(hr)
                    const lastMessage = getChatMessages(hr.id).slice(-1)[0]
                    const isFlareOwner = hr.flareOwnerId === user.id
                    
                    return (
                      <Card 
                        key={hr.id} 
                        className="p-4 cursor-pointer card-hover border-border/50 bg-card/80 fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => setSelectedConversation(hr)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground font-semibold">
                              {other.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {other.username}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {lastMessage ? getTimeAgo(lastMessage.timestamp) : getTimeAgo(hr.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs rounded-md">
                                {flare?.category || 'Flare'}
                              </Badge>
                              {isFlareOwner ? (
                                <Badge variant="outline" className="text-xs border-primary/30 text-primary rounded-md">
                                  <Sparkle size={10} className="mr-1" />
                                  Your Flare
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-success/30 text-success rounded-md">
                                  <HandHeart size={10} className="mr-1" />
                                  Helping
                                </Badge>
                              )}
                              {flare?.status === 'completed' && (
                                <Badge variant="outline" className="text-xs border-muted text-muted-foreground rounded-md">
                                  ✅ Done
                                </Badge>
                              )}
                            </div>
                            {lastMessage && (
                              <p className="text-sm text-muted-foreground truncate mt-2">
                                {lastMessage.userId === user.id ? 'You: ' : ''}{lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
                </>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        // Chat View
        <div className="flex flex-col h-full relative z-10">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft size={20} />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getOtherParticipant(selectedConversation).username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {getOtherParticipant(selectedConversation).username}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getFlareForRequest(selectedConversation)?.category || 'Flare'}
                  </Badge>
                  {selectedConversation.flareOwnerId === user.id ? (
                    <span className="text-xs text-blue-500">Your Flare</span>
                  ) : (
                    <span className="text-xs text-green-500">You're Helping</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Flare description */}
            {(() => {
              const flare = getFlareForRequest(selectedConversation)
              if (!flare) return null
              return (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground">{flare.description}</p>
                </div>
              )
            })()}

            {(() => {
              const flare = getFlareForRequest(selectedConversation)
              if (!flare) return null
              if (flare.userId === user.id && flare.status !== 'completed') {
                return (
                  <div className="mt-3">
                    <Button 
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleCompleteTask}
                    >
                      <CheckCircle size={16} weight="fill" />
                      Mark Complete
                      <Coins size={14} className="text-yellow-300" />
                    </Button>
                  </div>
                )
              }
              return null
            })()}
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Initial help request message */}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {selectedConversation.helperUsername.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[75%]">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedConversation.helperId === user.id ? 'You' : selectedConversation.helperUsername}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(selectedConversation.createdAt)}
                  </span>
                </div>
                <div className="inline-block px-3 py-2 rounded-2xl text-sm bg-muted text-foreground rounded-bl-md">
                  {selectedConversation.message || "I'd like to help!"}
                </div>
              </div>
            </div>

            {getChatMessages(selectedConversation.id).map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {msg.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${msg.userId === user.id ? 'text-right' : ''}`}>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.userId === user.id ? 'You' : msg.username}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                      msg.userId === user.id
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-border bg-card">
            {(() => {
              const flare = getFlareForRequest(selectedConversation)
              if (flare?.status === 'completed') {
                return (
                  <div className="text-center py-2 text-muted-foreground text-sm">
                    ✅ This task has been completed
                  </div>
                )
              }
              return (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                  </Button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
