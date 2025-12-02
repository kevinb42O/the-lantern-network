import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserMarker } from './UserMarker';
import { ResourceMarker } from './ResourceMarker';
import { MiningRadius } from './MiningRadius';
import type { WorldResource } from '@/lib/resources';
import { MINING_RANGE_METERS } from '@/lib/geo';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GameMapProps {
  userPosition: { lat: number; lng: number } | null;
  accuracy: number | null;
  resources: WorldResource[];
  onResourceClick: (resource: WorldResource) => void;
}

// Component to handle map centering on user position
function MapCenterer({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (position && !hasCentered) {
      map.setView([position.lat, position.lng], 15);
      setHasCentered(true);
    }
  }, [map, position, hasCentered]);

  return null;
}

// Default center (San Francisco) if no user position
const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];
const DEFAULT_ZOOM = 13;

export function GameMap({ userPosition, accuracy, resources, onResourceClick }: GameMapProps) {
  const center: [number, number] = userPosition 
    ? [userPosition.lat, userPosition.lng] 
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="game-map w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      {/* Dark theme map tiles - CartoDB Dark Matter */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {/* Center map on user position */}
      <MapCenterer position={userPosition} />

      {/* Mining radius circle (5km) */}
      {userPosition && (
        <MiningRadius 
          center={userPosition} 
          radius={MINING_RANGE_METERS} 
        />
      )}

      {/* User position marker */}
      {userPosition && (
        <UserMarker 
          position={userPosition} 
          accuracy={accuracy} 
        />
      )}

      {/* Resource markers */}
      {resources.map(resource => (
        <ResourceMarker
          key={resource.id}
          resource={resource}
          userPosition={userPosition}
          onClick={() => onResourceClick(resource)}
        />
      ))}
    </MapContainer>
  );
}
