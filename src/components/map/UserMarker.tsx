import { CircleMarker, Circle, Tooltip } from 'react-leaflet';

interface UserMarkerProps {
  position: { lat: number; lng: number };
  accuracy: number | null;
}

export function UserMarker({ position, accuracy }: UserMarkerProps) {
  return (
    <>
      {/* Accuracy circle */}
      {accuracy && accuracy > 0 && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{
            color: 'rgba(251, 191, 36, 0.3)',
            fillColor: 'rgba(251, 191, 36, 0.1)',
            fillOpacity: 0.3,
            weight: 1
          }}
        />
      )}
      
      {/* Glow effect - outer ring */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={18}
        pathOptions={{
          color: 'rgba(251, 191, 36, 0.4)',
          fillColor: 'rgba(251, 191, 36, 0.2)',
          fillOpacity: 1,
          weight: 0
        }}
      />
      
      {/* Middle ring */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={12}
        pathOptions={{
          color: 'rgba(251, 191, 36, 0.6)',
          fillColor: 'rgba(251, 191, 36, 0.4)',
          fillOpacity: 1,
          weight: 0
        }}
      />
      
      {/* Inner marker */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={8}
        pathOptions={{
          color: '#fbbf24',
          fillColor: '#fbbf24',
          fillOpacity: 1,
          weight: 3
        }}
      >
        <Tooltip direction="top" offset={[0, -15]} permanent={false}>
          <span className="font-medium">You are here</span>
        </Tooltip>
      </CircleMarker>
    </>
  );
}
