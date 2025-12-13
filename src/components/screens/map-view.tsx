import { useState, useEffect } from 'react'
import { Plus, MapTrifold, ListBullets, NavigationArrow, Fire, PaperPlaneRight, User as UserIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlareCard } from '@/components/flare-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CreateFlare } from './create-flare'
import type { Flare, User, HelpRequest } from '@/lib/types'
import { calculateDistance } from '@/lib/economy'
import { toast } from 'sonner'

interface MapViewProps {
  user: User
  flares: Flare[]
  helpRequests: HelpRequest[]
  allUsers: User[]
  onCreateFlare: (flare: Omit<Flare, 'id' | 'createdAt' | 'userId' | 'username' | 'status'>) => void
  onSendHelpRequest: (flareId: string, message: string) => void
}

export function MapView({ user, flares, helpRequests, allUsers, onCreateFlare, onSendHelpRequest }: MapViewProps) {
  const [view, setView] = useState<'map' | 'list'>('list')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedFlare, setSelectedFlare] = useState<Flare | null>(null)
  const [showHelpOfferDialog, setShowHelpOfferDialog] = useState(false)
  const [helpMessage, setHelpMessage] = useState('')
  const [userLocation, setUserLocation] = useState(user.location || { lat: 40.7128, lng: -74.0060 })

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      })
    }
  }, [])

  // Only real flares now (no fake ones)
  const allFlares = flares
  
  // Other users (not the current user)
  const otherUsers = allUsers.filter(u => u.id !== user.id)
  
  // User's own flares
  const myFlares = flares.filter(f => f.userId === user.id)
  
  // Other people's active flares
  const otherFlares = allFlares
    .filter(f => f.status === 'active' && f.userId !== user.id)
    .map(flare => ({
      flare,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        flare.location.lat,
        flare.location.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)

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

  const handleOfferHelp = (flare: Flare) => {
    if (hasAlreadyOfferedHelp(flare.id)) {
      const status = getHelpRequestStatus(flare.id)
      if (status?.status === 'pending') {
        toast.info('Your help offer is pending. Check Messages for updates.')
      } else if (status?.status === 'accepted') {
        toast.info('Your help offer was accepted! Check Messages to chat.')
      } else if (status?.status === 'denied') {
        toast.info('Your help offer was declined.')
      }
      return
    }
    setSelectedFlare(flare)
    setHelpMessage('')
    setShowHelpOfferDialog(true)
  }

  const handleSubmitHelpOffer = () => {
    if (!selectedFlare) return
    
    // Use default message if none provided
    const finalMessage = helpMessage.trim() || "Hi! I'd like to help with this."
    
    onSendHelpRequest(selectedFlare.id, finalMessage)
    setShowHelpOfferDialog(false)
    setSelectedFlare(null)
    setHelpMessage('')
    toast.success('Help offer sent! They\'ll be notified in their Messages.')
  }

  // Get pending help request count for user's flares
  const getPendingHelpCount = (flareId: string): number => {
    return helpRequests.filter(
      hr => hr.flareId === flareId && hr.status === 'pending'
    ).length
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-foreground">Flares</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  })
                  toast.success('Location updated')
                })
              }
            }}
          >
            <NavigationArrow size={20} />
            </Button>
          </div>
        
          <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
            <TabsList className="w-full">
            <TabsTrigger value="map" className="flex-1 gap-2">
              <MapTrifold size={16} />
              Map
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 gap-2">
              <ListBullets size={16} />
              List
            </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'map' ? (
          <div className="relative h-full bg-gradient-to-b from-card/50 to-muted/30">
            {/* Simple visual map representation */}
            <div className="absolute inset-0 p-4">
              <div className="relative w-full h-full rounded-xl bg-muted/20 border border-border overflow-hidden">
                {/* Grid lines for map effect */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(10)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute w-full h-px bg-border" style={{ top: `${i * 10}%` }} />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute h-full w-px bg-border" style={{ left: `${i * 10}%` }} />
                  ))}
                </div>
                
                {/* User location marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-50" />
                  </div>
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-500 whitespace-nowrap">You</span>
                </div>
                
                {/* Other users markers (neighbors online) */}
                {otherUsers.map((otherUser, index) => {
                  const angle = (index / Math.max(otherUsers.length, 1)) * Math.PI * 2 + Math.PI * 0.25
                  const x = 50 + Math.cos(angle) * 30
                  const y = 50 + Math.sin(angle) * 30
                  
                  return (
                    <div
                      key={otherUser.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-5"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <UserIcon size={16} className="text-white" weight="fill" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white" title="Online" />
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card/90 px-2 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border">
                          {otherUser.username}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Flare markers */}
                {otherFlares.slice(0, 8).map(({ flare, distance }, index) => {
                  // Position flares around the user
                  const angle = (index / 8) * Math.PI * 2
                  const radius = 25 + (distance * 10) // Distance affects how far from center
                  const x = 50 + Math.cos(angle) * Math.min(radius, 40)
                  const y = 50 + Math.sin(angle) * Math.min(radius, 40)
                  
                  return (
                    <button
                      key={flare.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => handleOfferHelp(flare)}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-110 transition-transform flare-pulse">
                          <Fire size={16} className="text-primary-foreground" weight="fill" />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card/90 px-2 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border">
                          {flare.username.split('_')[0]}
                        </div>
                      </div>
                    </button>
                  )
                })}
                
                {/* My flares */}
                {myFlares.map((flare, index) => {
                  const angle = (index / Math.max(myFlares.length, 1)) * Math.PI * 0.5 + Math.PI * 1.25
                  const x = 50 + Math.cos(angle) * 20
                  const y = 50 + Math.sin(angle) * 20
                  const pendingCount = getPendingHelpCount(flare.id)
                  
                  return (
                    <div
                      key={flare.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <Fire size={16} className="text-white" weight="fill" />
                        </div>
                        {pendingCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                            {pendingCount}
                          </span>
                        )}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card/90 px-2 py-0.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-border">
                          Your flare
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>You</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="relative">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />
                  </div>
                  <span>Neighbors online ({otherUsers.length})</span>
                </div>
                {otherFlares.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span>Active flares</span>
                  </div>
                )}
                {myFlares.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Your flares</span>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="absolute top-6 right-6 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
                <span className="text-sm font-medium">{otherUsers.length} neighbors • {otherFlares.length} flares</span>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 max-w-2xl mx-auto">
              {/* My Flares Section */}
              {myFlares.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Flares</h2>
                  {myFlares.map(flare => {
                    const pendingCount = getPendingHelpCount(flare.id)
                    return (
                      <FlareCard
                        key={flare.id}
                        flare={flare}
                        isOwner={true}
                        pendingHelpCount={pendingCount}
                      />
                    )
                  })}
                </div>
              )}
              
              {/* Nearby Flares Section */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Nearby Flares ({otherFlares.length})
                </h2>
                {otherFlares.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
                      <ListBullets size={48} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No active flares nearby
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your neighborhood is quiet. Be the first to ask for help!
                    </p>
                  </div>
                ) : (
                  otherFlares.map(({ flare, distance }) => {
                    const helpStatus = getHelpRequestStatus(flare.id)
                    return (
                      <FlareCard
                        key={flare.id}
                        flare={flare}
                        distance={distance}
                        helpRequestStatus={helpStatus?.status}
                        onHelp={() => handleOfferHelp(flare)}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card/50">
        <div className="max-w-md mx-auto">
          <Button
            className="w-full gap-2 h-11"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={20} weight="bold" />
            Create Flare
          </Button>
        </div>
      </div>

      {/* Create Flare Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create a Flare</DialogTitle>
          </DialogHeader>
          <CreateFlare
            userLocation={userLocation}
            onSubmit={(flare) => {
              onCreateFlare(flare)
              setShowCreateDialog(false)
              toast.success('Flare posted to your neighborhood!')
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Help Offer Dialog */}
      <Dialog open={showHelpOfferDialog} onOpenChange={setShowHelpOfferDialog}>
        <DialogContent className="max-w-md">
          {selectedFlare && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Offer to Help</DialogTitle>
                <DialogDescription>
                  Send a message to {selectedFlare.username} with your help offer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Flare info */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {selectedFlare.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{selectedFlare.username}</p>
                      <Badge variant="secondary" className="text-xs">
                        {selectedFlare.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedFlare.description}
                  </p>
                </div>
                
                {/* Message input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Your message
                  </label>
                  <Textarea
                    placeholder="Hi! I'd love to help with this. I have experience with..."
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your only message until they accept your offer
                  </p>
                </div>
                
                {/* Info box */}
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>💡 Hoe het werkt:</strong> Je aanbod verschijnt in hun Berichten. Als ze accepteren, kun je chatten en afspreken. Als de taak voltooid is, sturen ze je 1 Lichtpuntje als bedankje!
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowHelpOfferDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleSubmitHelpOffer}
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                    Send Offer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
