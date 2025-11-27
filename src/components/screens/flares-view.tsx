import { useState } from 'react'
import { Plus, MapPin, Clock, Users, Wrench, ForkKnife, ChatsCircle, Lightbulb, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
}

const categoryIcons: Record<string, React.ElementType> = {
  Mechanical: Wrench,
  Food: ForkKnife,
  Talk: ChatsCircle,
  Other: Lightbulb
}

const categoryColors: Record<string, string> = {
  Mechanical: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Food: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Talk: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Other: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
}

const categories = ['Mechanical', 'Food', 'Talk', 'Other']

export function FlaresView({ user, flares, onCreateFlare, onJoinFlare }: FlaresViewProps) {
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
  const myFlares = flares.filter(f => f.creator_id === user.id)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Flares</h1>
            <p className="text-sm text-muted-foreground">
              {activeFlares.length} active {activeFlares.length === 1 ? 'flare' : 'flares'} nearby
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus size={18} weight="bold" />
            New Flare
          </Button>
        </div>
      </div>

      {/* Flares List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {activeFlares.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Lightbulb size={32} className="text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No active flares</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Be the first to light a flare and ask for help!
                </p>
                <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                  <Plus size={18} />
                  Create a Flare
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeFlares.map((flare) => {
              const Icon = categoryIcons[flare.category] || Lightbulb
              const colorClass = categoryColors[flare.category] || categoryColors.Other
              const isOwner = flare.creator_id === user.id

              return (
                <Card key={flare.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {(flare.creator_name || 'A').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{flare.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {flare.creator_name || 'Anonymous'} • {timeAgo(flare.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${colorClass} shrink-0`}>
                        <Icon size={14} className="mr-1" />
                        {flare.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
                      {flare.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {flare.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            Nearby
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {timeAgo(flare.starts_at)}
                        </span>
                        {flare.max_participants && (
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {flare.current_participants}/{flare.max_participants}
                          </span>
                        )}
                      </div>
                      {!isOwner && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleOpenHelpModal(flare)}
                        >
                          Offer Help
                        </Button>
                      )}
                      {isOwner && (
                        <Badge variant="outline" className="text-xs">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Help</DialogTitle>
          </DialogHeader>
          
          {helpFlare && (
            <div className="space-y-4 py-4">
              {/* Flare Summary */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={categoryColors[helpFlare.category] || categoryColors.Other}>
                    {helpFlare.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">by {helpFlare.creator_name}</span>
                </div>
                <p className="text-sm text-foreground">{helpFlare.title}</p>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="help-message" className="text-sm font-medium">
                  Your message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="help-message"
                  placeholder="Introduce yourself and explain how you can help..."
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {helpMessage.length}/300
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowHelpModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSendHelpOffer}
                  disabled={!helpMessage.trim() || sendingHelp}
                >
                  {sendingHelp ? 'Sending...' : 'Send Offer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Flare Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Flare</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">What kind of help?</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat]
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        flex items-center gap-2
                        ${category === cat 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <Icon 
                        size={20} 
                        weight={category === cat ? 'duotone' : 'regular'}
                        className={category === cat ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <span className={`text-sm font-medium ${category === cat ? 'text-primary' : ''}`}>
                        {cat}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <input
                id="title"
                type="text"
                placeholder="Quick summary of what you need..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need help with..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>

            {/* Location Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="location-toggle" className="text-sm font-medium">
                  Share location
                </Label>
                <p className="text-xs text-muted-foreground">
                  Help neighbors find you
                </p>
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
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!title.trim() || !description.trim() || creating}
              >
                {creating ? 'Creating...' : 'Post Flare'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
