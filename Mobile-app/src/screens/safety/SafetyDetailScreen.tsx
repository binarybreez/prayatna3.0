import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useSafetyStore } from '../../state';
import Header from '../../components/common/Header';
import SafetyScoreIndicator from '../../components/SafetyScoreIndicator';
import { LoadingState } from '../../components/common/StateViews';
import { getSafetyColor, getSafetyBgColor } from '../../utils/formatting';
import { SafetyFactor } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

const ICON_MAP: Record<string, string> = {
  'lightbulb-outline': 'lightbulb',
  'alert-circle-outline': 'warning',
  'people-outline': 'groups',
  'cloud-outline': 'cloud',
  'shield-checkmark-outline': 'local-police',
  'videocam-outline': 'videocam',
};

const shadowProps = {
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
};

interface SafetyDetailScreenProps {
  navigation: any;
}

const FactorCard = memo(({ factor, isDark }: { factor: SafetyFactor; isDark: boolean }) => {
  const color = getSafetyColor(factor.level);
  const bgColor = isDark ? '#111827' : '#FFFFFF';
  const iconName = ICON_MAP[factor.icon] || 'info';

  return (
    <View style={[styles.factorCard, { backgroundColor: bgColor, borderLeftColor: color }, shadowProps, { shadowColor: color }]}>
      <View style={styles.factorHeader}>
        <View style={[styles.factorIcon, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={iconName as any} size={22} color={color} />
        </View>
        <View style={styles.factorInfo}>
          <Text style={[styles.factorName, { color: isDark ? '#F1F5F9' : '#111827' }]}>
            {factor.name}
          </Text>
          <View style={styles.scoreBadgeContainer}>
            <Text style={[styles.factorScore, { color }]}>
              {factor.score}/100
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.factorDesc, { color: isDark ? '#94A3B8' : '#4B5563' }]}>
        {factor.description}
      </Text>

      {/* Visual Progress Bar */}
      <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
        <View style={[styles.progressBarFill, { width: `${factor.score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
});

const SafetyDetailScreen: React.FC<SafetyDetailScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { safetyScore, isLoading, fetchSafetyScore } = useSafetyStore();
  const { t } = useTranslation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const isDarkMode = theme.isDark;
  const bgColor = isDarkMode ? '#080C16' : '#FAFAFA';

  useEffect(() => {
    if (!safetyScore) {
      // Hardcoded Indore coordinates for initial load
      fetchSafetyScore(22.7196, 75.8577);
    }
  }, []);

  useEffect(() => {
    if (safetyScore && !isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [safetyScore, isLoading]);

  if (isLoading || !safetyScore) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <Header title={t('safety.safetyStatus')} showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <LoadingState message={t('safety.analyzingArea')} />
        </View>
      </View>
    );
  }

  // Determine the glowing shadow color based on the overall score
  const overallColor = getSafetyColor(safetyScore.overall >= 80 ? 'low' : safetyScore.overall >= 50 ? 'medium' : 'high');

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* Background Security Watermark */}
      <MaterialIcons 
        name="security" 
        size={400} 
        color={isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 
        style={styles.watermark} 
      />

      <Header 
        title={t('safety.intelligenceReport')} 
        subtitle={safetyScore.location.name} 
        showBack 
        onBack={() => navigation.goBack()} 
      />
      
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Main Score Dashboard */}
        <View 
          style={[
            styles.scoreSection, 
            { backgroundColor: theme.colors.surface }, 
            shadowProps,
            { shadowColor: overallColor } // Dynamic glow based on safety!
          ]}
        >
          <SafetyScoreIndicator score={safetyScore.overall} size="lg" />
          <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>
            {t('safety.areaSafetyIndex')}
          </Text>
          <View style={[styles.scoreSubtitleBadge, { backgroundColor: isDarkMode ? '#1F2937' : '#F1F5F9' }]}>
            <MaterialIcons name="analytics" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.scoreSubtitle, { color: theme.colors.textSecondary }]}>
              {t('safety.basedOnStreams', { count: safetyScore.factors.length })}
            </Text>
          </View>
        </View>

        {/* Factors Breakdown */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
            {t('safety.contributingFactors')}
          </Text>
          <MaterialIcons name="insights" size={18} color={theme.colors.textTertiary} />
        </View>
        
        {safetyScore.factors.map((factor) => (
          <FactorCard key={factor.id} factor={factor} isDark={theme.isDark} />
        ))}

        {/* Last Updated Timestamp */}
        <View style={styles.timestampContainer}>
          <MaterialIcons name="update" size={14} color={theme.colors.textTertiary} />
          <Text style={[styles.lastUpdated, { color: theme.colors.textTertiary }]}>
            {t('safety.liveFeedSync')}: {new Date(safetyScore.lastUpdated).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>
      </Animated.ScrollView>
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
    left: -120,
    transform: [{ rotate: '25deg' }],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreSection: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    marginBottom: 32,
  },
  scoreTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  scoreSubtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  factorCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  factorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  factorInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scoreBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  factorScore: {
    fontSize: 14,
    fontWeight: '800',
  },
  factorDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default memo(SafetyDetailScreen);