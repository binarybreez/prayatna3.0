import React, { useEffect, useCallback, useState, useRef, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAlertsStore, useAuthStore } from '../../state';
import Header from '../../components/common/Header';
import AlertCard from '../../components/AlertCard';
import { LoadingState, EmptyState } from '../../components/common/StateViews';
import { AlertSeverity } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

// Upgraded FILTERS with specific icons for a premium SaaS look
const FILTERS: { key: AlertSeverity | 'all'; labelKey: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'all', labelKey: 'alerts.allAlerts', icon: 'format-list-bulleted' },
  { key: 'high', labelKey: 'alerts.highRisk', icon: 'error' },
  { key: 'moderate', labelKey: 'alerts.moderate', icon: 'warning' },
  { key: 'minor', labelKey: 'alerts.minorInfo', icon: 'info' },
];

const shadowProps = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
};

interface AlertsFeedScreenProps {
  navigation: any;
}

const AlertsFeedScreen: React.FC<AlertsFeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { filteredAlerts, activeFilter, isLoading, fetchAlerts, setFilter } = useAlertsStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'User';

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Theme Colors
  const isDarkMode = theme.isDark;
  const saffronColor = isDarkMode ? '#F97316' : '#EA580C';
  const bgColor = isDarkMode ? '#080C16' : '#FAFAFA';
  const { t } = useTranslation();

  useEffect(() => {
    fetchAlerts();

    // Smooth Entrance Animation
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  // Dynamic colors for filter chips based on severity
  const getFilterColor = useCallback((key: string, isActive: boolean) => {
    if (!isActive) return theme.colors.surfaceVariant;
    switch (key) {
      case 'high': return '#EF4444'; // Red
      case 'moderate': return saffronColor; // Saffron
      case 'minor': return '#3B82F6'; // Blue
      default: return saffronColor; // Default All
    }
  }, [theme, saffronColor]);

  const getFilterShadow = useCallback((key: string) => {
    switch (key) {
      case 'high': return { shadowColor: '#EF4444' };
      case 'moderate': return { shadowColor: saffronColor };
      case 'minor': return { shadowColor: '#3B82F6' };
      default: return { shadowColor: saffronColor };
    }
  }, [saffronColor]);

  const renderFilter = useCallback(
    ({ key, labelKey, icon }: typeof FILTERS[0]) => {
      const isActive = activeFilter === key;
      const activeColor = getFilterColor(key, isActive);
      const dynamicShadow = getFilterShadow(key);

      return (
        <TouchableOpacity
          key={key}
          onPress={() => setFilter(key as AlertSeverity | 'all')}
          style={[
            styles.filterChip,
            {
              backgroundColor: isActive ? activeColor : (isDarkMode ? '#111827' : '#FFFFFF'),
              borderColor: isActive ? activeColor : theme.colors.border,
              transform: [{ scale: isActive ? 1.04 : 1 }], // Subtle SaaS pop effect
            },
            isActive && [shadowProps, dynamicShadow]
          ]}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name={icon} 
            size={16} 
            color={isActive ? '#FFFFFF' : theme.colors.textSecondary} 
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              { color: isActive ? '#FFFFFF' : theme.colors.textSecondary },
            ]}
          >
            {t(labelKey)}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeFilter, theme, isDarkMode, getFilterColor, getFilterShadow, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* Background Broadcast Watermark */}
      <MaterialIcons 
        name="campaign" 
        size={400} 
        color={isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 
        style={styles.watermark} 
      />

      <Header title={t('alerts.cityAlerts')} subtitle={t('alerts.stayAlert', { name: firstName })} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Scrollable Filters Row (Sticky Header Illusion) */}
        <View style={[styles.filterWrapper, { borderBottomColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            decelerationRate="fast"
            snapToInterval={120} // Smooth horizontal snapping
          >
            {FILTERS.map(renderFilter)}
          </ScrollView>
        </View>

        {/* Alert List */}
        {isLoading && !refreshing ? (
          <View style={styles.centerContent}>
            <LoadingState message={t('alerts.scanning') || 'Scanning Network...'} />
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.centerContent}>
            <EmptyState
              icon="verified-user"
              title={t('common.allClear') || 'All Clear!'}
              message={
                activeFilter === 'all' 
                  ? (t('alerts.noneAll') || 'No active alerts in your network.') 
                  : (t('alerts.noneFiltered', { level: activeFilter }) || `No ${activeFilter} level alerts at this time.`)
              }
            />
          </View>
        ) : (
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <AlertCard alert={item} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'} // Optimize performance
            initialNumToRender={8}
            windowSize={5}
            maxToRenderPerBatch={8}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[saffronColor]} // Android
                tintColor={saffronColor} // iOS
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
    top: '15%',
    right: -100,
    transform: [{ rotate: '15deg' }],
    zIndex: -1,
  },
  filterWrapper: {
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14, // Extra padding so scaling shadows don't clip
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120, // Generous padding for bottom tab navigation clearance
  },
  cardWrapper: {
    marginBottom: 14,
    // Ensure nested shadows render beautifully on both platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '20%', // Lift slightly above center for better visual balance
  },
});

export default memo(AlertsFeedScreen);