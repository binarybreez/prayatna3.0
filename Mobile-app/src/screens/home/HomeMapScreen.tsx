import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../theme';
import { useSafetyStore, useAlertsStore, useAuthStore } from '../../state';
import SafetyScoreIndicator from '../../components/SafetyScoreIndicator';
import { getSafetyColor } from '../../utils/formatting';
import { useTranslation } from '../../i18n/LanguageContext';

const { width } = Dimensions.get('window');

// Default fallback region
const INDORE_REGION = {
  latitude: 22.7326,
  longitude: 75.8722,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

// Premium "Midnight Blue" Dark Mode Map Style
const premiumDarkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0b1320' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
];

const EMPTY_MAP_STYLE: any[] = [];

// Refined soft-diffused shadows for a premium floating effect
const shadowProps = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

const IncidentMapMarker = memo(({ incident }: { incident: any }) => {
  const color = getSafetyColor(incident.severity === 'high' ? 'low' : 'medium');
  return (
    <Marker
      key={incident.id}
      coordinate={{
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
      }}
      title={incident.description}
      description={incident.location.name}
    >
      <View style={[styles.markerContainer, { backgroundColor: color }]}>
        <MaterialIcons name="priority-high" size={14} color="#FFF" />
      </View>
    </Marker>
  );
});

const HomeMapScreen = memo(({ navigation }: { navigation: any }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { safetyScore, riskZones, incidents, fetchAll, sendTelemetry } = useSafetyStore();
  const { alerts, fetchAlerts } = useAlertsStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'User', [user?.name]);

  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const mapRef = useRef<MapView>(null);
  const latestCoords = useRef({ lat: INDORE_REGION.latitude, lng: INDORE_REGION.longitude });
  const hasCenteredInitial = useRef(false); // Tracks if we've successfully flown to the user

  // Animations
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideTopAnim = useRef(new Animated.Value(-100)).current;
  const slideBottomAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isDark = theme.isDark;
  const saffronColor = isDark ? '#F97316' : '#EA580C';
  const cardBorder = useMemo(
    () => (isDark ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' } : { borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }),
    [isDark]
  );
  const mapStyle = useMemo(() => (isDark ? premiumDarkMapStyle : EMPTY_MAP_STYLE), [isDark]);

  const validRiskZones = useMemo(
    () =>
      riskZones.filter(
        (zone) =>
          zone.location &&
          typeof zone.location.latitude === 'number' && isFinite(zone.location.latitude) &&
          typeof zone.location.longitude === 'number' && isFinite(zone.location.longitude) &&
          typeof zone.radius === 'number' && zone.radius > 0
      ),
    [riskZones]
  );

  const validIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          incident.location &&
          typeof incident.location.latitude === 'number' && isFinite(incident.location.latitude) &&
          typeof incident.location.longitude === 'number' && isFinite(incident.location.longitude)
      ),
    [incidents]
  );

  const latestAlert = useMemo(() => alerts[0], [alerts]);

  const goToSafetyDetail = useCallback(() => navigation.navigate('SafetyDetail'), [navigation]);
  const goToNearbyIncidents = useCallback(() => navigation.navigate('NearbyIncidents'), [navigation]);
  const goToRouteOptions = useCallback(() => navigation.navigate('RouteOptions'), [navigation]);
  const goToReportIncident = useCallback(() => navigation.navigate('ReportIncident'), [navigation]);

  // --- Location Logistics Engine ---
  const flyToLocation = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 1200); // Smooth 1.2s flight
  }, []);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    // If location was fetched before map rendered, fly to it now.
    if (!hasCenteredInitial.current && latestCoords.current.lat !== INDORE_REGION.latitude) {
      flyToLocation(latestCoords.current.lat, latestCoords.current.lng);
      hasCenteredInitial.current = true;
    }
  }, [flyToLocation]);

  // Manual Locate Me Button
  const handleCenterLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High // User pressed the button, demand high accuracy
      });
      flyToLocation(loc.coords.latitude, loc.coords.longitude);
      latestCoords.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch (e) {
      console.warn("Could not fetch location manually");
    } finally {
      setIsLocating(false);
    }
  }, [flyToLocation]);

  useEffect(() => {
    fetchAll(INDORE_REGION.latitude, INDORE_REGION.longitude);
    fetchAlerts();

    let locationSub: Location.LocationSubscription | null = null;
    let telemetryTimer: ReturnType<typeof setInterval> | null = null;

    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setIsLocating(false);
          return;
        }
        setHasLocationPermission(true);

        // 1. Instantly grab last known to get coordinates quickly
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          latestCoords.current = { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
          // If map is already ready, fly immediately
          if (mapReady && !hasCenteredInitial.current) {
            flyToLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
            hasCenteredInitial.current = true;
          }
        }

        // 2. Start continuous passive tracking to keep 'latestCoords' fresh
        locationSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 15,
          },
          (loc) => {
            const { latitude, longitude } = loc.coords;
            latestCoords.current = { lat: latitude, lng: longitude };
            
            // If this is the first lock and the map is ready, fly to it
            if (mapReady && !hasCenteredInitial.current) {
              flyToLocation(latitude, longitude);
              hasCenteredInitial.current = true;
              fetchAll(latitude, longitude); // Fetch area data for real location
            }
            
            setIsLocating(false); // We have a lock, turn off loading spinner
          }
        );

        // 3. Background Telemetry Loop
        telemetryTimer = setInterval(() => {
          sendTelemetry(latestCoords.current.lat, latestCoords.current.lng);
        }, 30000);

      } catch (err) {
        setIsLocating(false);
      }
    };

    initLocation();

    return () => {
      locationSub?.remove();
      if (telemetryTimer) clearInterval(telemetryTimer);
    };
  }, [fetchAll, fetchAlerts, flyToLocation, sendTelemetry, mapReady]);

  useEffect(() => {
    if (mapReady) {
      Animated.parallel([
        Animated.spring(slideTopAnim, {
          toValue: 0,
          friction: 9,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(slideBottomAnim, {
          toValue: 0,
          friction: 9,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ).start();
    }
  }, [mapReady]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Uncontrolled MapView allows user to freely pan */}
      <MapView
        ref={mapRef} 
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INDORE_REGION} 
        onMapReady={handleMapReady}
        showsUserLocation={hasLocationPermission}
        followsUserLocation={false} // Prevents jarring snaps when panning
        showsMyLocationButton={false} 
        showsCompass={false}
        mapType="standard"
        customMapStyle={mapStyle}
        pitchEnabled={true}
        showsBuildings={true}
      >
        {mapReady && validRiskZones.map((zone) => (
          <Circle
            key={zone.id}
            center={{ latitude: zone.location.latitude, longitude: zone.location.longitude }}
            radius={zone.radius}
            fillColor={
              zone.level === 'high'
                ? 'rgba(239, 68, 68, 0.12)'
                : zone.level === 'medium'
                  ? 'rgba(249, 115, 22, 0.10)'
                  : 'rgba(107, 114, 128, 0.08)'
            }
            strokeColor={zone.level === 'medium' ? saffronColor : getSafetyColor(zone.level)}
            strokeWidth={1.5}
          />
        ))}

        {mapReady && validIncidents.map((incident) => (
          <IncidentMapMarker key={incident.id} incident={incident} />
        ))}
      </MapView>

      {/* Top UI Container */}
      <Animated.View
        style={[
          styles.topContainer,
          {
            top: Math.max(insets.top + 12, 40),
            opacity: fadeAnim,
            transform: [{ translateY: slideTopAnim }]
          }
        ]}
      >
        <View style={[styles.topBarContent, { backgroundColor: theme.colors.surface }, shadowProps, cardBorder]}>
          <View style={[styles.logoCircle, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 88, 12, 0.08)' }]}>
            <MaterialIcons name="shield" size={18} color={saffronColor} />
          </View>
          <Text style={[styles.appTitle, { color: theme.colors.text }]}>{t('home.greeting', { name: firstName })}</Text>
          <View style={styles.flexSpacer} />
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
            onPress={goToSafetyDetail}
            activeOpacity={0.7}
          >
            <MaterialIcons name="analytics" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
            onPress={goToNearbyIncidents}
            activeOpacity={0.7}
          >
            <MaterialIcons name="list-alt" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
            onPress={goToRouteOptions}
            activeOpacity={0.7}
          >
            <MaterialIcons name="directions" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {safetyScore && (
          <TouchableOpacity
            style={[styles.scoreCard, { backgroundColor: theme.colors.surface }, shadowProps, cardBorder]}
            onPress={goToSafetyDetail}
            activeOpacity={0.85}
          >
            <SafetyScoreIndicator score={safetyScore.overall} size="sm" showLabel={false} />
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreLabel, { color: theme.colors.textTertiary }]}>SAFETY SCORE</Text>
              <Text style={[styles.scoreArea, { color: theme.colors.text }]} numberOfLines={1}>
                {safetyScore.location.name}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} style={styles.chevron} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Floating Locate Me Button */}
      <Animated.View
        style={[
          styles.locationFabContainer,
          {
            bottom: latestAlert ? 156 : 104, // Dynamic positioning to float above alert/SOS
            opacity: fadeAnim
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.locationFab, { backgroundColor: theme.colors.surface }, shadowProps, cardBorder]}
          onPress={handleCenterLocation}
          activeOpacity={0.85}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={saffronColor} />
          ) : (
            <MaterialIcons
              name="my-location"
              size={22}
              color={theme.colors.text}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom UI Container */}
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            bottom: 24,
            opacity: fadeAnim,
            transform: [{ translateY: slideBottomAnim }]
          }
        ]}
      >
        <View style={styles.sosWrapper}>
          <View style={styles.sosContainer}>
            <Animated.View
              style={[
                styles.sosPulse,
                {
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.8],
                    })
                  }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 0.3, 0],
                  }),
                },
              ]}
            />
            <TouchableOpacity style={[styles.sosButton, shadowProps]} activeOpacity={0.85} onPress={goToReportIncident}>
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {latestAlert && (
          <TouchableOpacity
            style={[styles.alertPreview, { backgroundColor: theme.colors.surface }, shadowProps, cardBorder]}
            activeOpacity={0.9}
            onPress={goToNearbyIncidents}
          >
            <View style={styles.alertAccentBar} />
            <View style={styles.alertContent}>
              <View style={[styles.alertHeader, { borderBottomColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                <View style={[styles.alertIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <MaterialIcons name="warning-amber" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.alertPreviewTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  Alert near {latestAlert.location.name}
                </Text>
              </View>
              <View style={styles.alertPreviewBody}>
                <Text style={[styles.alertPreviewText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {latestAlert.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
  flexSpacer: {
    flex: 1,
  },
  topContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 16,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 100, // SaaS-style pill
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 16,
    borderRadius: 20,
    gap: 14,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  scoreInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  scoreArea: {
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
  },
  locationFabContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 9,
  },
  locationFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  sosWrapper: {
    alignItems: 'flex-end',
    width: '100%',
    paddingRight: 8,
    marginBottom: 16,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sosText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  alertPreview: {
    width: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  alertAccentBar: {
    width: 4,
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertPreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  alertPreviewBody: {
    padding: 16,
    paddingTop: 12,
  },
  alertPreviewText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default HomeMapScreen;