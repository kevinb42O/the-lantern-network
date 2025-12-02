import { useState } from 'react'
import { Plus, MapPin, Clock, Users, Wrench, Hamburger, Chat, Lightbulb, HandWaving, Sparkle, Fire, Hourglass, CheckCircle, XCircle, Gift, Coin, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { User, HelpRequest } from '@/lib/types'

// Flare from Supabase
interface FlareData {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  vibe_tags: string[]
  location: { lat: number; lng: number } | null
  radius_miles: number
  max_participants: number | null
  current_participants: number
  lantern_cost: number
  starts_at: string
  ends_at: string | null
  status: string
  created_at: string
  creator_name?: string
  flare_type?: 'request' | 'offer'
  is_free?: boolean
}

type FilterTab = 'all' | 'requests' | 'offers'

interface FlaresViewProps {
  user: User
  flares: FlareData[]
  helpRequests: HelpRequest[]
  onCreateFlare: (flare: {
    title: string
    description: string
    category: string
    location: { lat: number; lng: number } | null
    flare_type: 'request' | 'offer'
    is_free: boolean
  }) => Promise<void>
  onJoinFlare: (flareId: string, message: string) => Promise<void>
  onUserClick?: (userId: string) => void
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; emoji: string; requestGradient: string; offerGradient: string }> = {
  Mechanical: { 
    icon: Wrench, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    emoji: '🔧',
    requestGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    offerGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  Food: { 
    icon: Hamburger, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    emoji: '🍲',
    requestGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    offerGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  Talk: { 
    icon: Chat, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    emoji: '💬',
    requestGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    offerGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  Other: { 
    icon: Lightbulb, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    emoji: '💡',
    requestGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    offerGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  }
}

const categories = ['Mechanical', 'Food', 'Talk', 'Other']

export function FlaresView({ user, flares, helpRequests, onCreateFlare, onJoinFlare, onUserClick }: FlaresViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [category, setCategory] = useState('Other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [useLocation, setUseLocation] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // New state for flare type and offers
  const [flareType, setFlareType] = useState<'request' | 'offer'>('request')
  const [isFree, setIsFree] = useState(false)
  const [createStep, setCreateStep] = useState<'type' | 'details'>('type')
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Help offer modal state
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [helpFlare, setHelpFlare] = useState<FlareData | null>(null)
  const [helpMessage, setHelpMessage] = useState('')
  const [sendingHelp, setSendingHelp] = useState(false)

  // Check if user already sent a help request for a flare
  const hasAlreadyOfferedHelp = (flareId: string): boolean => {
    return helpRequests.some(
      hr => hr.flareId === flareId && hr.helperId === user.id
    )
  }

  // Get help request status for a flare
  const getHelpRequestStatus = (flareId: string): HelpRequest | undefined => {
    return helpRequests.find(
      hr => hr.flareId === flareId && hr.helperId === user.id
    )
  }

  // Get user location when creating flare
  const handleOpenCreate = () => {
    setShowCreateModal(true)
    setCreateStep('type')
    setFlareType('request')
    setIsFree(false)
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      )
    }
  }

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return
    
    setCreating(true)
    try {
      await onCreateFlare({
        title: title.trim(),
        description: description.trim(),
        category,
        location: useLocation ? userLocation : null,
        flare_type: flareType,
        is_free: isFree
      })
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setCategory('Other')
      setFlareType('request')
      setIsFree(false)
      setCreateStep('type')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenHelpModal = (flare: FlareData) => {
    // Check if user already offered help
    if (hasAlreadyOfferedHelp(flare.id)) {
      const status = getHelpRequestStatus(flare.id)
      if (status?.status === 'pending') {
        toast.info('Your offer is pending. Check Messages for updates.')
      } else if (status?.status === 'accepted') {
        toast.info('Your offer was accepted! Check Messages to chat.')
      } else if (status?.status === 'denied') {
        toast.info('Your offer was declined.')
      }
      return
    }
    setHelpFlare(flare)
    setHelpMessage('')
    setShowHelpModal(true)
  }

  const handleSendHelpOffer = async () => {
    if (!helpFlare) return
    
    if (!helpMessage.trim()) {
      toast.error('Please write a message to introduce yourself')
      return
    }
    
    setSendingHelp(true)
    try {
      await onJoinFlare(helpFlare.id, helpMessage.trim())
      setShowHelpModal(false)
      setHelpFlare(null)
      setHelpMessage('')
    } finally {
      setSendingHelp(false)
    }
  }

  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Check if post is recent (less than 5 minutes)
  const isRecent = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    return seconds < 300
  }

  const activeFlares = flares.filter(f => f.status === 'active')
  
  // Filter flares based on active tab
  const filteredFlares = activeFlares.filter(flare => {
    const type = flare.flare_type || 'request'
    if (activeFilter === 'all') return true
    if (activeFilter === 'requests') return type === 'request'
    if (activeFilter === 'offers') return type === 'offer'
    return true
  })

  // Count for tabs
  const requestCount = activeFlares.filter(f => (f.flare_type || 'request') === 'request').length
  const offerCount = activeFlares.filter(f => f.flare_type === 'offer').length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15">
              <Fire size={24} weight="duotone" className="text-primary lantern-glow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Neighborhood Flares</h1>
              <p className="text-sm text-muted-foreground">
                {activeFlares.length === 0 
                  ? "No active flares right now" 
                  : `${requestCount} request${requestCount !== 1 ? 's' : ''} • ${offerCount} offer${offerCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 btn-glow rounded-xl shadow-lg shadow-primary/20">
            <Plus size={18} weight="bold" />
            <span className="hidden sm:inline">Light Flare</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 p-1 rounded-xl bg-muted/30 border border-border/50">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-card text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Fire size={16} weight={activeFilter === 'all' ? 'duotone' : 'regular'} />
            All
            {activeFlares.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {activeFlares.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('requests')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'requests'
                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 shadow-md border border-orange-500/20'
                : 'text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10'
            }`}
          >
            <HandWaving size={16} weight={activeFilter === 'requests' ? 'duotone' : 'regular'} />
            Requests
            {requestCount > 0 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                {requestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('offers')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'offers'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-md border border-emerald-500/20'
                : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Gift size={16} weight={activeFilter === 'offers' ? 'duotone' : 'regular'} />
            Offers
            {offerCount > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                {offerCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Flares List */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4 max-w-2xl mx-auto">
          {filteredFlares.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 mb-6">
                <Sparkle size={48} weight="duotone" className="text-primary bounce-subtle" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {activeFilter === 'offers' 
                  ? 'No offers yet'
                  : activeFilter === 'requests'
                    ? 'No requests right now'
                    : 'Your neighborhood is quiet'
                }
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                {activeFilter === 'offers'
                  ? 'Be the first to share something with your neighbors!'
                  : activeFilter === 'requests'
                    ? 'No one needs help right now. Check back soon!'
                    : 'Be the first to light a flare and bring neighbors together!'
                }
              </p>
              <Button onClick={handleOpenCreate} size="lg" className="gap-2 rounded-xl btn-glow">
                <Fire size={20} weight="duotone" />
                Light the First Flare
              </Button>
            </div>
          ) : (
            filteredFlares.map((flare, index) => {
              const config = categoryConfig[flare.category] || categoryConfig.Other
              const CategoryIcon = config.icon
              const isOwner = flare.creator_id === user.id
              const isOffer = flare.flare_type === 'offer'
              const isFreefree = flare.is_free === true
              const recentPost = isRecent(flare.created_at)

              return (
                <Card 
                  key={flare.id} 
                  className={`overflow-hidden card-hover border-border/50 fade-in-up relative ${
                    isOffer 
                      ? 'bg-gradient-to-br from-emerald-500/5 via-card/95 to-card border-l-2 border-l-emerald-500/50' 
                      : 'bg-gradient-to-br from-orange-500/5 via-card/95 to-card border-l-2 border-l-orange-500/50'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Flare Type Badge - Top Right */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-semibold ${
                        isOffer 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {isOffer ? (
                        <>
                          <Gift size={12} weight="duotone" className="mr-1" />
                          OFFER
                        </>
                      ) : (
                        <>
                          <Fire size={12} weight="duotone" className="mr-1" />
                          REQUEST
                        </>
                      )}
                    </Badge>
                  </div>

                  <CardContent className="p-5">
                    {/* Hero Category Icon */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3.5 rounded-2xl ${
                        isOffer 
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 ring-2 ring-emerald-500/20' 
                          : 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 ring-2 ring-orange-500/20'
                      }`}>
                        <CategoryIcon 
                          size={28} 
                          weight="duotone" 
                          className={isOffer ? 'text-emerald-400' : config.color}
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-lg font-bold text-foreground leading-tight mb-1 line-clamp-2">
                          {flare.title}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                          {flare.description}
                        </p>
                      </div>
                    </div>

                    {/* User Info & Meta */}
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <button
                        onClick={() => onUserClick?.(flare.creator_id)}
                        className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
                        aria-label={`View ${flare.creator_name || 'user'}'s profile`}
                      >
                        <Avatar className={`h-10 w-10 ring-2 cursor-pointer ${
                          isOffer ? 'ring-emerald-500/30' : 'ring-orange-500/30'
                        }`}>
                          <AvatarFallback className={`font-semibold ${
                            isOffer 
                              ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-100' 
                              : 'bg-gradient-to-br from-orange-500/30 to-amber-500/20 text-orange-100'
                          }`}>
                            {(flare.creator_name || 'A').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onUserClick?.(flare.creator_id)}
                          className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer text-sm"
                          aria-label={`View ${flare.creator_name || 'user'}'s profile`}
                        >
                          {flare.creator_name || 'Anonymous'}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`flex items-center gap-1 ${recentPost ? 'text-green-400' : ''}`}>
                            <Clock size={11} className={recentPost ? 'animate-pulse' : ''} />
                            {timeAgo(flare.created_at)}
                          </span>
                          {flare.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                Nearby
                              </span>
                            </>
                          )}
                          {isOffer && (
                            <>
                              <span>•</span>
                              <span className={`flex items-center gap-1 ${isFreefree ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isFreefree ? (
                                  <>
                                    <Heart size={11} weight="fill" />
                                    Free
                                  </>
                                ) : (
                                  <>
                                    <Coin size={11} weight="fill" />
                                    1 Token
                                  </>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${config.bgColor} ${config.color} border shrink-0 gap-1 px-2 py-0.5 text-xs`}
                      >
                        <span>{config.emoji}</span>
                        <span className="hidden sm:inline">{flare.category}</span>
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {flare.max_participants && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <Users size={12} />
                            {flare.current_participants}/{flare.max_participants}
                          </span>
                        )}
                      </div>
                      
                      {!isOwner ? (
                        (() => {
                          const helpStatus = getHelpRequestStatus(flare.id)
                          if (helpStatus?.status === 'pending') {
                            return (
                              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30 gap-1.5 py-1.5 px-3">
                                <Hourglass size={14} />
                                Pending
                              </Badge>
                            )
                          } else if (helpStatus?.status === 'accepted') {
                            return (
                              <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 gap-1.5 py-1.5 px-3">
                                <CheckCircle size={14} weight="fill" />
                                Accepted
                              </Badge>
                            )
                          } else if (helpStatus?.status === 'denied') {
                            return (
                              <Badge variant="outline" className="text-xs text-muted-foreground gap-1.5 py-1.5 px-3">
                                <XCircle size={14} />
                                Declined
                              </Badge>
                            )
                          }
                          return (
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenHelpModal(flare)}
                              className={`gap-2 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 ${
                                isOffer
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-500/20'
                              }`}
                            >
                              {isOffer ? (
                                <>
                                  <Gift size={16} weight="duotone" />
                                  {isFreefree ? '🎁 Claim Gift' : '🙋 Claim This'}
                                </>
                              ) : (
                                <>
                                  <HandWaving size={16} weight="duotone" />
                                  🤝 I Can Help
                                </>
                              )}
                            </Button>
                          )
                        })()
                      ) : (
                        <Badge variant="secondary" className={`text-xs border-0 py-1.5 px-3 ${
                          isOffer
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          <Sparkle size={12} className="mr-1" />
                          Your {isOffer ? 'Offer' : 'Flare'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Help/Claim Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {helpFlare?.flare_type === 'offer' ? (
                <>
                  <Gift size={24} weight="duotone" className="text-emerald-400" />
                  Claim This Offer
                </>
              ) : (
                <>
                  <HandWaving size={24} weight="duotone" className="text-primary" />
                  Offer Your Help
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {helpFlare?.flare_type === 'offer' 
                ? 'Let them know you\'re interested'
                : 'Let them know you\'re here to help'
              }
            </DialogDescription>
          </DialogHeader>
          
          {helpFlare && (
            <div className="space-y-5 py-2">
              {/* Flare Summary */}
              <div className={`p-4 rounded-xl border ${
                helpFlare.flare_type === 'offer'
                  ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20'
                  : 'bg-gradient-to-br from-muted/50 to-muted/30 border-border/50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{categoryConfig[helpFlare.category]?.emoji || '💡'}</span>
                  <span className="text-sm font-medium text-foreground">{helpFlare.category}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{helpFlare.creator_name}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{helpFlare.title}</p>
                {helpFlare.flare_type === 'offer' && (
                  <div className="mt-2 flex items-center gap-2">
                    {helpFlare.is_free ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                        <Heart size={12} weight="fill" className="mr-1" />
                        Free Gift
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                        <Coin size={12} weight="fill" className="mr-1" />
                        1 Token
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="help-message" className="text-sm font-medium flex items-center gap-2">
                  <Chat size={14} className="text-muted-foreground" />
                  Your message
                </Label>
                <Textarea
                  id="help-message"
                  placeholder={helpFlare.flare_type === 'offer' 
                    ? "Hi! I'd love to claim this. Here's how to reach me..."
                    : "Hi! I'd love to help you with this. I have experience with..."
                  }
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="resize-none rounded-xl"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {helpMessage.length}/300
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowHelpModal(false)}
                >
                  Maybe Later
                </Button>
                <Button
                  className={`flex-1 rounded-xl ${
                    helpFlare.flare_type === 'offer'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                      : 'btn-glow'
                  }`}
                  onClick={handleSendHelpOffer}
                  disabled={!helpMessage.trim() || sendingHelp}
                >
                  {sendingHelp ? 'Sending...' : helpFlare.flare_type === 'offer' ? '🎁 Send Request' : '🤝 Send Offer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Flare Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open)
        if (!open) {
          setCreateStep('type')
          setFlareType('request')
          setIsFree(false)
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {createStep === 'type' ? (
                <>
                  <Fire size={24} weight="duotone" className="text-primary" />
                  Light a Flare
                </>
              ) : flareType === 'offer' ? (
                <>
                  <Gift size={24} weight="duotone" className="text-emerald-400" />
                  Share an Offer
                </>
              ) : (
                <>
                  <HandWaving size={24} weight="duotone" className="text-orange-400" />
                  Ask for Help
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {createStep === 'type' 
                ? 'What would you like to do?'
                : flareType === 'offer'
                  ? 'Share something with your neighbors'
                  : 'Ask your neighbors for help'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {createStep === 'type' ? (
              /* Step 1: Choose Type */
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFlareType('request')
                    setCreateStep('details')
                  }}
                  className="p-6 rounded-2xl border-2 border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-200 flex flex-col items-center gap-3 group"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 group-hover:scale-110 transition-transform">
                    <Fire size={32} weight="duotone" className="text-orange-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-foreground mb-1">Ask for Help</h3>
                    <p className="text-xs text-muted-foreground">
                      Need a neighbor to help you
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlareType('offer')
                    setCreateStep('details')
                  }}
                  className="p-6 rounded-2xl border-2 border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 flex flex-col items-center gap-3 group"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 group-hover:scale-110 transition-transform">
                    <Gift size={32} weight="duotone" className="text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-foreground mb-1">Offer Something</h3>
                    <p className="text-xs text-muted-foreground">
                      Share something with neighbors
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* Step 2: Details */
              <>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setCreateStep('type')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  ← Back to type selection
                </button>

                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {flareType === 'offer' ? 'What are you offering?' : 'What do you need help with?'}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => {
                      const catConfig = categoryConfig[cat]
                      const CatIcon = catConfig.icon
                      const isSelected = category === cat
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-200
                            flex flex-col items-center gap-2
                            ${isSelected 
                              ? flareType === 'offer'
                                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-lg shadow-emerald-500/10' 
                                : 'border-orange-500 bg-orange-500/10 scale-[1.02] shadow-lg shadow-orange-500/10'
                              : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                            }
                          `}
                        >
                          <div className={`p-2 rounded-lg ${
                            isSelected 
                              ? flareType === 'offer' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                              : 'bg-muted/50'
                          }`}>
                            <CatIcon 
                              size={24} 
                              weight={isSelected ? 'duotone' : 'regular'}
                              className={isSelected 
                                ? flareType === 'offer' ? 'text-emerald-400' : 'text-orange-400'
                                : 'text-muted-foreground'
                              }
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            isSelected 
                              ? flareType === 'offer' ? 'text-emerald-400' : 'text-orange-400'
                              : 'text-foreground'
                          }`}>
                            {catConfig.emoji} {cat}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Quick summary
                  </Label>
                  <input
                    id="title"
                    type="text"
                    placeholder={flareType === 'offer' 
                      ? "What are you offering? e.g., 'Extra lasagna to share'"
                      : "What do you need? e.g., 'Need help moving a couch'"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className={`w-full h-11 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                      flareType === 'offer'
                        ? 'border-emerald-500/30 focus:ring-emerald-500/50 focus:border-emerald-500'
                        : 'border-input focus:ring-primary/50 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Tell us more
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={flareType === 'offer'
                      ? "Describe what you're offering, when it's available, any conditions..."
                      : "Share more details so neighbors know how to help..."
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="resize-none rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/500
                  </p>
                </div>

                {/* Free Toggle (only for offers) */}
                {flareType === 'offer' && (
                  <div className={`p-4 rounded-xl border ${
                    isFree 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/30'
                      : 'bg-muted/30 border-border/50'
                  }`}>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Heart size={16} className="text-emerald-400" />
                      How do you want to share this?
                    </Label>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsFree(true)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          isFree
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-border/50 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isFree ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'
                          }`}>
                            {isFree && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              🎁 Free Gift
                            </div>
                            <p className="text-xs text-muted-foreground">
                              No token needed - pure generosity!
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFree(false)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          !isFree
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-border/50 hover:border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            !isFree ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground'
                          }`}>
                            {!isFree && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              🪙 Token Exchange
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recipient spends 1 token to claim
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Location Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <MapPin size={18} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="location-toggle" className="text-sm font-medium cursor-pointer">
                        Share my location
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Helps nearby neighbors find you
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="location-toggle"
                    checked={useLocation}
                    onCheckedChange={setUseLocation}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 rounded-xl ${
                      flareType === 'offer'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500'
                    }`}
                    onClick={handleCreate}
                    disabled={!title.trim() || !description.trim() || creating}
                  >
                    {creating ? 'Posting...' : flareType === 'offer' ? '🎁 Post Offer' : '🔥 Post Request'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
