import { CircleMarker, Tooltip } from 'react-leaflet';
import type { WorldResource } from '@/lib/resources';
import { RARITY_CONFIG, type ResourceRarity } from '@/lib/resources';
import { getDistanceMeters, formatDistance, MINING_PROXIMITY_METERS } from '@/lib/geo';

interface ResourceMarkerProps {
  resource: WorldResource;
  userPosition: { lat: number; lng: number } | null;
  onClick: () => void;
}

// Get color from rarity
function getRarityColor(rarity: ResourceRarity): string {
  switch (rarity) {
    case 'common':
      return '#9ca3af'; // gray-400
    case 'uncommon':
      return '#4ade80'; // green-400
    case 'rare':
      return '#60a5fa'; // blue-400
    case 'epic':
      return '#c084fc'; // purple-400
    case 'legendary':
      return '#fbbf24'; // amber-400
    default:
      return '#9ca3af';
  }
}

export function ResourceMarker({ resource, userPosition, onClick }: ResourceMarkerProps) {
  const rarity = (resource.resource_type?.rarity || 'common') as ResourceRarity;
  const color = getRarityColor(rarity);
  const config = RARITY_CONFIG[rarity];
  
  // Calculate distance from user
  const distance = userPosition 
    ? getDistanceMeters(
        userPosition.lat,
        userPosition.lng,
        resource.location.lat,
        resource.location.lng
      )
    : null;

  const canMine = distance !== null && distance <= MINING_PROXIMITY_METERS;
  
  // Determine marker size based on rarity
  const baseRadius = rarity === 'legendary' ? 12 : 
                     rarity === 'epic' ? 10 : 
                     rarity === 'rare' ? 9 : 
                     rarity === 'uncommon' ? 8 : 7;

  return (
    <>
      {/* Outer glow for higher rarities */}
      {(rarity === 'epic' || rarity === 'legendary') && (
        <CircleMarker
          center={[resource.location.lat, resource.location.lng]}
          radius={baseRadius + 8}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 0
          }}
          className={rarity === 'legendary' ? 'animate-pulse' : ''}
        />
      )}
      
      {/* Middle glow */}
      <CircleMarker
        center={[resource.location.lat, resource.location.lng]}
        radius={baseRadius + 4}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 0
        }}
      />
      
      {/* Main marker */}
      <CircleMarker
        center={[resource.location.lat, resource.location.lng]}
        radius={baseRadius}
        pathOptions={{
          color: canMine ? '#22c55e' : color,
          fillColor: color,
          fillOpacity: 1,
          weight: canMine ? 3 : 2
        }}
        eventHandlers={{
          click: onClick
        }}
      >
        <Tooltip direction="top" offset={[0, -10]}>
          <div className="text-center">
            <div className="flex items-center gap-1 font-medium">
              <span>{resource.resource_type?.icon}</span>
              <span>{resource.resource_type?.name}</span>
            </div>
            <div className="text-xs text-gray-400">
              {distance !== null && (
                <span className={canMine ? 'text-green-400' : ''}>
                  {canMine ? '✓ In range' : formatDistance(distance)}
                </span>
              )}
            </div>
            <div className={`text-xs capitalize ${config.color}`}>
              {rarity}
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}
