// ─── Rakshak API Configuration ──────────────────────────────────────
// Central config for connecting to the backend FastAPI server.
// Currently using ngrok tunnel for public access.

export const API_BASE_URL = 'https://regenia-untyped-cyndi.ngrok-free.dev';

// API version prefix (matches backend's /api/v1 routes)
export const API_V1 = `${API_BASE_URL}/api/v1`;

// Individual endpoint paths
export const ENDPOINTS = {
  // Health check
  health: `${API_BASE_URL}/`,

  // Safety / Telemetry
  calculateRisk: `${API_V1}/calculate-risk`,
  telemetry: `${API_V1}/telemetry`,
  incidentsBounds: `${API_V1}/incidents/bounds`,
  hotspots: `${API_V1}/hotspots`,
  incidentsHotspots: `${API_V1}/incidents/hotspots`,

  // Admin
  triggerCleanup: `${API_V1}/admin/trigger-cleanup`,
} as const;

// Network configuration (tuned for ngrok latency)
export const NETWORK_CONFIG = {
  timeout: 15000,         // 15s timeout (ngrok adds ~2-3s latency)
  retryAttempts: 2,       // Retry failed requests up to 2 times
  retryDelay: 1500,       // 1.5s delay between retries
  telemetryInterval: 30,  // Send location ping every 30 seconds
} as const;
