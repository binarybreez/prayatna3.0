import { create } from 'zustand';
import { SafetyScore, RiskZone, IncidentMarker } from '../types';
import { safetyApi } from '../api/safety';

interface SafetyState {
  safetyScore: SafetyScore | null;
  riskZones: RiskZone[];
  incidents: IncidentMarker[];
  isLoading: boolean;
  error: string | null;
  isBackendConnected: boolean;

  fetchSafetyScore: (lat: number, lng: number) => Promise<void>;
  fetchRiskZones: (lat: number, lng: number) => Promise<void>;
  fetchIncidents: (lat: number, lng: number) => Promise<void>;
  fetchAll: (lat: number, lng: number) => Promise<void>;
  sendTelemetry: (lat: number, lng: number) => Promise<void>;
}

export const useSafetyStore = create<SafetyState>((set) => ({
  safetyScore: null,
  riskZones: [],
  incidents: [],
  isLoading: false,
  error: null,
  isBackendConnected: false,

  fetchSafetyScore: async (lat, lng) => {
    try {
      const res = await safetyApi.getSafetyScore(lat, lng);
      if (res.success) set({ safetyScore: res.data });
    } catch (err) {
      set({ error: 'Failed to fetch safety score' });
    }
  },

  fetchRiskZones: async (lat, lng) => {
    try {
      const res = await safetyApi.getRiskZones(lat, lng);
      if (res.success) set({ riskZones: res.data });
    } catch (err) {
      set({ error: 'Failed to fetch risk zones' });
    }
  },

  fetchIncidents: async (lat, lng) => {
    try {
      const res = await safetyApi.getIncidents(lat, lng);
      if (res.success) set({ incidents: res.data });
    } catch (err) {
      set({ error: 'Failed to fetch incidents' });
    }
  },

  fetchAll: async (lat, lng) => {
    set({ isLoading: true, error: null });
    try {
      const [scoreRes, zonesRes, incidentsRes] = await Promise.all([
        safetyApi.getSafetyScore(lat, lng),
        safetyApi.getRiskZones(lat, lng),
        safetyApi.getIncidents(lat, lng),
      ]);
      set({
        safetyScore: scoreRes.success ? scoreRes.data : null,
        riskZones: zonesRes.success ? zonesRes.data : [],
        incidents: incidentsRes.success ? incidentsRes.data : [],
        isLoading: false,
        isBackendConnected: true,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load safety data', isBackendConnected: false });
    }
  },

  sendTelemetry: async (lat, lng) => {
    try {
      const success = await safetyApi.sendTelemetry(lat, lng);
      if (success) set({ isBackendConnected: true });
    } catch (err) {
      // Telemetry is fire-and-forget, don't surface errors to user
    }
  },
}));
