import { useState } from 'react';
import { MapTrifold, Backpack, Target, Warning, ArrowClockwise, Compass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { GameMap } from '@/components/map';
import { MiningModal } from '@/components/mining/MiningModal';
import { InventoryView } from '@/components/mining/InventoryView';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useResources } from '@/hooks/useResources';
import { useMining } from '@/hooks/useMining';
import { useInventory } from '@/hooks/useInventory';
import type { WorldResource } from '@/lib/resources';
import { getLevelFromXp, getXpProgress } from '@/lib/resources';
import type { User } from '@/lib/types';

interface ExploreViewProps {
  user: User;
}

export function ExploreView({ user }: ExploreViewProps) {
  const [selectedResource, setSelectedResource] = useState<WorldResource | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  // Geolocation hook
  const { 
    position, 
    accuracy, 
    error: geoError, 
    loading: geoLoading, 
    permissionDenied,
    requestPermission 
  } = useGeolocation();

  // Resources hook
  const { 
    resources, 
    loading: resourcesLoading, 
    error: resourcesError,
    refreshResources 
  } = useResources({ 
    userPosition: position,
    enabled: !!position 
  });

  // Mining hook
  const { 
    isMining, 
    progress: miningProgress, 
    error: miningError, 
    success: miningSuccess,
    mineResource,
    resetState: resetMiningState
  } = useMining();

  // Inventory hook
  const {
    items: inventoryItems,
    loading: inventoryLoading,
    sellResource,
    getTotalValue,
    getTotalCount
  } = useInventory();

  // Get mining stats from user profile (with defaults)
  const miningXp = (user as { mining_xp?: number }).mining_xp || 0;
  const miningLevel = getLevelFromXp(miningXp);
  const xpProgress = getXpProgress(miningXp);
  const totalMined = (user as { total_mined?: number }).total_mined || 0;

  const handleResourceClick = (resource: WorldResource) => {
    setSelectedResource(resource);
    resetMiningState();
  };

  const handleCloseMiningModal = () => {
    setSelectedResource(null);
    resetMiningState();
    if (miningSuccess) {
      refreshResources();
    }
  };

  const handleMine = async (resource: WorldResource) => {
    if (!position) return false;
    const success = await mineResource(resource, position);
    if (success) {
      // Resource will be removed from map after modal closes
    }
    return success;
  };

  // Show permission denied state
  if (permissionDenied) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <Warning size={64} className="mx-auto text-amber-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">Location Access Required</h2>
              <p className="text-muted-foreground mb-6">
                To explore and mine resources, we need access to your location. 
                Please enable location permissions in your browser settings.
              </p>
              <Button onClick={requestPermission} className="gap-2">
                <Target size={18} />
                Enable Location
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (geoLoading && !position) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Compass size={48} className="mx-auto text-primary mb-4 animate-pulse" />
            <p className="text-muted-foreground">Locating you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Map Container */}
      <div className="flex-1 relative">
        <GameMap
          userPosition={position}
          accuracy={accuracy}
          resources={resources}
          onResourceClick={handleResourceClick}
        />

        {/* Top Info Bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <MapTrifold size={20} weight="duotone" className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold">Explore & Mine</h1>
                    <p className="text-xs text-muted-foreground">
                      {resources.length} resource{resources.length !== 1 ? 's' : ''} nearby
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Target size={12} />
                    Lv.{miningLevel}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={refreshResources}
                    disabled={resourcesLoading}
                  >
                    <ArrowClockwise 
                      size={16} 
                      className={resourcesLoading ? 'animate-spin' : ''} 
                    />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Toast */}
        {(geoError || resourcesError) && (
          <div className="absolute top-20 left-4 right-4 z-[1000]">
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="p-3 flex items-center gap-2 text-sm text-destructive">
                <Warning size={16} />
                {geoError || resourcesError}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Sheet with Stats */}
      <div className="bg-card border-t border-border">
        <div className="p-4 space-y-3">
          {/* Mining XP Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Mining Level {miningLevel}</span>
                <span className="text-muted-foreground">{xpProgress.current}/{xpProgress.required} XP</span>
              </div>
              <Progress value={xpProgress.percentage} className="h-2" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                ⛏️ {totalMined} mined
              </span>
              <span className="text-muted-foreground">
                📦 {getTotalCount()} in bag
              </span>
              <span className="text-muted-foreground">
                💰 {getTotalValue()} 🏮 value
              </span>
            </div>
            
            {/* Inventory Button */}
            <Drawer open={showInventory} onOpenChange={setShowInventory}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Backpack size={16} />
                  Inventory
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle className="flex items-center gap-2">
                    <Backpack size={20} className="text-primary" />
                    Your Inventory
                  </DrawerTitle>
                </DrawerHeader>
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                  <InventoryView
                    items={inventoryItems}
                    loading={inventoryLoading}
                    onSell={sellResource}
                    totalValue={getTotalValue()}
                    totalCount={getTotalCount()}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Mining Modal */}
      <MiningModal
        resource={selectedResource}
        userPosition={position}
        isOpen={!!selectedResource}
        onClose={handleCloseMiningModal}
        onMine={handleMine}
        isMining={isMining}
        progress={miningProgress}
        error={miningError}
        success={miningSuccess}
      />
    </div>
  );
}
