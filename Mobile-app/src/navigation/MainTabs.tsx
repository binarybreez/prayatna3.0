import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useTranslation } from '../i18n/LanguageContext';
import HomeStack from './HomeStack';
import AlertsFeedScreen from '../screens/alerts/AlertsFeedScreen';
import JourneyHistoryScreen from '../screens/history/JourneyHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'explore' : 'explore';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-none';
              break;
            case 'History':
              iconName = focused ? 'history' : 'history';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          return <MaterialIcons name={iconName as any} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Alerts" component={AlertsFeedScreen} options={{ tabBarLabel: t('tabs.alerts') }} />
      <Tab.Screen name="History" component={JourneyHistoryScreen} options={{ tabBarLabel: t('tabs.history') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tabs.profile') }} />
    </Tab.Navigator>
  );
};

export default MainTabs;
