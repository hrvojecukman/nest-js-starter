export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function calculateBoundingBox(lat: number | string, lng: number | string, radiusKm: number | string): BoundingBox {
  // Convert inputs to numbers
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const radiusNum = Number(radiusKm);

  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Convert radius from kilometers to radians
  const radiusRad = radiusNum / earthRadius;
  
  // Calculate the bounding box
  const minLat = latNum - (radiusRad * (180 / Math.PI));
  const maxLat = latNum + (radiusRad * (180 / Math.PI));
  
  // Calculate longitude bounds
  const minLng = lngNum - (radiusRad * (180 / Math.PI) / Math.cos(latNum * Math.PI / 180));
  const maxLng = lngNum + (radiusRad * (180 / Math.PI) / Math.cos(latNum * Math.PI / 180));
  
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Convert kilometers to degrees (approximate)
 * @param km Kilometers
 * @returns Degrees
 */
export function kmToDegrees(km: number): number {
  return km * 0.009; // Approximate conversion
} 