import { Circle } from 'react-leaflet';

interface MiningRadiusProps {
  center: { lat: number; lng: number };
  radius: number;
}

export function MiningRadius({ center, radius }: MiningRadiusProps) {
  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radius}
      pathOptions={{
        color: 'rgba(251, 191, 36, 0.4)',
        fillColor: 'rgba(251, 191, 36, 0.05)',
        fillOpacity: 1,
        weight: 2,
        dashArray: '10, 5'
      }}
    />
  );
}
