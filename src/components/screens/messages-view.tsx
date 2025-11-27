import { useState, useEffect } from 'react'
import { ChatCircle, Check, X, PaperPlaneRight, Fire, Lamp, ArrowLeft, CheckCircle, Hourglass, XCircle, HandHeart, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User, Flare, Message, HelpRequest } from '@/lib/types'
import { toast } from 'sonner'

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
  onMarkAsRead
}: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<HelpRequest | null>(null)
  const [chatInput, setChatInput] = useState('')

  // Mark messages as read when component mounts
  useEffect(() => {
    if (onMarkAsRead) {
      onMarkAsRead()
    }
  }, [onMarkAsRead])

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

  const getOtherParticipant = (hr: HelpRequest) => {
    if (hr.flareOwnerId === user.id) {
      return { id: hr.helperId, username: hr.helperUsername }
    }
    return { id: hr.flareOwnerId, username: hr.flareOwnerUsername }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {!selectedConversation ? (
        <>
          {/* Header */}
          <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <ChatCircle size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  {myHelpRequests.length === 0 
                    ? 'No conversations yet' 
                    : `${pendingRequestsForMe.length} pending request${pendingRequestsForMe.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6 max-w-2xl mx-auto">
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
            </div>
          </ScrollArea>
        </>
      ) : (
        // Chat View
        <div className="flex flex-col h-full">
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
