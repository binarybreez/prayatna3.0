import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi } from '../api/auth';

const STORAGE_KEYS = {
  user: '@rakshak_user',
  auth: '@rakshak_auth',
} as const;

interface AuthState {
  isAuthenticated: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
  hasCompletedOnboarding: boolean;

  // Actions
  loadStoredUser: () => Promise<void>;
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingComplete: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isRegistered: false,
  isLoading: false,
  isHydrated: false,
  user: null,
  token: null,
  error: null,
  hasCompletedOnboarding: false,

  loadStoredUser: async () => {
    try {
      const [userJson, authJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.auth),
      ]);

      if (userJson && authJson) {
        const user = JSON.parse(userJson) as User;
        const auth = JSON.parse(authJson);
        set({
          user,
          token: auth.token,
          isAuthenticated: true,
          isRegistered: true,
          hasCompletedOnboarding: true,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch (err) {
      set({ isHydrated: true });
    }
  },

  sendOTP: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.sendOTP({ phone });
      set({ isLoading: false });
      return response.success;
    } catch (err) {
      set({ isLoading: false, error: 'Failed to send OTP. Please try again.' });
      return false;
    }
  },

  verifyOTP: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verifyOTP({ phone, otp });
      if (response.success) {
        const user = response.data.user;
        const token = response.data.token;

        // Persist user + token to AsyncStorage for session persistence
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)),
          AsyncStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ token })),
        ]);

        // Set both isAuthenticated AND isRegistered — no separate registration step
        set({
          user,
          token,
          isAuthenticated: true,
          isRegistered: true,
          isLoading: false,
          hasCompletedOnboarding: true,
        });
        return true;
      } else {
        set({ isLoading: false, error: response.error || 'Invalid OTP' });
        return false;
      }
    } catch (err) {
      set({ isLoading: false, error: 'Verification failed. Please try again.' });
      return false;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    set({ user: updatedUser });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    } catch (err) {
      // Silent fail — non-critical
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.user),
        AsyncStorage.removeItem(STORAGE_KEYS.auth),
      ]);
    } catch (err) {
      // Cleanup error — non-critical
    }
    set({
      isAuthenticated: false,
      isRegistered: false,
      isLoading: false,
      user: null,
      token: null,
      hasCompletedOnboarding: false,
    });
  },

  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
  clearError: () => set({ error: null }),
}));
