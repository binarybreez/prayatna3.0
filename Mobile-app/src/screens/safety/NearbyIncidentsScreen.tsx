import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../theme';
import Header from '../../components/common/Header';
import { LoadingState, EmptyState } from '../../components/common/StateViews';
import { safetyApi } from '../../api/safety';
import { IncidentMarker } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

const shadowProps = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
};

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  waterlogging: { icon: 'water-drop', color: '#3B82F6', label: 'Waterlogging' },
  traffic_anomaly: { icon: 'traffic', color: '#F59E0B', label: 'Traffic Anomaly' },
  street_light_outage: { icon: 'lightbulb', color: '#8B5CF6', label: 'Street Light Out' },
  noise_complaint: { icon: 'volume-up', color: '#EC4899', label: 'Noise Complaint' },
  suspicious_activity: { icon: 'visibility', color: '#EF4444', label: 'Suspicious Activity' },
  flood: { icon: 'water-drop', color: '#3B82F6', label: 'Flood' },
  road_closure: { icon: 'block', color: '#F59E0B', label: 'Road Closure' },
  safety: { icon: 'shield', color: '#10B981', label: 'Safety' },
  theft: { icon: 'report', color: '#EF4444', label: 'Theft' },
  general: { icon: 'info', color: '#6B7280', label: 'General' },
};

const getSeverityConfig = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'high': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'HIGH' };
    case 'moderate': return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'MODERATE' };
    default: return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', label: 'MINOR' };
  }
};

interface NearbyIncidentsScreenProps {
  navigation: any;
}

const NearbyIncidentsScreen: React.FC<NearbyIncidentsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const isDark = theme.isDark;
  const saffronColor = isDark ? '#F97316' : '#EA580C';
  const { t } = useTranslation();
  const bgColor = isDark ? '#080C16' : '#FAFAFA';

  const fetchIncidents = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 22.7196, lng = 75.8577; // Indore default

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const res = await safetyApi.getIncidents(lat, lng);
      if (res.success && res.data) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.warn('[NearbyIncidents] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncidents(true);
  }, []);

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - new Date(timestamp).getTime();
    if (isNaN(diff)) return 'Recently';
    
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const renderIncidentCard = ({ item }: { item: IncidentMarker }) => {
    const typeKey = typeof item.type === 'string' ? item.type.toLowerCase() : 'general';
    const catConfig = CATEGORY_CONFIG[typeKey] || CATEGORY_CONFIG.general;
    const sevConfig = getSeverityConfig(item.severity);

    return (
      <View 
        style={[
          styles.incidentCard, 
          { backgroundColor: isDark ? '#111827' : '#FFFFFF' }, 
          shadowProps, 
          { shadowColor: catConfig.color } // Dynamic glow based on incident type
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryIconBox, { backgroundColor: `${catConfig.color}15` }]}>
            <MaterialIcons name={catConfig.icon as any} size={24} color={catConfig.color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.incidentType, { color: theme.colors.text }]}>{catConfig.label}</Text>
            <Text style={[styles.incidentLocation, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.location?.name || 'Unknown Location'}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: sevConfig.bg }]}>
            <Text style={[styles.severityText, { color: sevConfig.color }]}>{sevConfig.label}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={[styles.incidentDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={[styles.cardFooter, { borderTopColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
          <View style={styles.footerItem}>
            <MaterialIcons name="schedule" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
              {getTimeAgo(item.reportedAt)}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialIcons name="my-location" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
              {item.location?.latitude?.toFixed(4) ?? '—'}°, {item.location?.longitude?.toFixed(4) ?? '—'}°
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Background Watermark */}
      {/* <MaterialIcons
        name="wifi-tethering"
        size={350}
        color={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}
        style={styles.watermark}
      /> */}

      <Header title={t('nearby.title')} subtitle={t('nearby.subtitle')} showBack onBack={() => navigation.goBack()} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Live Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }, shadowProps]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIcon, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 88, 12, 0.08)' }]}>
                <MaterialIcons name="radar" size={24} color={saffronColor} />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                  {loading ? t('nearby.scanning') : t('nearby.eventsDetected', { count: incidents.length })}
                </Text>
                <Text style={[styles.summaryDesc, { color: theme.colors.textSecondary }]}>
                  {t('nearby.liveIntelligence')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident Feed */}
        {loading && !refreshing ? (
          <View style={styles.centerContent}>
            <LoadingState message={t('nearby.scanning')} />
          </View>
        ) : incidents.length === 0 ? (
          <View style={styles.centerContent}>
            <EmptyState
              icon="verified-user"
              title={t('common.allClear')}
              message={t('nearby.noClear')}
            />
          </View>
        ) : (
          <FlatList
            data={incidents}
            keyExtractor={(item) => item.id}
            renderItem={renderIncidentCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={8}
            windowSize={5}
            maxToRenderPerBatch={8}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[saffronColor]}
                tintColor={saffronColor}
                progressBackgroundColor={theme.colors.surface}
              />
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    top: '25%',
    right: -80,
    transform: [{ rotate: '15deg' }],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '20%',
  },
  summaryBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for nav bar
  },
  incidentCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  incidentLocation: {
    fontSize: 13,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  incidentDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 12,
    marginLeft: 62, // Aligns perfectly with the text
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default memo(NearbyIncidentsScreen);