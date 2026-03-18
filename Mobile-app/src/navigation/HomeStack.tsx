import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeMapScreen from '../screens/home/HomeMapScreen';
import SafetyDetailScreen from '../screens/safety/SafetyDetailScreen';
import RouteOptionsScreen from '../screens/routes/RouteOptionsScreen';
import ReportIncidentScreen from '../screens/safety/ReportIncidentScreen';
import NearbyIncidentsScreen from '../screens/safety/NearbyIncidentsScreen';
import LiveNavigationScreen from '../screens/navigation/LiveNavigationScreen';
import { RouteOption } from '../types';

export type HomeStackParamList = {
  HomeMap: undefined;
  SafetyDetail: undefined;
  RouteOptions: undefined;
  ReportIncident: undefined;
  NearbyIncidents: undefined;
  LiveNavigation: { selectedRoute: RouteOption };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeMap" component={HomeMapScreen} />
      <Stack.Screen name="SafetyDetail" component={SafetyDetailScreen} />
      <Stack.Screen name="RouteOptions" component={RouteOptionsScreen} />
      <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
      <Stack.Screen name="NearbyIncidents" component={NearbyIncidentsScreen} />
      <Stack.Screen name="LiveNavigation" component={LiveNavigationScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;
