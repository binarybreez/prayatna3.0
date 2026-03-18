// ─── Coordinate Validation & Mapping Utilities ─────────────────────
// Ensures all coordinates are valid before rendering on the map.

export interface SafeCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Validates that latitude and longitude are valid GPS coordinates.
 * Returns true only if both are finite numbers within valid ranges.
 */
export function validateCoordinates(lat: any, lng: any): boolean {
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

  if (latitude == null || longitude == null) return false;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  // Reject (0, 0) — clearly invalid backend data, not a real GPS location
  if (latitude === 0 && longitude === 0) return false;

  return true;
}

/**
 * Extracts and normalizes coordinates from any API response object.
 * Handles multiple field name formats: lat/lng, latitude/longitude, centroid_lat/centroid_lng.
 * Returns null if coordinates are invalid.
 */
export function mapApiCoordinates(data: any): SafeCoordinate | null {
  if (!data || typeof data !== 'object') {
    console.warn('[INVALID COORDINATE SKIPPED] Null or non-object data');
    return null;
  }

  // Try all possible field name combinations
  const lat = data.latitude ?? data.lat ?? data.centroid_lat ?? data.center_lat ?? null;
  const lng = data.longitude ?? data.lng ?? data.centroid_lng ?? data.center_lng ?? data.lon ?? null;

  // Parse strings to numbers
  const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
  const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);

  if (!validateCoordinates(latitude, longitude)) {
    console.warn(`[INVALID COORDINATE SKIPPED] lat=${lat}, lng=${lng}`);
    return null;
  }

  console.log(`[COORDINATE VALIDATED] lat=${latitude.toFixed(4)}, lng=${longitude.toFixed(4)}`);
  return { latitude, longitude };
}

/**
 * Safely parses a numeric value from string or number input.
 * Returns the fallback value if the input is invalid.
 */
export function safeParseNumber(value: any, fallback: number = 0): number {
  if (value == null) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isFinite(num) ? num : fallback;
}
