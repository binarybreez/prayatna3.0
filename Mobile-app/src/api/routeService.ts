// OSRM Route Service — Free routing API, no API key needed

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RouteCoordinate[];
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Decode Google's encoded polyline format (used by OSRM)
 * Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Fetch road-based route from OSRM (free, no API key)
 * Returns decoded polyline coordinates, distance, and duration
 */
export async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline`;

  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`OSRM returned ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const coordinates = decodePolyline(route.geometry);

    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch (error) {
    // Fallback: straight line between origin and destination
    return {
      coordinates: [
        { latitude: originLat, longitude: originLng },
        { latitude: destLat, longitude: destLng },
      ],
      distance: getDistanceMeters(originLat, originLng, destLat, destLng),
      duration: 0,
    };
  }
}

/** Haversine distance in meters (for fallback) */
function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
