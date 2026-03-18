import { User, EmergencyContact } from '../types';

export const mockUser: User = {
  id: 'usr_001',
  name: 'Sujal Sharma',
  phone: '+91 98765 43210',
  city: 'Indore',
  emergencyContacts: [
    {
      id: 'ec_001',
      name: 'Rajiv Verma',
      relation: 'Father',
      phone: '+91 98765 43210',
    },
    {
      id: 'ec_002',
      name: 'Sunita Verma',
      relation: 'Mother',
      phone: '+91 98765 43211',
    },
    {
      id: 'ec_003',
      name: 'Amit Gupta',
      relation: 'Friend',
      phone: '+91 87654 32109',
    },
  ],
  preferences: {
    liveLocationSharing: true,
    areaSafetyAlerts: true,
    darkMode: 'system',
    biometricLogin: false,
  },
  createdAt: '2025-08-15T10:30:00Z',
};

export const mockUsers = [
  mockUser,
  {
    id: 'usr_002',
    name: 'Amit Gupta',
    phone: '+91 87654 32109',
    city: 'Bhopal',
    emergencyContacts: [],
    preferences: {
      liveLocationSharing: false,
      areaSafetyAlerts: true,
      darkMode: 'light' as const,
      biometricLogin: true,
    },
    createdAt: '2025-09-01T08:00:00Z',
  },
  {
    id: 'usr_003',
    name: 'Rohit Sharma',
    phone: '+91 76543 21098',
    city: 'Ahmedabad',
    emergencyContacts: [],
    preferences: {
      liveLocationSharing: true,
      areaSafetyAlerts: false,
      darkMode: 'dark' as const,
      biometricLogin: false,
    },
    createdAt: '2025-10-12T14:15:00Z',
  },
];
