import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n, { SUPPORTED_LANGUAGES } from './i18n';

const LANGUAGE_KEY = '@rakshak_language';
const SUPPORTED_CODES: string[] = SUPPORTED_LANGUAGES.map(l => l.code);

interface LanguageContextValue {
  locale: string;
  t: (key: string, options?: Record<string, any>) => string;
  changeLanguage: (langCode: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  t: (key: string) => key,
  changeLanguage: async () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocale] = useState<string>(i18n.locale);
  const [isReady, setIsReady] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved && SUPPORTED_CODES.includes(saved)) {
          i18n.locale = saved;
          setLocale(saved);
        } else {
          // Try device locale
          const deviceLocale = getLocales()?.[0]?.languageCode ?? 'en';
          const resolved = SUPPORTED_CODES.includes(deviceLocale) ? deviceLocale : 'en';
          i18n.locale = resolved;
          setLocale(resolved);
        }
      } catch (e) {
        console.warn('[LanguageProvider] Failed to load language:', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  // Change language — updates i18n + React state + persists
  const changeLanguage = useCallback(async (langCode: string) => {
    if (!SUPPORTED_CODES.includes(langCode)) return;
    i18n.locale = langCode;
    setLocale(langCode); // This triggers re-render across all consumers
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
    } catch (e) {
      console.warn('[LanguageProvider] Failed to persist language:', e);
    }
  }, []);

  // Reactive translation function — depends on `locale` state
  const t = useCallback(
    (key: string, options?: Record<string, any>) => {
      return i18n.t(key, options);
    },
    [locale] // Re-creates `t` when locale changes, forcing consumers to get fresh translations
  );

  const value = useMemo(
    () => ({ locale, t, changeLanguage }),
    [locale, t, changeLanguage]
  );

  // Don't render children until language is loaded
  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/** Hook for reactive translations — use this in every component/screen */
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
