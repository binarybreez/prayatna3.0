import { ApiResponse, User, EmergencyContact, UserPreferences } from '../types';
import { simulateDelay, mockResponse } from './client';
import { mockUser } from '../data/mockUser';

let currentUser = { ...mockUser };

export const userApi = {
  /** Get current user profile */
  getProfile: async (): Promise<ApiResponse<User>> => {
    await simulateDelay(400);
    return mockResponse(currentUser);
  },

  /** Update user profile */
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    await simulateDelay(600);
    currentUser = { ...currentUser, ...updates };
    return mockResponse(currentUser);
  },

  /** Update user preferences */
  updatePreferences: async (prefs: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> => {
    await simulateDelay(400);
    currentUser.preferences = { ...currentUser.preferences, ...prefs };
    return mockResponse(currentUser.preferences);
  },

  /** Add emergency contact */
  addEmergencyContact: async (contact: Omit<EmergencyContact, 'id'>): Promise<ApiResponse<EmergencyContact>> => {
    await simulateDelay(500);
    const newContact: EmergencyContact = {
      ...contact,
      id: 'ec_' + Date.now(),
    };
    currentUser.emergencyContacts.push(newContact);
    return mockResponse(newContact);
  },

  /** Remove emergency contact */
  removeEmergencyContact: async (contactId: string): Promise<ApiResponse<null>> => {
    await simulateDelay(300);
    currentUser.emergencyContacts = currentUser.emergencyContacts.filter((c) => c.id !== contactId);
    return mockResponse(null);
  },

  /** Change password (mock) */
  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    await simulateDelay(600);
    return mockResponse(null);
  },
};
