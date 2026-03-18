import { RouteOption, Journey } from '../types';

// Real Indore landmark coordinates
// Vijay Nagar:    22.7468, 75.8873
// Old Palasia:    22.7350, 75.8800
// Chhappan Dukan: 22.7240, 75.8680
// Rajwada:        22.7185, 75.8571
// Scheme 54:      22.7410, 75.8950
// MG Road:        22.7270, 75.8620
// GPO Square:     22.7210, 75.8590

export const mockRoutes: RouteOption[] = [
  {
    id: 'rt_001',
    type: 'fastest',
    origin: {
      latitude: 22.7468,
      longitude: 75.8873,
      name: 'Vijay Nagar',
    },
    destination: {
      latitude: 22.7185,
      longitude: 75.8571,
      name: 'Rajwada',
    },
    waypoints: [
      { latitude: 22.7350, longitude: 75.8800, name: 'Old Palasia' },
      { latitude: 22.7240, longitude: 75.8680, name: 'Chhappan Dukan' },
    ],
    distance: '4.2 km',
    duration: '14 min',
    safetyScore: 62,
    segments: [
      {
        startPoint: { latitude: 22.7468, longitude: 75.8873, name: 'Vijay Nagar' },
        endPoint: { latitude: 22.7350, longitude: 75.8800, name: 'Old Palasia' },
        safetyLevel: 'medium',
        distance: '1.5 km',
      },
      {
        startPoint: { latitude: 22.7350, longitude: 75.8800, name: 'Old Palasia' },
        endPoint: { latitude: 22.7240, longitude: 75.8680, name: 'Chhappan Dukan' },
        safetyLevel: 'low',
        distance: '1.2 km',
      },
      {
        startPoint: { latitude: 22.7240, longitude: 75.8680, name: 'Chhappan Dukan' },
        endPoint: { latitude: 22.7185, longitude: 75.8571, name: 'Rajwada' },
        safetyLevel: 'high',
        distance: '1.5 km',
      },
    ],
  },
  {
    id: 'rt_002',
    type: 'safest',
    origin: {
      latitude: 22.7468,
      longitude: 75.8873,
      name: 'Vijay Nagar',
    },
    destination: {
      latitude: 22.7185,
      longitude: 75.8571,
      name: 'Rajwada',
    },
    waypoints: [
      { latitude: 22.7410, longitude: 75.8950, name: 'Scheme 54' },
      { latitude: 22.7270, longitude: 75.8620, name: 'MG Road' },
      { latitude: 22.7210, longitude: 75.8590, name: 'GPO Square' },
    ],
    distance: '5.8 km',
    duration: '22 min',
    safetyScore: 88,
    segments: [
      {
        startPoint: { latitude: 22.7468, longitude: 75.8873, name: 'Vijay Nagar' },
        endPoint: { latitude: 22.7410, longitude: 75.8950, name: 'Scheme 54' },
        safetyLevel: 'high',
        distance: '1.8 km',
      },
      {
        startPoint: { latitude: 22.7410, longitude: 75.8950, name: 'Scheme 54' },
        endPoint: { latitude: 22.7270, longitude: 75.8620, name: 'MG Road' },
        safetyLevel: 'high',
        distance: '2.0 km',
      },
      {
        startPoint: { latitude: 22.7270, longitude: 75.8620, name: 'MG Road' },
        endPoint: { latitude: 22.7185, longitude: 75.8571, name: 'Rajwada' },
        safetyLevel: 'medium',
        distance: '2.0 km',
      },
    ],
  },
];

export const mockJourneys: Journey[] = [
  {
    id: 'jrn_001',
    origin: {
      latitude: 22.7468,
      longitude: 75.8873,
      name: 'Vijay Nagar',
    },
    destination: {
      latitude: 22.7185,
      longitude: 75.8571,
      name: 'Rajwada',
    },
    date: '2026-03-16T09:30:00Z',
    duration: '18 min',
    distance: '4.8 km',
    safetyScore: 85,
    routeType: 'safest',
    waypoints: [
      { latitude: 22.7410, longitude: 75.8950, name: 'Scheme 54' },
      { latitude: 22.7270, longitude: 75.8620, name: 'MG Road' },
    ],
  },
  {
    id: 'jrn_002',
    origin: {
      latitude: 22.6952,
      longitude: 75.8679,
      name: 'Palasia',
    },
    destination: {
      latitude: 22.7270,
      longitude: 75.8620,
      name: 'MG Road',
    },
    date: '2026-03-15T14:15:00Z',
    duration: '12 min',
    distance: '3.2 km',
    safetyScore: 72,
    routeType: 'fastest',
    waypoints: [
      { latitude: 22.7100, longitude: 75.8600, name: 'GPO' },
    ],
  },
  {
    id: 'jrn_003',
    origin: {
      latitude: 22.7014,
      longitude: 75.8531,
      name: 'Bhawarkuan',
    },
    destination: {
      latitude: 22.7533,
      longitude: 75.8937,
      name: 'IT Park',
    },
    date: '2026-03-14T08:00:00Z',
    duration: '25 min',
    distance: '7.1 km',
    safetyScore: 91,
    routeType: 'safest',
    waypoints: [
      { latitude: 22.7468, longitude: 75.8873, name: 'Vijay Nagar' },
      { latitude: 22.7400, longitude: 75.8800, name: 'Super Corridor' },
    ],
  },
  {
    id: 'jrn_004',
    origin: {
      latitude: 22.7468,
      longitude: 75.8873,
      name: 'Vijay Nagar',
    },
    destination: {
      latitude: 22.6952,
      longitude: 75.8679,
      name: 'Palasia Market',
    },
    date: '2026-03-13T17:30:00Z',
    duration: '15 min',
    distance: '3.5 km',
    safetyScore: 68,
    routeType: 'fastest',
    waypoints: [],
  },
];
