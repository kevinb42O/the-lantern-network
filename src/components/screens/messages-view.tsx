import { useState } from 'react'
import { ChatCircle, Check, X, PaperPlaneRight, Fire, Coins, ArrowLeft, Clock, CheckCircle, Hourglass, XCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
}

export function MessagesView({ 
  user, 
  flares, 
  messages, 
  helpRequests,
  onAcceptHelp,
  onDenyHelp,
  onSendMessage,
  onCompleteFlare
}: MessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<HelpRequest | null>(null)
  const [chatInput, setChatInput] = useState('')

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
          <div className="p-4 border-b border-border">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-xl font-semibold text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Help requests and conversations
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6 max-w-2xl mx-auto">
              {/* Pending Help Requests ON MY FLARES Section */}
              {pendingRequestsForMe.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Help Requests ({pendingRequestsForMe.length})
                  </h2>
                  {pendingRequestsForMe.map(hr => {
                    const flare = getFlareForRequest(hr)
                    return (
                      <Card key={hr.id} className="p-4 border-primary/30 bg-primary/5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {hr.helperUsername.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {hr.helperUsername}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(hr.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              wants to help with your flare:
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
                                  "{hr.message}"
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="gap-1.5"
                                onClick={() => onAcceptHelp(hr.id)}
                              >
                                <Check size={14} weight="bold" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1.5"
                                onClick={() => onDenyHelp(hr.id)}
                              >
                                <X size={14} weight="bold" />
                                Decline
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              Accepting will cost 1 Lantern when task is complete
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
                    <Hourglass size={14} className="text-yellow-500" />
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
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Active Conversations ({activeConversations.length})
                </h2>
                {activeConversations.length === 0 && pendingRequestsForMe.length === 0 && myPendingOffers.length === 0 && myDeniedOffers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
                      <ChatCircle size={48} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No messages yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      When you offer to help with a flare or someone offers to help you, conversations will appear here.
                    </p>
                  </div>
                ) : activeConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active conversations yet
                  </p>
                ) : (
                  activeConversations.map(hr => {
                    const flare = getFlareForRequest(hr)
                    const other = getOtherParticipant(hr)
                    const lastMessage = getChatMessages(hr.id).slice(-1)[0]
                    const isFlareOwner = hr.flareOwnerId === user.id
                    
                    return (
                      <Card 
                        key={hr.id} 
                        className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setSelectedConversation(hr)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs">
                                {flare?.category || 'Flare'}
                              </Badge>
                              {isFlareOwner ? (
                                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-500">
                                  Your Flare
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">
                                  Helping
                                </Badge>
                              )}
                              {flare?.status === 'completed' && (
                                <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                                  ✅ Completed
                                </Badge>
                              )}
                            </div>
                            {lastMessage && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
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
