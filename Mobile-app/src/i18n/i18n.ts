import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
] as const;

const i18n = new I18n({ en, hi, mr, gu });

// Defaults
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Set initial locale from device
const deviceLocale = getLocales()?.[0]?.languageCode ?? 'en';
i18n.locale = ['en', 'hi', 'mr', 'gu'].includes(deviceLocale) ? deviceLocale : 'en';

export default i18n;
