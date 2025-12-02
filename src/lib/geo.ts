/**
 * Geolocation utilities for the mining game
 */

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Check if a point is within a given radius of another point
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param pointLat Point latitude
 * @param pointLon Point longitude
 * @param radiusMeters Radius in meters
 */
export function isWithinRadius(
  centerLat: number, 
  centerLon: number, 
  pointLat: number, 
  pointLon: number, 
  radiusMeters: number
): boolean {
  return getDistanceMeters(centerLat, centerLon, pointLat, pointLon) <= radiusMeters;
}

/**
 * Generate a random point within a given radius of a center point
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusMeters Maximum distance from center in meters
 * @param minRadiusMeters Minimum distance from center in meters (optional)
 */
export function generateRandomPointInRadius(
  centerLat: number, 
  centerLon: number, 
  radiusMeters: number,
  minRadiusMeters: number = 0
): { lat: number; lng: number } {
  // Convert radius from meters to degrees (approximation)
  const radiusDeg = radiusMeters / 111320; // 1 degree ≈ 111.32 km at equator
  const minRadiusDeg = minRadiusMeters / 111320;
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = minRadiusDeg + Math.random() * (radiusDeg - minRadiusDeg);
  
  // Calculate offset
  const latOffset = distance * Math.cos(angle);
  const lonOffset = distance * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
  
  return {
    lat: centerLat + latOffset,
    lng: centerLon + lonOffset
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Check if two points are at least minDistance apart
 */
export function arePointsApart(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  minDistanceMeters: number
): boolean {
  return getDistanceMeters(lat1, lon1, lat2, lon2) >= minDistanceMeters;
}

/**
 * Mining range constant (5km)
 */
export const MINING_RANGE_METERS = 5000;

/**
 * Minimum distance to mine a resource (50m)
 */
export const MINING_PROXIMITY_METERS = 50;

/**
 * Minimum distance between spawned resources (100m)
 */
export const MIN_RESOURCE_SPACING_METERS = 100;
