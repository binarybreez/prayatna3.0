import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import SafetyScoreIndicator from '../../components/SafetyScoreIndicator';
import { LoadingState } from '../../components/common/StateViews';
import { routesApi } from '../../api/routes';
import { RouteOption } from '../../types';
import { getSafetyColor } from '../../utils/formatting';
import { useTranslation } from '../../i18n/LanguageContext';

interface RouteOptionsScreenProps {
  navigation: any;
}

const shadowProps = {
  shadowColor: '#EA580C',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
};

const RouteOptionsScreen: React.FC<RouteOptionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Theme Colors
  const isDarkMode = theme.isDark;
  const saffronColor = isDarkMode ? '#F97316' : '#EA580C';
  const bgColor = theme.isDark ? '#080C16' : '#FAFAFA';
  const { t } = useTranslation();

  // Real Indore coordinates: Vijay Nagar → Rajwada
  const originLat = 22.7468;
  const originLng = 75.8873;
  const destLat = 22.7185;
  const destLng = 75.8571;

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    const res = await routesApi.getRouteOptions(originLat, originLng, destLat, destLng);
    if (res.success) {
      setRoutes(res.data);
      setSelectedRoute(res.data[0]?.id || null);
    }
    setLoading(false);

    // Trigger Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Navigate to in-app live navigation screen
  const handleStartNavigation = useCallback(() => {
    if (!selectedRoute) return;

    const selected = routes.find(r => r.id === selectedRoute);
    if (!selected) return;

    navigation.navigate('LiveNavigation', { selectedRoute: selected });
  }, [selectedRoute, routes, navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Header title={t('routes.analyzingRoutes')} showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <LoadingState message={t('routes.scanningPaths')} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* Background Map Watermark */}
      <MaterialIcons 
        name="map" 
        size={400} 
        color={isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 
        style={styles.watermark} 
      />

      <Header
        title={t('routes.routeOptions')}
        subtitle="Vijay Nagar → Rajwada"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <Animated.ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Route Cards */}
        {routes.map((route) => {
          const isSelected = selectedRoute === route.id;
          
          return (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected ? saffronColor : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                  transform: [{ scale: isSelected ? 1.02 : 1 }], // Premium pop effect
                },
                isSelected && shadowProps
              ]}
              onPress={() => setSelectedRoute(route.id)}
              activeOpacity={0.9}
            >
              {/* Route Header */}
              <View style={styles.routeHeader}>
                <View style={styles.routeTypeRow}>
                  <View style={[styles.iconBox, { backgroundColor: route.type === 'safest' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                    <MaterialIcons
                      name={route.type === 'safest' ? 'verified-user' : 'electric-bolt'}
                      size={20}
                      color={route.type === 'safest' ? '#10B981' : '#F59E0B'}
                    />
                  </View>
                  <Text style={[styles.routeType, { color: theme.colors.text }]}>
                    {route.type === 'safest' ? t('routes.safestRoute') : t('routes.fastestRoute')}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.15)' : 'rgba(234, 88, 12, 0.1)' }]}>
                      <Text style={[styles.selectedText, { color: saffronColor }]}>{t('common.selected')}</Text>
                    </View>
                  )}
                </View>
                <SafetyScoreIndicator score={route.safetyScore} size="sm" showLabel={false} />
              </View>

              {/* Meta Stats Row */}
              <View style={[styles.metaRow, { borderTopColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="schedule" size={18} color={theme.colors.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    {route.duration}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <MaterialIcons name="straighten" size={18} color={theme.colors.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                    {route.distance}
                  </Text>
                </View>
              </View>

              {/* Timeline Segments (Only visible when selected) */}
              {isSelected && (
                <View style={[styles.segmentsSection, { borderTopColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
                  <Text style={[styles.segmentsTitle, { color: theme.colors.textTertiary }]}>
                    Journey Timeline
                  </Text>
                  
                  <View style={styles.timelineContainer}>
                    {route.segments.map((seg, i) => {
                      const isLast = i === route.segments.length - 1;
                      const safeColor = getSafetyColor(seg.safetyLevel);
                      
                      return (
                        <View key={i} style={styles.segmentRow}>
                          {/* Timeline Graphics */}
                          <View style={styles.timelineGraphics}>
                            <View style={[styles.segmentDot, { borderColor: safeColor }]} />
                            {!isLast && <View style={[styles.segmentLine, { backgroundColor: isDarkMode ? '#374151' : '#E2E8F0' }]} />}
                          </View>
                          
                          {/* Timeline Content */}
                          <View style={[styles.segmentContent, { paddingBottom: isLast ? 0 : 20 }]}>
                            <Text style={[styles.segmentName, { color: theme.colors.text }]}>
                              {seg.startPoint.name} <Text style={{ color: theme.colors.textTertiary }}>→</Text> {seg.endPoint.name}
                            </Text>
                            
                            <View style={styles.segmentMeta}>
                              <View style={[styles.segmentBadge, { backgroundColor: `${safeColor}15` }]}>
                                <Text style={[styles.segmentLevel, { color: safeColor }]}>
                                  {seg.safetyLevel.toUpperCase()}
                                </Text>
                              </View>
                              <Text style={[styles.segmentDist, { color: theme.colors.textTertiary }]}>
                                {seg.distance}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {/* Floating Action Button for Navigation */}
      <View style={[styles.floatingBottomBar, { paddingBottom: Math.max(insets.bottom + 16, 24) }, shadowProps, { backgroundColor: theme.colors.surface }]}>
        <Button
          title={t('routes.startNavigation')}
          onPress={handleStartNavigation}
          fullWidth
          size="lg"
          style={{ backgroundColor: saffronColor }}
          icon={<MaterialIcons name="navigation" size={22} color="#FFF" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    right: -100,
    transform: [{ rotate: '15deg' }],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  routeCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexWrap: 'wrap',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeType: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  metaText: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  segmentsTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  segmentRow: {
    flexDirection: 'row',
  },
  timelineGraphics: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  segmentDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    backgroundColor: '#FFF',
    marginTop: 2,
    zIndex: 2,
  },
  segmentLine: {
    width: 2,
    flex: 1,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  segmentContent: {
    flex: 1,
  },
  segmentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  segmentLevel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentDist: {
    fontSize: 13,
    fontWeight: '500',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default memo(RouteOptionsScreen);