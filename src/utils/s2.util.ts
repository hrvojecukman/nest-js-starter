import { S2CellId, S2LatLng } from "nodes2ts";

export function capForLevel(level: number): number {
  if (level >= 16) return 4000;  // Neighborhood level
  if (level >= 14) return 2500;  // District level
  if (level >= 12) return 1200;  // City level
  if (level >= 10) return 800;   // Region level
  if (level >= 8) return 500;    // Country level
  return 300; // World level
}

export function tokenAtLevel(lat: number, lng: number, level: number): string {
  const ll = S2LatLng.fromDegrees(lat, lng);
  const cellId = S2CellId.fromPoint(ll.toPoint());
  return cellId.parentL(level).toToken();
}

export function parentToken(token: string, level: number): string {
  return S2CellId.fromToken(token).parentL(level).toToken();
}

export function normalizeTilesForLevel(
  tiles: string[],
  level: number
): { column: "s2L6" | "s2L8" | "s2L10" | "s2L12" | "s2L16"; tokens: string[]; level: number } {
  if (level <= 6) {
    return { column: "s2L6", tokens: dedupe(tiles.map(t => parentToken(t, 6))), level };
  }
  
  if (level <= 8) {
    return { column: "s2L8", tokens: dedupe(tiles.map(t => parentToken(t, 8))), level };
  }
  
  if (level <= 10) {
    return { column: "s2L10", tokens: dedupe(tiles.map(t => parentToken(t, 10))), level };
  }

  if (level <= 12) {
    return { column: "s2L12", tokens: dedupe(tiles.map(t => parentToken(t, 12))), level };
  }

  return { column: "s2L16", tokens: dedupe(tiles.map(t => parentToken(t, 16))), level };
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
