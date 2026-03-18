import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../theme';
import { fetchRoute, RouteCoordinate } from '../../api/routeService';
import { RouteOption } from '../../types';

const { width } = Dimensions.get('window');

// Dark map style matching HomeMapScreen
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
];

interface LiveNavigationScreenProps {
  navigation: any;
  route: { params: { selectedRoute: RouteOption } };
}

const LiveNavigationScreen = memo(({ navigation, route: navRoute }: LiveNavigationScreenProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const selectedRoute = navRoute.params.selectedRoute;
  const { origin, destination } = selectedRoute;

  const [routeCoords, setRouteCoords] = useState<RouteCoordinate[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [userLocation, setUserLocation] = useState<RouteCoordinate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const isDark = theme.isDark;
  const saffronColor = isDark ? '#F97316' : '#EA580C';
  const mapStyle = useMemo(() => (isDark ? darkMapStyle : []), [isDark]);

  // Format distance
  const formattedDistance = useMemo(() => {
    if (!routeInfo) return '--';
    const km = routeInfo.distance / 1000;
    return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(routeInfo.distance)} m`;
  }, [routeInfo]);

  // Format ETA
  const formattedETA = useMemo(() => {
    if (!routeInfo || routeInfo.duration === 0) return selectedRoute.duration;
    const mins = Math.round(routeInfo.duration / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }, [routeInfo, selectedRoute.duration]);

  // Fetch route from OSRM
  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchRoute(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
        );

        if (!cancelled) {
          setRouteCoords(result.coordinates);
          setRouteInfo({ distance: result.distance, duration: result.duration });

          // Fit map to show full route
          if (mapRef.current && result.coordinates.length > 1) {
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 120, bottom: 200, left: 60, right: 60 },
                animated: true,
              });
            }, 500);
          }
        }
      } catch {
        if (!cancelled) setError('Unable to fetch route. Showing direct path.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    loadRoute();
    return () => { cancelled = true; };
  }, [origin, destination]);

  // Track user location
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let hasInitialLock = false;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied. Cannot track your position.');
          return;
        }

        // Get initial high-accuracy position
        try {
          const initial = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setUserLocation({
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
          });
        } catch {
          // Will get location from watcher
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
            const coord = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(coord);

            // Auto-center map on first GPS lock
            if (!hasInitialLock && mapRef.current) {
              hasInitialLock = true;
              mapRef.current.animateToRegion({
                ...coord,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 800);
            }
          },
        );
        locationSubscription.current = sub;
      } catch {
        setError('Unable to access GPS. Location tracking unavailable.');
      }
    };

    startTracking();

    return () => {
      sub?.remove();
    };
  }, []);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 600);
    }
  }, [userLocation]);

  // Fit route to screen
  const fitRoute = useCallback(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 120, bottom: 200, left: 60, right: 60 },
        animated: true,
      });
    }
  }, [routeCoords]);

  const handleEndNavigation = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const initialRegion = useMemo(() => ({
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 2.5 + 0.01,
    longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 2.5 + 0.01,
  }), [origin, destination]);

  const routeColor = selectedRoute.type === 'safest' ? '#10B981' : saffronColor;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        customMapStyle={mapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        pitchEnabled
      >
        {/* Route Polyline */}
        {routeCoords.length > 1 && (
          <>
            {/* Shadow polyline */}
            <Polyline
              coordinates={routeCoords}
              strokeColor="rgba(0,0,0,0.15)"
              strokeWidth={8}
            />
            {/* Main polyline */}
            <Polyline
              coordinates={routeCoords}
              strokeColor={routeColor}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* Origin Marker */}
        <Marker coordinate={origin} title={origin.name} description="Start">
          <View style={[styles.markerOuter, { borderColor: '#10B981' }]}>
            <View style={[styles.markerInner, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="my-location" size={14} color="#FFF" />
            </View>
          </View>
        </Marker>

        {/* Destination Marker */}
        <Marker coordinate={destination} title={destination.name} description="Destination">
          <View style={[styles.markerOuter, { borderColor: '#EF4444' }]}>
            <View style={[styles.markerInner, { backgroundColor: '#EF4444' }]}>
              <MaterialIcons name="flag" size={14} color="#FFF" />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="large" color={saffronColor} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Fetching route...
            </Text>
          </View>
        </View>
      )}

      {/* Top Bar: Back + Route Fit */}
      <Animated.View
        style={[
          styles.topBar,
          { top: Math.max(insets.top + 8, 44), opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity
          style={[styles.circleBtn, { backgroundColor: theme.colors.surface }]}
          onPress={handleEndNavigation}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: theme.colors.surface }]}
            onPress={fitRoute}
            activeOpacity={0.8}
          >
            <MaterialIcons name="zoom-out-map" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: theme.colors.surface }]}
            onPress={centerOnUser}
            activeOpacity={0.8}
          >
            <MaterialIcons name="my-location" size={20} color={saffronColor} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Bottom Info Bar */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom + 12, 24),
            backgroundColor: theme.colors.surface,
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Route badge */}
        <View style={[styles.routeBadge, { backgroundColor: `${routeColor}15` }]}>
          <MaterialIcons
            name={selectedRoute.type === 'safest' ? 'verified-user' : 'electric-bolt'}
            size={16}
            color={routeColor}
          />
          <Text style={[styles.routeBadgeText, { color: routeColor }]}>
            {selectedRoute.type === 'safest' ? 'Safest Route' : 'Fastest Route'}
          </Text>
        </View>

        {/* Route info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{formattedETA}</Text>
            <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>ETA</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoItem}>
            <MaterialIcons name="straighten" size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{formattedDistance}</Text>
            <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Distance</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoItem}>
            <MaterialIcons name="shield" size={20} color={theme.colors.textTertiary} />
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedRoute.safetyScore}</Text>
            <Text style={[styles.infoLabel, { color: theme.colors.textTertiary }]}>Safety</Text>
          </View>
        </View>

        {/* Destination label */}
        <View style={styles.destRow}>
          <MaterialIcons name="place" size={18} color="#EF4444" />
          <Text style={[styles.destText, { color: theme.colors.text }]} numberOfLines={1}>
            {origin.name} → {destination.name}
          </Text>
        </View>

        {/* End Navigation Button */}
        <TouchableOpacity
          style={[styles.endBtn, { backgroundColor: '#EF4444' }]}
          onPress={handleEndNavigation}
          activeOpacity={0.85}
        >
          <MaterialIcons name="close" size={20} color="#FFF" />
          <Text style={styles.endBtnText}>End Navigation</Text>
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  loadingCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoDivider: {
    width: 1,
    height: 40,
    alignSelf: 'center',
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  destText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  endBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  markerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  markerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveNavigationScreen;
