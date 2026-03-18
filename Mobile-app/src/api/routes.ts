import { ApiResponse, RouteOption, Journey } from '../types';
import { simulateDelay, mockResponse } from './client';
import { mockRoutes, mockJourneys } from '../data/mockRoutes';

export const routesApi = {
  /** Get route options between two points */
  getRouteOptions: async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<ApiResponse<RouteOption[]>> => {
    await simulateDelay(800);
    return mockResponse(mockRoutes);
  },

  /** Get journey history */
  getJourneyHistory: async (): Promise<ApiResponse<Journey[]>> => {
    await simulateDelay(500);
    return mockResponse(mockJourneys);
  },

  /** Get journey by ID */
  getJourneyById: async (id: string): Promise<ApiResponse<Journey | null>> => {
    await simulateDelay(300);
    const journey = mockJourneys.find((j) => j.id === id) || null;
    return mockResponse(journey);
  },

  /** Start a new journey */
  startJourney: async (routeId: string): Promise<ApiResponse<Journey>> => {
    await simulateDelay(500);
    const route = mockRoutes.find((r) => r.id === routeId) || mockRoutes[0];
    const journey: Journey = {
      id: 'jrn_' + Date.now(),
      origin: route.origin,
      destination: route.destination,
      date: new Date().toISOString(),
      duration: route.duration,
      distance: route.distance,
      safetyScore: route.safetyScore,
      routeType: route.type,
      waypoints: route.waypoints,
    };
    return mockResponse(journey);
  },
};
