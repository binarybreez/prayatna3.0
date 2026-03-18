import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme';
import { useAuthStore } from '../state';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/auth/SplashScreen';

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isRegistered, isHydrated, loadStoredUser } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  // Load stored user on app launch (language is handled by LanguageProvider)
  useEffect(() => {
    loadStoredUser();
  }, []);

  // Memoize navigation theme to avoid recreating every render
  const navigationTheme = useMemo(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        primary: theme.colors.primary,
      },
    };
  }, [theme]);

  // Memoize splash finish callback
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  // Show splash screen on app launch
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Wait for AsyncStorage hydration before deciding nav route
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Determine which navigator to show
  const showMainApp = isAuthenticated && isRegistered;

  return (
    <>
      <StatusBar
        barStyle={theme.colors.statusBar}
        backgroundColor={theme.colors.background}
        translucent
      />
      <NavigationContainer theme={navigationTheme}>
        {showMainApp ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
