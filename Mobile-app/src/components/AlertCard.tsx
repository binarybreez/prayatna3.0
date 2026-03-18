import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Alert as AlertType } from '../types';
import { formatRelativeTime, getSeverityColor, getSeverityBgColor, getAlertCategoryIcon } from '../utils/formatting';

interface AlertCardProps {
  alert: AlertType;
  onPress?: (alert: AlertType) => void;
  compact?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress, compact = false }) => {
  const { theme } = useTheme();
  const severityColor = getSeverityColor(alert.severity);
  const severityBg = theme.isDark ? `${severityColor}25` : getSeverityBgColor(alert.severity);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: severityColor,
          ...theme.shadows.sm,
        },
      ]}
      onPress={() => onPress?.(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: severityBg }]}>
          <MaterialCommunityIcons
            name={getAlertCategoryIcon(alert.category) as any}
            size={20}
            color={severityColor}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {alert.title}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={[styles.location, { color: theme.colors.primary }]} numberOfLines={1}>
            {alert.location.name}
          </Text>
          {!compact && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {alert.description}
            </Text>
          )}
          <Text style={[styles.time, { color: theme.colors.textTertiary }]}>
            {formatRelativeTime(alert.timestamp)}
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
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default memo(AlertCard);
