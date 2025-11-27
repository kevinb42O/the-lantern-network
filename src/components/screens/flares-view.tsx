import { useState } from 'react'
import { Plus, MapPin, Clock, Users, Wrench, Hamburger, Chat, Lightbulb, HandWaving, Sparkle, Fire } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

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
}

interface FlaresViewProps {
  user: User
  flares: FlareData[]
  onCreateFlare: (flare: {
    title: string
    description: string
    category: string
    location: { lat: number; lng: number } | null
  }) => Promise<void>
  onJoinFlare: (flareId: string, message: string) => Promise<void>
  onUserClick?: (userId: string) => void
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; emoji: string }> = {
  Mechanical: { 
    icon: Wrench, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    emoji: '🔧'
  },
  Food: { 
    icon: Hamburger, 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    emoji: '🍲'
  },
  Talk: { 
    icon: Chat, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    emoji: '💬'
  },
  Other: { 
    icon: Lightbulb, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    emoji: '💡'
  }
}

const categories = ['Mechanical', 'Food', 'Talk', 'Other']

export function FlaresView({ user, flares, onCreateFlare, onJoinFlare, onUserClick }: FlaresViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [category, setCategory] = useState('Other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [useLocation, setUseLocation] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Help offer modal state
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [helpFlare, setHelpFlare] = useState<FlareData | null>(null)
  const [helpMessage, setHelpMessage] = useState('')
  const [sendingHelp, setSendingHelp] = useState(false)

  // Get user location when creating flare
  const handleOpenCreate = () => {
    setShowCreateModal(true)
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
        location: useLocation ? userLocation : null
      })
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setCategory('Other')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenHelpModal = (flare: FlareData) => {
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

  const activeFlares = flares.filter(f => f.status === 'active')

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
                  : `${activeFlares.length} neighbor${activeFlares.length !== 1 ? 's' : ''} need${activeFlares.length === 1 ? 's' : ''} help`
                }
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 btn-glow rounded-xl shadow-lg shadow-primary/20">
            <Plus size={18} weight="bold" />
            <span className="hidden sm:inline">Ask for Help</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Flares List */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4 max-w-2xl mx-auto">
          {activeFlares.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 mb-6">
                <Sparkle size={48} weight="duotone" className="text-primary bounce-subtle" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Your neighborhood is quiet
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                No one needs help right now. Be the first to light a flare and bring neighbors together!
              </p>
              <Button onClick={handleOpenCreate} size="lg" className="gap-2 rounded-xl btn-glow">
                <Fire size={20} weight="duotone" />
                Light the First Flare
              </Button>
            </div>
          ) : (
            activeFlares.map((flare, index) => {
              const config = categoryConfig[flare.category] || categoryConfig.Other
              const Icon = config.icon
              const isOwner = flare.creator_id === user.id

              return (
                <Card 
                  key={flare.id} 
                  className="overflow-hidden card-hover border-border/50 bg-card/80 fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onUserClick?.(flare.creator_id)}
                          className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
                        >
                          <Avatar className="h-11 w-11 ring-2 ring-primary/20 cursor-pointer">
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground font-semibold">
                              {(flare.creator_name || 'A').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                        <div className="space-y-0.5">
                          <CardTitle className="text-base leading-snug">{flare.title}</CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1.5">
                            <button
                              onClick={() => onUserClick?.(flare.creator_id)}
                              className="font-medium text-foreground/70 hover:text-primary transition-colors cursor-pointer"
                            >
                              {flare.creator_name || 'Anonymous'}
                            </button>
                            <span className="text-muted-foreground">•</span>
                            <Clock size={12} className="text-muted-foreground" />
                            <span>{timeAgo(flare.created_at)}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${config.bgColor} ${config.color} border shrink-0 gap-1.5 px-2.5 py-1`}
                      >
                        <span>{config.emoji}</span>
                        <span className="hidden sm:inline">{flare.category}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground/80 mb-4 leading-relaxed line-clamp-3">
                      {flare.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {flare.location && (
                          <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                            <MapPin size={12} className="text-primary/70" />
                            Nearby
                          </span>
                        )}
                        {flare.max_participants && (
                          <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                            <Users size={12} />
                            {flare.current_participants}/{flare.max_participants}
                          </span>
                        )}
                      </div>
                      {!isOwner ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenHelpModal(flare)}
                          className="gap-2 rounded-xl"
                        >
                          <HandWaving size={16} weight="duotone" />
                          I Can Help
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                          <Sparkle size={12} className="mr-1" />
                          Your Flare
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

      {/* Help Offer Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HandWaving size={24} weight="duotone" className="text-primary" />
              Offer Your Help
            </DialogTitle>
            <DialogDescription>
              Let them know you're here to help
            </DialogDescription>
          </DialogHeader>
          
          {helpFlare && (
            <div className="space-y-5 py-2">
              {/* Flare Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{categoryConfig[helpFlare.category]?.emoji || '💡'}</span>
                  <span className="text-sm font-medium text-foreground">{helpFlare.category}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{helpFlare.creator_name}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{helpFlare.title}</p>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="help-message" className="text-sm font-medium flex items-center gap-2">
                  <Chat size={14} className="text-muted-foreground" />
                  Your message
                </Label>
                <Textarea
                  id="help-message"
                  placeholder="Hi! I'd love to help you with this. I have experience with..."
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
                  className="flex-1 rounded-xl btn-glow"
                  onClick={handleSendHelpOffer}
                  disabled={!helpMessage.trim() || sendingHelp}
                >
                  {sendingHelp ? 'Sending...' : '🤝 Send Offer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Flare Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Fire size={24} weight="duotone" className="text-primary" />
              Light a Flare
            </DialogTitle>
            <DialogDescription>
              Ask your neighbors for help
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">What do you need help with?</Label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const config = categoryConfig[cat]
                  const Icon = config.icon
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
                          ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/10' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted/50'}`}>
                        <Icon 
                          size={24} 
                          weight={isSelected ? 'duotone' : 'regular'}
                          className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {config.emoji} {cat}
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
                placeholder="What do you need? e.g., 'Need help moving a couch'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Tell us more
              </Label>
              <Textarea
                id="description"
                placeholder="Share more details so neighbors know how to help..."
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
                className="flex-1 rounded-xl btn-glow"
                onClick={handleCreate}
                disabled={!title.trim() || !description.trim() || creating}
              >
                {creating ? 'Posting...' : '🔥 Post Flare'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
