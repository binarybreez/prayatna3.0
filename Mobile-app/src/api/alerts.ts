import { ApiResponse, Alert, AlertSeverity } from '../types';
import { simulateDelay, mockResponse } from './client';
import { mockAlerts } from '../data/mockAlerts';

export const alertsApi = {
  /** Get all alerts */
  getAlerts: async (severity?: AlertSeverity): Promise<ApiResponse<Alert[]>> => {
    await simulateDelay(500);
    let filtered = mockAlerts.filter((a) => a.isActive);
    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }
    return mockResponse(filtered);
  },

  /** Get alert by ID */
  getAlertById: async (id: string): Promise<ApiResponse<Alert | null>> => {
    await simulateDelay(300);
    const alert = mockAlerts.find((a) => a.id === id) || null;
    return mockResponse(alert);
  },

  /** Get alerts near location */
  getNearbyAlerts: async (
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<ApiResponse<Alert[]>> => {
    await simulateDelay(500);
    // Simple distance filter (mock)
    const nearbyAlerts = mockAlerts.filter((a) => {
      const dLat = Math.abs(a.location.latitude - lat);
      const dLng = Math.abs(a.location.longitude - lng);
      return dLat < radiusKm * 0.01 && dLng < radiusKm * 0.01;
    });
    return mockResponse(nearbyAlerts);
  },

  /** Report a new alert */
  reportAlert: async (alert: Omit<Alert, 'id' | 'timestamp' | 'isActive'>): Promise<ApiResponse<Alert>> => {
    await simulateDelay(800);
    const newAlert: Alert = {
      ...alert,
      id: 'alt_' + Date.now(),
      timestamp: new Date().toISOString(),
      isActive: true,
    };
    return mockResponse(newAlert);
  },
};
