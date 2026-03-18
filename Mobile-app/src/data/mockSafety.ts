import { SafetyScore, SafetyFactor, RiskZone, IncidentMarker } from '../types';

export const mockSafetyScore: SafetyScore = {
  overall: 72,
  level: 'medium',
  factors: [
    {
      id: 'sf_001',
      name: 'Street Lighting',
      icon: 'lightbulb-outline',
      score: 45,
      level: 'low',
      description: 'Multiple areas with poor street lighting after dark.',
    },
    {
      id: 'sf_002',
      name: 'Recent Incidents',
      icon: 'alert-circle-outline',
      score: 60,
      level: 'medium',
      description: '3 minor incidents reported in this area today.',
    },
    {
      id: 'sf_003',
      name: 'Crowd Density',
      icon: 'people-outline',
      score: 85,
      level: 'high',
      description: 'Well-populated area with good foot traffic.',
    },
    {
      id: 'sf_004',
      name: 'Weather Risk',
      icon: 'cloud-outline',
      score: 70,
      level: 'medium',
      description: 'Light fog expected in evening hours.',
    },
    {
      id: 'sf_005',
      name: 'Police Presence',
      icon: 'shield-checkmark-outline',
      score: 80,
      level: 'high',
      description: 'Active patrol in the area. Nearest post 400m.',
    },
    {
      id: 'sf_006',
      name: 'CCTV Coverage',
      icon: 'videocam-outline',
      score: 65,
      level: 'medium',
      description: 'Partial CCTV coverage. Some blind spots.',
    },
  ],
  lastUpdated: '2026-03-17T01:45:00Z',
  location: {
    latitude: 22.7196,
    longitude: 75.8577,
    name: 'Vijay Nagar',
    address: 'Vijay Nagar, Indore, MP',
  },
};

export const mockRiskZones: RiskZone[] = [
  {
    id: 'rz_001',
    location: {
      latitude: 22.7150,
      longitude: 75.8600,
      name: 'Sarafa Area',
    },
    radius: 300,
    level: 'high',
    reason: 'Multiple theft incidents reported',
    reportedAt: '2026-03-17T00:30:00Z',
  },
  {
    id: 'rz_002',
    location: {
      latitude: 22.7230,
      longitude: 75.8520,
      name: 'Old Palasia',
    },
    radius: 200,
    level: 'medium',
    reason: 'Poor street lighting',
    reportedAt: '2026-03-16T22:00:00Z',
  },
  {
    id: 'rz_003',
    location: {
      latitude: 22.7300,
      longitude: 75.8650,
      name: 'Scheme 78',
    },
    radius: 150,
    level: 'low',
    reason: 'Construction zone',
    reportedAt: '2026-03-16T18:00:00Z',
  },
  {
    id: 'rz_004',
    location: {
      latitude: 22.7050,
      longitude: 75.8530,
      name: 'Bhawarkuan',
    },
    radius: 250,
    level: 'high',
    reason: 'Accident-prone intersection',
    reportedAt: '2026-03-16T15:30:00Z',
  },
];

export const mockIncidents: IncidentMarker[] = [
  {
    id: 'inc_001',
    location: {
      latitude: 22.7196,
      longitude: 75.8577,
      name: 'Vijay Nagar Square',
    },
    type: 'accident',
    description: 'Minor vehicle collision',
    reportedAt: '2026-03-17T00:45:00Z',
    severity: 'moderate',
  },
  {
    id: 'inc_002',
    location: {
      latitude: 22.7185,
      longitude: 75.8564,
      name: 'Sarafa Bazaar',
    },
    type: 'theft',
    description: 'Chain snatching reported',
    reportedAt: '2026-03-16T23:30:00Z',
    severity: 'high',
  },
  {
    id: 'inc_003',
    location: {
      latitude: 22.7014,
      longitude: 75.8531,
      name: 'Bhawarkuan',
    },
    type: 'accident',
    description: 'Road damage causing accidents',
    reportedAt: '2026-03-16T20:00:00Z',
    severity: 'moderate',
  },
];
