import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Hammer, X, Sparkle, Warning } from '@phosphor-icons/react';
import type { WorldResource } from '@/lib/resources';
import { RARITY_CONFIG, type ResourceRarity } from '@/lib/resources';
import { getDistanceMeters, formatDistance, MINING_PROXIMITY_METERS } from '@/lib/geo';

interface MiningModalProps {
  resource: WorldResource | null;
  userPosition: { lat: number; lng: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onMine: (resource: WorldResource) => Promise<boolean>;
  isMining: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export function MiningModal({
  resource,
  userPosition,
  isOpen,
  onClose,
  onMine,
  isMining,
  progress,
  error,
  success
}: MiningModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success animation
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  if (!resource) return null;

  const rarity = (resource.resource_type?.rarity || 'common') as ResourceRarity;
  const config = RARITY_CONFIG[rarity];
  
  // Calculate distance
  const distance = userPosition 
    ? getDistanceMeters(
        userPosition.lat,
        userPosition.lng,
        resource.location.lat,
        resource.location.lng
      )
    : null;

  const canMine = distance !== null && distance <= MINING_PROXIMITY_METERS;

  const handleMine = async () => {
    if (!resource || !userPosition) return;
    await onMine(resource);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Hammer size={24} weight="duotone" className="text-primary" />
            {showSuccess ? 'Resource Mined!' : isMining ? 'Mining...' : 'Mine Resource'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resource Info */}
          <div className={`p-6 rounded-xl text-center ${config.bgColor} border ${config.borderColor}`}>
            <div className="text-5xl mb-3">{resource.resource_type?.icon}</div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              {resource.resource_type?.name}
            </h3>
            <p className={`text-sm font-medium capitalize ${config.color}`}>
              {rarity}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {resource.resource_type?.description}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Value:</span>
              <span className="font-semibold text-primary">
                {resource.resource_type?.base_value} 🏮
              </span>
            </div>
          </div>

          {/* Distance Info */}
          {distance !== null && !isMining && !showSuccess && (
            <div className={`p-4 rounded-xl ${canMine ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <div className="flex items-center gap-3">
                {canMine ? (
                  <>
                    <Sparkle size={24} weight="duotone" className="text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">In range!</p>
                      <p className="text-sm text-muted-foreground">You can mine this resource</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Warning size={24} weight="duotone" className="text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-400">Too far away</p>
                      <p className="text-sm text-muted-foreground">
                        Get within {MINING_PROXIMITY_METERS}m ({formatDistance(distance)} away)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mining Progress */}
          {isMining && (
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                ⛏️ Mining in progress...
              </p>
            </div>
          )}

          {/* Success State */}
          {showSuccess && (
            <div className="text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-4">
                <Sparkle size={48} weight="duotone" className="text-green-400 animate-bounce" />
              </div>
              <p className="text-lg font-semibold text-green-400">
                Successfully mined!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Added to your inventory
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          {!isMining && !showSuccess && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onClose}
              >
                <X size={18} className="mr-2" />
                Close
              </Button>
              <Button
                className="flex-1 rounded-xl btn-glow"
                onClick={handleMine}
                disabled={!canMine || isMining}
              >
                <Hammer size={18} className="mr-2" weight="duotone" />
                {canMine ? 'Mine Now' : 'Too Far'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
