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