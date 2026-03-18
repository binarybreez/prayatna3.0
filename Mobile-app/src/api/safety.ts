import { ApiResponse, SafetyScore, RiskZone, IncidentMarker, BackendRiskScore, BackendIncident, BackendHotspot } from '../types';
import { simulateDelay, mockResponse, backendClient, withRetry } from './client';
import { ENDPOINTS } from '../config/apiConfig';
import { mockSafetyScore, mockRiskZones, mockIncidents } from '../data/mockSafety';
import { mapApiCoordinates, safeParseNumber, validateCoordinates } from '../utils/coordinates';

// ─── Reverse Geocoding (Nominatim — free, no API key) ───────────────

/** Cache to avoid repeated geocoding for the same coordinates */
let geocodeCache: { key: string; name: string } | null = null;

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geocodeCache?.key === cacheKey) return geocodeCache.name;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RakshakApp/1.0',
        'Accept-Language': 'en',
      },
    });
    const data = await res.json();

    // Build a readable name: prefer specific area over tehsil/district
    const addr = data.address || {};
    const area = addr.neighbourhood || addr.suburb || addr.residential || addr.road
      || addr.village || addr.town || '';
    const city = addr.city || addr.state_district || '';
    const name = [area, city].filter(Boolean).join(', ')
      || data.display_name?.split(',').slice(0, 2).join(', ').trim()
      || 'Your Location';

    geocodeCache = { key: cacheKey, name };
    return name;
  } catch {
    return 'Your Location';
  }
}

// ─── Adapters: Convert backend responses → frontend models ──────────

function adaptRiskScore(backend: BackendRiskScore): SafetyScore {
  const safeScore = Math.max(0, Math.min(100, 100 - (backend.risk_score || 0)));
  const level = safeScore >= 70 ? 'high' : safeScore >= 40 ? 'medium' : 'low';

  return {
    overall: safeScore,
    level,
    factors: (backend.top_threats || [])
      .filter((t: any) => (t.category || '').toLowerCase() !== 'user_ping')
      .map((t: any, i: number) => ({
      id: `threat-${i}`,
      name: (t.category || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      icon: getCategoryIcon(t.category || ''),
      score: Math.max(0, 100 - (safeParseNumber(t.severity, 1) * 10)),
      level: (t.severity || 0) >= 7 ? 'low' as const : (t.severity || 0) >= 4 ? 'medium' as const : 'high' as const,
      description: `${safeParseNumber(t.distance_meters, 0).toFixed(0)}m away, severity ${safeParseNumber(t.severity, 0)}/10`,
    })),
    lastUpdated: new Date().toISOString(),
    location: {
      latitude: 0,
      longitude: 0,
      name: backend.location_name || 'Unknown Location',
    },
  };
}

function adaptIncident(backend: any, index: number): IncidentMarker | null {
  // Extract coordinates using flexible mapping
  const coords = mapApiCoordinates(backend);
  if (!coords) {
    console.warn(`[MAP DATA] Skipping incident ${index}: invalid coordinates`);
    return null;
  }

  const category = backend.category || 'unknown';
  const severity = safeParseNumber(backend.severity, 1);

  return {
    id: (backend.id ?? `incident-${index}`).toString(),
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: category.replace(/_/g, ' '),
    },
    type: mapCategoryToAlertType(category),
    description: `${category.replace(/_/g, ' ')} reported nearby`,
    reportedAt: backend.timestamp || new Date().toISOString(),
    severity: severity >= 7 ? 'high' : severity >= 4 ? 'moderate' : 'minor',
  };
}

function adaptHotspot(backend: any, index: number): RiskZone | null {
  // Extract coordinates — backend may use centroid_lat/centroid_lng or lat/lng or latitude/longitude
  const coords = mapApiCoordinates(backend);
  if (!coords) {
    console.warn(`[MAP DATA] Skipping hotspot ${index}: invalid coordinates`);
    return null;
  }

  const avgSeverity = safeParseNumber(backend.avg_severity, 1);
  const incidentCount = safeParseNumber(backend.incident_count, 1);
  const clusterId = backend.cluster_id ?? index;
  const level = avgSeverity >= 6 ? 'high' as const : avgSeverity >= 3 ? 'medium' as const : 'low' as const;

  return {
    id: `hotspot-${clusterId}`,
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: `Risk Zone ${clusterId}`,
    },
    radius: Math.max(200, incidentCount * 80),
    level,
    reason: `${incidentCount} incidents, avg severity ${avgSeverity.toFixed(1)}`,
    reportedAt: new Date().toISOString(),
  };
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    waterlogging: 'water',
    traffic_anomaly: 'traffic',
    street_light_outage: 'lightbulb',
    noise_complaint: 'volume-up',
    suspicious_activity: 'visibility',
  };
  return icons[category] || 'warning';
}

function mapCategoryToAlertType(category: string): any {
  const map: Record<string, string> = {
    waterlogging: 'flood',
    traffic_anomaly: 'road_closure',
    street_light_outage: 'safety',
    noise_complaint: 'general',
    suspicious_activity: 'theft',
  };
  return map[category] || 'general';
}

// ─── Safety API Service (Backend-first with mock fallback) ──────────

export const safetyApi = {
  /** Get safety/risk score for a location from backend */
  getSafetyScore: async (lat: number, lng: number): Promise<ApiResponse<SafetyScore>> => {
    try {
      console.log(`[MAP DATA RECEIVED] Requesting risk score for ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      const res = await withRetry(() =>
        backendClient.post(ENDPOINTS.calculateRisk, {
          latitude: lat,
          longitude: lng,
        })
      );
      const adapted = adaptRiskScore(res.data as BackendRiskScore);
      adapted.location.latitude = lat;
      adapted.location.longitude = lng;

      // Reverse geocode if backend didn't provide a location name
      if (!adapted.location.name || adapted.location.name === 'Unknown Location') {
        adapted.location.name = await reverseGeocode(lat, lng);
      }

      return mockResponse(adapted);
    } catch (err) {
      console.warn('[Safety API] Backend risk calc failed, using mock');
      await simulateDelay(300);
      const variation = Math.floor(Math.random() * 10) - 5;
      const score = {
        ...mockSafetyScore,
        overall: Math.max(0, Math.min(100, mockSafetyScore.overall + variation)),
        location: {
          ...mockSafetyScore.location,
          latitude: lat,
          longitude: lng,
          name: await reverseGeocode(lat, lng),
        },
      };
      return mockResponse(score);
    }
  },

  /** Get risk zone hotspots from backend PostGIS clustering */
  getRiskZones: async (lat: number, lng: number, radiusKm: number = 5): Promise<ApiResponse<RiskZone[]>> => {
    try {
      console.log('[MAP DATA RECEIVED] Requesting hotspots');
      const res = await withRetry(() =>
        backendClient.get(ENDPOINTS.hotspots)
      );
      const rawData = res.data;
      console.log(`[MAP DATA RECEIVED] Hotspots raw count: ${Array.isArray(rawData) ? rawData.length : 'non-array'}`);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.log('[MAP DATA] No hotspots from backend, using mock');
        return mockResponse(mockRiskZones);
      }

      // Filter out entries with invalid coordinates
      const zones = rawData
        .map((item: any, i: number) => adaptHotspot(item, i))
        .filter((z): z is RiskZone => z !== null);

      console.log(`[MAP OVERLAY RENDERED] ${zones.length} valid hotspot zones`);
      return mockResponse(zones.length > 0 ? zones : mockRiskZones);
    } catch (err) {
      console.warn('[Safety API] Backend hotspots failed, using mock');
      await simulateDelay(300);
      return mockResponse(mockRiskZones);
    }
  },

  /** Get incident markers from backend for a map viewport */
  getIncidents: async (lat: number, lng: number): Promise<ApiResponse<IncidentMarker[]>> => {
    try {
      const delta = 0.02;
      console.log(`[MAP DATA RECEIVED] Requesting incidents for bounds around ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      const res = await withRetry(() =>
        backendClient.get(ENDPOINTS.incidentsBounds, {
          params: {
            min_lat: lat - delta,
            max_lat: lat + delta,
            min_lng: lng - delta,
            max_lng: lng + delta,
          }
        })
      );
      const rawData = res.data;
      console.log(`[MAP DATA RECEIVED] Incidents raw count: ${Array.isArray(rawData) ? rawData.length : 'non-array'}`);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.log('[MAP DATA] No incidents from backend, using mock');
        return mockResponse(mockIncidents);
      }

      // Filter out telemetry pings and entries with invalid coordinates
      const markers = rawData
        .filter((item: any) => (item.category || '').toLowerCase() !== 'user_ping')
        .map((item: any, i: number) => adaptIncident(item, i))
        .filter((m): m is IncidentMarker => m !== null);

      console.log(`[MAP OVERLAY RENDERED] ${markers.length} valid incident markers`);
      return mockResponse(markers.length > 0 ? markers : mockIncidents);
    } catch (err) {
      console.warn('[Safety API] Backend incidents failed, using mock');
      await simulateDelay(300);
      return mockResponse(mockIncidents);
    }
  },

  /** Send user telemetry ping to backend (fire-and-forget) */
  sendTelemetry: async (lat: number, lng: number, category: string = 'user_ping'): Promise<boolean> => {
    try {
      if (!validateCoordinates(lat, lng)) {
        console.warn('[Safety API] Invalid telemetry coordinates, skipping');
        return false;
      }
      await backendClient.post(ENDPOINTS.telemetry, {
        latitude: lat,
        longitude: lng,
        category,
      });
      return true;
    } catch (err) {
      // Telemetry is fire-and-forget — never break the app
      console.warn('[Safety API] Telemetry ping failed (non-blocking)');
      return false;
    }
  },

  /** Report a safety concern (sends as telemetry with category) */
  reportConcern: async (
    lat: number,
    lng: number,
    type: string,
    description: string
  ): Promise<ApiResponse<{ reported: boolean }>> => {
    try {
      await backendClient.post(ENDPOINTS.telemetry, {
        latitude: lat,
        longitude: lng,
        category: type,
      });
      return mockResponse({ reported: true });
    } catch (err) {
      console.warn('[Safety API] Report concern failed');
      return mockResponse({ reported: false }, false);
    }
  },
};
