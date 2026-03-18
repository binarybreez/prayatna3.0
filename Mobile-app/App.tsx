import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
