import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Journey } from '../types';
import { formatDate, formatTime, getSafetyColor } from '../utils/formatting';

interface JourneyCardProps {
  journey: Journey;
  onPress?: (journey: Journey) => void;
}

const JourneyCard: React.FC<JourneyCardProps> = ({ journey, onPress }) => {
  const { theme } = useTheme();
  const scoreColor = getSafetyColor(
    journey.safetyScore >= 80 ? 'high' : journey.safetyScore >= 60 ? 'medium' : 'low'
  );

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface, ...theme.shadows.sm }]}
      onPress={() => onPress?.(journey)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <View style={styles.routeRow}>
            <MaterialIcons name="trip-origin" size={14} color={theme.colors.primary} />
            <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
              {journey.origin.name}
            </Text>
          </View>
          <View style={styles.dotLine}>
            <View style={[styles.dot, { backgroundColor: theme.colors.gray300 }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.gray300 }]} />
          </View>
          <View style={styles.routeRow}>
            <MaterialIcons name="location-on" size={14} color={theme.colors.danger} />
            <Text style={[styles.locationText, { color: theme.colors.text }]} numberOfLines={1}>
              {journey.destination.name}
            </Text>
          </View>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}18` }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {journey.safetyScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>score</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
        <View style={styles.metaItem}>
          <MaterialIcons name="calendar-today" size={14} color={theme.colors.textTertiary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {formatDate(journey.date)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="schedule" size={14} color={theme.colors.textTertiary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {journey.duration}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="straighten" size={14} color={theme.colors.textTertiary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {journey.distance}
          </Text>
        </View>
        <View style={[styles.routeTypeBadge, { backgroundColor: theme.colors.primarySurface }]}>
          <Text style={[styles.routeTypeText, { color: theme.colors.primary }]}>
            {journey.routeType === 'safest' ? '🛡️ Safest' : '⚡ Fastest'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotLine: {
    marginLeft: 6,
    paddingVertical: 2,
    gap: 3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  routeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  routeTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default memo(JourneyCard);
