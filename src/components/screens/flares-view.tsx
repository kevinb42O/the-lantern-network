import { useState } from 'react'
import { Plus, MapPin, Clock, Users, Wrench, Hamburger, Chat, Lightbulb, HandWaving, Sparkle, Fire, Hourglass, CheckCircle, XCircle, Gift, Coin, Heart, Camera, PaperPlaneTilt, Lock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { toast } from 'sonner'
import type { User, HelpRequest, Story, StoryReactionType } from '@/lib/types'
import { StoryCard } from '@/components/story-card'

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
  circle_only?: boolean
}

type FilterTab = 'all' | 'requests' | 'offers' | 'stories'

interface FlaresViewProps {
  user: User
  flares: FlareData[]
  helpRequests: HelpRequest[]
  stories?: Story[]
  circleMemberIds?: string[]
  onCreateFlare: (flare: {
    title: string
    description: string
    category: string
    location: { lat: number; lng: number } | null
    flare_type: 'request' | 'offer'
    is_free: boolean
    circle_only: boolean
  }) => Promise<void>
  onJoinFlare: (flareId: string, message: string) => Promise<void>
  onCreateStory?: (content: string, photoUrl?: string) => Promise<void>
  onStoryReaction?: (storyId: string, reaction: StoryReactionType) => void
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

export function FlaresView({ user, flares, helpRequests, stories = [], circleMemberIds = [], onCreateFlare, onJoinFlare, onCreateStory, onStoryReaction, onUserClick }: FlaresViewProps) {
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
  const [circleOnly, setCircleOnly] = useState(false)
  const [createStep, setCreateStep] = useState<'type' | 'details' | 'story'>('type')
  
  // Story creation state
  const [storyContent, setStoryContent] = useState('')
  
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
        is_free: isFree,
        circle_only: circleOnly
      })
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setCategory('Other')
      setFlareType('request')
      setIsFree(false)
      setCircleOnly(false)
      setCreateStep('type')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateStory = async () => {
    if (!storyContent.trim() || !onCreateStory) return
    
    setCreating(true)
    try {
      await onCreateStory(storyContent.trim())
      setShowCreateModal(false)
      setStoryContent('')
      setCreateStep('type')
      toast.success('Story shared with neighbors!')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenHelpModal = (flare: FlareData) => {
    // Check if user already offered help
    if (hasAlreadyOfferedHelp(flare.id)) {
      const status = getHelpRequestStatus(flare.id)
      if (status?.status === 'pending') {
        toast.info('Je aanbod is in afwachting. Kijk in Gesprekken voor updates.')
      } else if (status?.status === 'accepted') {
        toast.info('Je aanbod werd geaccepteerd! Kijk in Gesprekken om te chatten.')
      } else if (status?.status === 'denied') {
        toast.info('Je aanbod werd geweigerd.')
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
      toast.error('Schrijf een bericht om jezelf voor te stellen')
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
    if (seconds < 60) return 'zojuist'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m geleden`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}u geleden`
    return `${Math.floor(seconds / 86400)}d geleden`
  }

  // Check if post is recent (less than 5 minutes)
  const isRecent = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    return seconds < 300
  }

  // Convert circleMemberIds to a Set for O(1) lookup performance
  const circleMemberSet = new Set(circleMemberIds)

  // Filter out circle-only flares that user shouldn't see
  const visibleFlares = flares.filter(f => {
    // Always show user's own flares
    if (f.creator_id === user.id) return true
    // If flare is circle_only, only show if creator is in user's circle
    if (f.circle_only) {
      return circleMemberSet.has(f.creator_id)
    }
    return true
  })

  const activeFlares = visibleFlares.filter(f => f.status === 'active')
  
  // Filter flares based on active tab
  const filteredFlares = activeFilter === 'stories' ? [] : activeFlares.filter(flare => {
    const type = flare.flare_type || 'request'
    if (activeFilter === 'all') return true
    if (activeFilter === 'requests') return type === 'request'
    if (activeFilter === 'offers') return type === 'offer'
    return true
  })

  // Count for tabs
  const requestCount = activeFlares.filter(f => (f.flare_type || 'request') === 'request').length
  const offerCount = activeFlares.filter(f => f.flare_type === 'offer').length
  const storyCount = stories.length

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
              <h1 className="text-2xl font-bold text-foreground">Lichtjes in de Buurt</h1>
              <p className="text-sm text-muted-foreground">
                {activeFlares.length === 0 && storyCount === 0
                  ? "Momenteel geen actieve lichtjes" 
                  : `${requestCount} ${requestCount !== 1 ? 'vragen' : 'vraag'} • ${offerCount} ${offerCount !== 1 ? 'aanbiedingen' : 'aanbieding'} • ${storyCount} ${storyCount !== 1 ? 'verhalen' : 'verhaal'}`
                }
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 btn-glow rounded-xl shadow-lg shadow-primary/20">
            <Plus size={18} weight="bold" />
            <span className="hidden sm:inline">Nieuw</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/50 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-card text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Fire size={14} weight={activeFilter === 'all' ? 'duotone' : 'regular'} />
            Alles
            {activeFlares.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {activeFlares.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeFilter === 'requests'
                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 shadow-md border border-orange-500/20'
                : 'text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10'
            }`}
          >
            <HandWaving size={14} weight={activeFilter === 'requests' ? 'duotone' : 'regular'} />
            <span className="hidden sm:inline">Vragen</span>
            <span className="sm:hidden">Hulp</span>
            {requestCount > 0 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                {requestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('offers')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeFilter === 'offers'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-md border border-emerald-500/20'
                : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <Gift size={14} weight={activeFilter === 'offers' ? 'duotone' : 'regular'} />
            Aanbiedingen
            {offerCount > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                {offerCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('stories')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeFilter === 'stories'
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-md border border-amber-500/20'
                : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Camera size={14} weight={activeFilter === 'stories' ? 'duotone' : 'regular'} />
            Verhalen
            {storyCount > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {storyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Flares List */}
      <div className="flex-1 overflow-y-auto p-4 pb-8 relative">
        <AmbientBackground variant="flares" />
        <div className="space-y-4 max-w-2xl mx-auto relative z-10">
          {/* Stories Tab - show only stories */}
          {activeFilter === 'stories' ? (
            stories.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-6">
                  <Camera size={48} weight="duotone" className="text-amber-400 bounce-subtle" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Nog geen verhalen
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                  Deel een moment uit de buurt! Verhalen verdwijnen na 48 uur.
                </p>
                <Button onClick={handleOpenCreate} size="lg" className="gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500">
                  <Camera size={20} weight="duotone" />
                  Deel een moment
                </Button>
              </div>
            ) : (
              stories.map((story, index) => (
                <div key={story.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <StoryCard
                    story={story}
                    isOwner={story.creatorId === user.id}
                    onReaction={onStoryReaction}
                    onUserClick={onUserClick}
                  />
                </div>
              ))
            )
          ) : filteredFlares.length === 0 && (activeFilter !== 'all' || stories.length === 0) ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 mb-6">
                <Sparkle size={48} weight="duotone" className="text-primary bounce-subtle" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {activeFilter === 'offers' 
                  ? 'Nog geen aanbiedingen'
                  : activeFilter === 'requests'
                    ? 'Momenteel geen hulpvragen'
                    : 'De buurt is rustig'
                }
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                {activeFilter === 'offers'
                  ? 'Wees de eerste om iets te delen met je buren!'
                  : activeFilter === 'requests'
                    ? 'Niemand heeft nu hulp nodig. Kom later nog eens kijken!'
                    : 'Wees de eerste om een lichtje aan te steken en de buurt samen te brengen!'
                }
              </p>
              <Button onClick={handleOpenCreate} size="lg" className="gap-2 rounded-xl btn-glow">
                <Fire size={20} weight="duotone" />
                Steek het eerste lichtje aan
              </Button>
            </div>
          ) : (
            <>
              {/* When "All" is selected, intermix stories with flares */}
              {activeFilter === 'all' && stories.length > 0 && (
                <>
                  {/* Show first story at the top if there are any */}
                  {stories.slice(0, 1).map((story) => (
                    <div key={story.id} className="fade-in-up">
                      <StoryCard
                        story={story}
                        isOwner={story.creatorId === user.id}
                        onReaction={onStoryReaction}
                        onUserClick={onUserClick}
                      />
                    </div>
                  ))}
                </>
              )}
              {filteredFlares.map((flare, index) => {
              const config = categoryConfig[flare.category] || categoryConfig.Other
              const CategoryIcon = config.icon
              const isOwner = flare.creator_id === user.id
              const isOffer = flare.flare_type === 'offer'
              const isFreefree = flare.is_free === true
              const isCircleOnly = flare.circle_only === true
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
                  <div className="absolute top-3 right-3 z-10 flex gap-1">
                    {isCircleOnly && (
                      <Badge 
                        variant="outline" 
                        className="text-xs font-semibold bg-amber-500/15 text-amber-400 border-amber-500/30"
                      >
                        <Lock size={10} className="mr-1" />
                        Circle
                      </Badge>
                    )}
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
                          {flare.creator_name || 'Onbekende buur'}
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
                                Dichtbij
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
                                    Gratis
                                  </>
                                ) : (
                                  <>
                                    <Coin size={11} weight="fill" />
                                    1 Lichtpuntje
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
                          Jouw {isOffer ? 'aanbod' : 'lichtje'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
              {/* Show remaining stories after flares when "All" is selected */}
              {activeFilter === 'all' && stories.slice(1).map((story, index) => (
                <div key={story.id} className="fade-in-up" style={{ animationDelay: `${(filteredFlares.length + index + 1) * 0.05}s` }}>
                  <StoryCard
                    story={story}
                    isOwner={story.creatorId === user.id}
                    onReaction={onStoryReaction}
                    onUserClick={onUserClick}
                  />
                </div>
              ))}
            </>
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
                  Claim dit aanbod
                </>
              ) : (
                <>
                  <HandWaving size={24} weight="duotone" className="text-primary" />
                  Bied je hulp aan
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {helpFlare?.flare_type === 'offer' 
                ? 'Laat weten dat je interesse hebt'
                : 'Laat weten dat je kan helpen'
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
                        Gratis geschenk
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                        <Coin size={12} weight="fill" className="mr-1" />
                        1 Lichtpuntje
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="help-message" className="text-sm font-medium flex items-center gap-2">
                  <Chat size={14} className="text-muted-foreground" />
                  Je bericht
                </Label>
                <Textarea
                  id="help-message"
                  placeholder={helpFlare.flare_type === 'offer' 
                    ? "Dag! Ik zou dit graag claimen. Zo bereik je me..."
                    : "Dag! Ik kan je hiermee helpen. Ik heb ervaring met..."
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
                  Misschien later
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
                  {sendingHelp ? 'Versturen...' : helpFlare.flare_type === 'offer' ? '🎁 Verstuur vraag' : '🤝 Verstuur aanbod'}
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
          setStoryContent('')
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {createStep === 'type' ? (
                <>
                  <Fire size={24} weight="duotone" className="text-primary" />
                  Nieuw bericht
                </>
              ) : createStep === 'story' ? (
                <>
                  <Camera size={24} weight="duotone" className="text-amber-400" />
                  Deel een moment
                </>
              ) : flareType === 'offer' ? (
                <>
                  <Gift size={24} weight="duotone" className="text-emerald-400" />
                  Deel een aanbod
                </>
              ) : (
                <>
                  <HandWaving size={24} weight="duotone" className="text-orange-400" />
                  Vraag om hulp
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {createStep === 'type' 
                ? 'Wat wil je delen?'
                : createStep === 'story'
                  ? 'Deel een moment met je buren'
                  : flareType === 'offer'
                    ? 'Deel iets met je buren'
                    : 'Vraag je buren om hulp'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {createStep === 'type' ? (
              /* Step 1: Choose Type */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFlareType('request')
                      setCreateStep('details')
                    }}
                    className="p-5 rounded-2xl border-2 border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-200 flex flex-col items-center gap-2 group"
                  >
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 group-hover:scale-110 transition-transform">
                      <Fire size={28} weight="duotone" className="text-orange-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-foreground text-sm mb-0.5">Vraag om hulp</h3>
                      <p className="text-xs text-muted-foreground">
                        Hulp nodig
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlareType('offer')
                      setCreateStep('details')
                    }}
                    className="p-5 rounded-2xl border-2 border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 flex flex-col items-center gap-2 group"
                  >
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 group-hover:scale-110 transition-transform">
                      <Gift size={28} weight="duotone" className="text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-foreground text-sm mb-0.5">Bied iets aan</h3>
                      <p className="text-xs text-muted-foreground">
                        Deel met buren
                      </p>
                    </div>
                  </button>
                </div>
                {/* Share a Moment option - full width */}
                <button
                  type="button"
                  onClick={() => setCreateStep('story')}
                  className="w-full p-4 rounded-2xl border-2 border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-200 flex items-center gap-4 group"
                >
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 group-hover:scale-110 transition-transform">
                    <Camera size={28} weight="duotone" className="text-amber-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-foreground text-sm mb-0.5">Deel een moment</h3>
                    <p className="text-xs text-muted-foreground">
                      Update uit de buurt • Verdwijnt na 48u
                    </p>
                  </div>
                  <PaperPlaneTilt size={20} className="text-muted-foreground group-hover:text-amber-400 transition-colors" />
                </button>
              </div>
            ) : createStep === 'story' ? (
              /* Story Creation */
              <>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setCreateStep('type')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  ← Terug
                </button>

                {/* Story Content */}
                <div className="space-y-2">
                  <Label htmlFor="story-content" className="text-sm font-medium">
                    Wat gebeurt er in de buurt?
                  </Label>
                  <Textarea
                    id="story-content"
                    placeholder="Mijn kind zijn eerste fietstocht! 🚴‍♂️"
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="resize-none rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {storyContent.length}/500
                  </p>
                </div>

                {/* Info about stories */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400/80">
                  <p>✨ Verhalen zijn informele updates - geen actie nodig van je buren. Ze verdwijnen na 48 uur.</p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                    onClick={handleCreateStory}
                    disabled={!storyContent.trim() || creating}
                  >
                    {creating ? 'Delen...' : '📸 Deel met buren'}
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Details */
              <>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setCreateStep('type')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  ← Terug naar keuze
                </button>

                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {flareType === 'offer' ? 'Wat bied je aan?' : 'Waarmee heb je hulp nodig?'}
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
                    Korte samenvatting
                  </Label>
                  <input
                    id="title"
                    type="text"
                    placeholder={flareType === 'offer' 
                      ? "Wat bied je aan? bv. 'Extra lasagne om te delen'"
                      : "Wat heb je nodig? bv. 'Hulp bij zetel verplaatsen'"
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
                    Vertel meer
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={flareType === 'offer'
                      ? "Beschrijf wat je aanbiedt, wanneer het beschikbaar is, eventuele voorwaarden..."
                      : "Vertel wat meer zodat buren weten hoe ze kunnen helpen..."
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
                      Hoe wil je dit delen?
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
                              🎁 Gratis geschenk
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Geen lichtpuntje nodig - puur uit gulheid!
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
                              🪙 Ruilen
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Ontvanger gebruikt 1 lichtpuntje
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
                        Deel mijn locatie
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Helpt nabije buren je te vinden
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="location-toggle"
                    checked={useLocation}
                    onCheckedChange={setUseLocation}
                  />
                </div>

                {/* Circle Only Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  circleOnly 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-muted/30 border-border/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${circleOnly ? 'bg-amber-500/20' : 'bg-muted'}`}>
                      <Lock size={18} className={circleOnly ? 'text-amber-400' : 'text-muted-foreground'} />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="circle-toggle" className="text-sm font-medium cursor-pointer">
                        Enkel voor buurtkring
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Alleen je vertrouwenskring ziet dit
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="circle-toggle"
                    checked={circleOnly}
                    onCheckedChange={setCircleOnly}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuleren
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
                    {creating ? 'Plaatsen...' : flareType === 'offer' ? '🎁 Plaats aanbod' : '🔥 Plaats vraag'}
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
