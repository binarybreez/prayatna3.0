// ─── Core Data Models ───────────────────────────────────────────────

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  city: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  email?: string;
  avatar?: string;
  emergencyContacts: EmergencyContact[];
  preferences: UserPreferences;
  createdAt: string;
  profileImage?: string | null;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface UserPreferences {
  liveLocationSharing: boolean;
  areaSafetyAlerts: boolean;
  darkMode: 'light' | 'dark' | 'system';
  biometricLogin: boolean;
}

// ─── Safety ─────────────────────────────────────────────────────────

export type SafetyLevel = 'high' | 'medium' | 'low';

export interface SafetyScore {
  overall: number; // 0-100
  level: SafetyLevel;
  factors: SafetyFactor[];
  lastUpdated: string;
  location: Location;
}

export interface SafetyFactor {
  id: string;
  name: string;
  icon: string;
  score: number; // 0-100
  level: SafetyLevel;
  description: string;
}

export interface RiskZone {
  id: string;
  location: Location;
  radius: number; // meters
  level: SafetyLevel;
  reason: string;
  reportedAt: string;
}

export interface IncidentMarker {
  id: string;
  location: Location;
  type: AlertCategory;
  description: string;
  reportedAt: string;
  severity: AlertSeverity;
}

// ─── Alerts ─────────────────────────────────────────────────────────

export type AlertSeverity = 'high' | 'moderate' | 'minor';
export type AlertCategory = 'accident' | 'safety' | 'road_closure' | 'flood' | 'fire' | 'theft' | 'general';

export interface Alert {
  id: string;
  title: string;
  description: string;
  location: Location;
  severity: AlertSeverity;
  category: AlertCategory;
  timestamp: string;
  isActive: boolean;
  reportedBy?: string;
}

// ─── Routes ─────────────────────────────────────────────────────────

export type RouteType = 'fastest' | 'safest';

export interface RouteOption {
  id: string;
  type: RouteType;
  origin: Location;
  destination: Location;
  waypoints: Location[];
  distance: string;
  duration: string;
  safetyScore: number;
  segments: RouteSegment[];
}

export interface RouteSegment {
  startPoint: Location;
  endPoint: Location;
  safetyLevel: SafetyLevel;
  distance: string;
}

// ─── Journey ────────────────────────────────────────────────────────

export interface Journey {
  id: string;
  origin: Location;
  destination: Location;
  date: string;
  duration: string;
  distance: string;
  safetyScore: number;
  routeType: RouteType;
  waypoints: Location[];
}

// ─── API Response ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  totalPages: number;
  totalItems: number;
}

// ─── Backend Response Types (FastAPI / Supabase) ────────────────────
// These match the exact shape returned by the Rakshak Intelligence API

export interface BackendIncidentDetail {
  category: string;
  distance_meters: number;
  severity: number;
}

export interface BackendRiskScore {
  risk_score: number;          // 0-100
  color_code: 'Green' | 'Yellow' | 'Red';
  nearby_incident_count: number;
  top_threats: BackendIncidentDetail[];
  message: string;
  location_name: string;
}

export interface BackendIncident {
  id?: number;
  category: string;
  severity: number;
  latitude: number;
  longitude: number;
  distance?: number;
  timestamp?: string;
}

export interface BackendHotspot {
  cluster_id: number;
  centroid_lat: number;
  centroid_lng: number;
  incident_count: number;
  avg_severity: number;
  convex_hull?: string; // GeoJSON or WKT polygon
}

export interface BackendTelemetryResponse {
  status: string;
  message: string;
}
