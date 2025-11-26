import { useState, useEffect } from 'react'
import { Plus, MapTrifold, ListBullets, NavigationArrow } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlareCard } from '@/components/flare-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateFlare } from './create-flare'
import type { Flare, User } from '@/lib/types'
import { calculateDistance } from '@/lib/economy'
import { toast } from 'sonner'

interface MapViewProps {
  user: User
  flares: Flare[]
  onCreateFlare: (flare: Omit<Flare, 'id' | 'createdAt' | 'userId' | 'username' | 'status'>) => void
  onAcceptFlare: (flareId: string) => void
}

export function MapView({ user, flares, onCreateFlare, onAcceptFlare }: MapViewProps) {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedFlare, setSelectedFlare] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState(user.location || { lat: 0, lng: 0 })

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

  const sortedFlares = flares
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

  const handleAcceptFlare = (flareId: string) => {
    onAcceptFlare(flareId)
    toast.success('Mission accepted! Opening chat...')
    setSelectedFlare(null)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold text-foreground">Flares</h1>
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

      <div className="flex-1 overflow-hidden">
        {view === 'map' ? (
          <div className="relative h-full bg-gradient-to-b from-card/50 to-muted/30">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center space-y-4 max-w-md">
                <div className="inline-flex p-6 rounded-full bg-primary/10 mb-2">
                  <MapTrifold size={64} className="text-primary" weight="duotone" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {sortedFlares.length > 0 
                      ? `${sortedFlares.length} ${sortedFlares.length === 1 ? 'flare' : 'flares'} nearby`
                      : 'Your neighborhood is quiet'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sortedFlares.length > 0
                      ? 'Switch to list view to see details and help out'
                      : 'Be the first to post a flare and get help from your neighbors'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {sortedFlares.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-6 rounded-full bg-muted/50 mb-4">
                    <ListBullets size={64} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No active flares
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    Your neighborhood is quiet right now. Be the first to ask for help!
                  </p>
                </div>
              ) : (
                sortedFlares.map(({ flare, distance }) => (
                  <FlareCard
                    key={flare.id}
                    flare={flare}
                    distance={distance}
                    onHelp={() => handleAcceptFlare(flare.id)}
                    onClick={() => setSelectedFlare(flare.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card/50">
        <Button
          className="w-full gap-2 h-12"
          size="lg"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus size={24} weight="bold" />
          <span className="text-base font-semibold">Create Flare</span>
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Ask your neighbors for help
        </p>
      </div>

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
    </div>
  )
}
