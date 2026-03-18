import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  THEME_MODE: '@rakshak_theme_mode',
  CACHED_ALERTS: '@rakshak_cached_alerts',
  LAST_MAP_LOCATION: '@rakshak_last_map_location',
  JOURNEY_HISTORY: '@rakshak_journey_history',
  ONBOARDING_COMPLETE: '@rakshak_onboarding_complete',
  USER_PREFERENCES: '@rakshak_user_preferences',
};

export const storage = {
  /** Save data to AsyncStorage */
  set: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (err) {
      console.error('[Storage] Error saving:', key, err);
    }
  },

  /** Get data from AsyncStorage */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (err) {
      console.error('[Storage] Error reading:', key, err);
      return null;
    }
  },

  /** Remove data from AsyncStorage */
  remove: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error('[Storage] Error removing:', key, err);
    }
  },

  /** Clear all app storage */
  clearAll: async (): Promise<void> => {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (err) {
      console.error('[Storage] Error clearing:', err);
    }
  },
};

export { STORAGE_KEYS };
