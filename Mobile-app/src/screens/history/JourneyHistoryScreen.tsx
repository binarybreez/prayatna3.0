import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Animated, 
  RefreshControl,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import Header from '../../components/common/Header';
import JourneyCard from '../../components/JourneyCard';
import { LoadingState, EmptyState } from '../../components/common/StateViews';
import { routesApi } from '../../api/routes';
import { Journey } from '../../types';
import { useAuthStore } from '../../state';
import { useTranslation } from '../../i18n/LanguageContext';

interface JourneyHistoryScreenProps {
  navigation: any;
}

const JourneyHistoryScreen: React.FC<JourneyHistoryScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  // Smooth SaaS entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  // Theme Colors
  const isDarkMode = theme.isDark;
  const saffronColor = isDarkMode ? '#F97316' : '#EA580C';
  const bgColor = isDarkMode ? '#0B0F19' : '#F8FAFC'; // Matte background
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';
  const { t } = useTranslation();

  const loadJourneys = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    const res = await routesApi.getJourneyHistory();
    if (res.success) {
      setJourneys(res.data);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadJourneys();

    // Clean, snappy entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJourneys(true);
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      
      <Header title={t('history.travelLog')} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Dashboard Summary Card - Flat & Structural */}
        <View style={styles.summaryWrapper}>
          <View style={[
            styles.summaryCard, 
            { backgroundColor: theme.colors.surface, borderColor: borderColor }
          ]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.12)' : 'rgba(234, 88, 12, 0.08)' }]}>
                <MaterialIcons name="history-edu" size={22} color={saffronColor} />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                  {t('history.userHistory', { name: firstName })}
                </Text>
                <Text style={[styles.subtitleDesc, { color: theme.colors.textSecondary }]}>
                  {t('history.historyDesc') || 'Review your travel history and safety scores.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Journey List */}
        {loading ? (
          <View style={styles.centerContent}>
            <LoadingState message={t('history.fetching') || 'Loading journey history...'} />
          </View>
        ) : journeys.length === 0 ? (
          <View style={styles.centerContent}>
            <EmptyState
              icon="explore-off"
              title={t('history.noJourneys') || 'No Journeys Yet'}
              message={t('history.noJourneysMsg') || 'Your secure travel history will appear here once you start navigating.'}
            />
          </View>
        ) : (
          <FlatList
            data={journeys}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <JourneyCard journey={item} />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={6}
            windowSize={5}
            maxToRenderPerBatch={6}
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
  summaryWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    // Ultra-subtle SaaS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  subtitleDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120, // Generous clearance for bottom tab bar
  },
  cardWrapper: {
    marginBottom: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '15%', // Visual centering offset
  },
});

export default memo(JourneyHistoryScreen);