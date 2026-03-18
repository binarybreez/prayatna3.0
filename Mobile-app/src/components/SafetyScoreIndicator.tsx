import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { getSafetyColor, getSafetyLabel } from '../utils/formatting';

interface SafetyScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SafetyScoreIndicator: React.FC<SafetyScoreIndicatorProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const { theme } = useTheme();
  const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  const color = getSafetyColor(level);
  const label = getSafetyLabel(score);

  const dimensions = {
    sm: { outer: 64, inner: 52, fontSize: 18, labelSize: 9 },
    md: { outer: 100, inner: 82, fontSize: 28, labelSize: 12 },
    lg: { outer: 140, inner: 116, fontSize: 36, labelSize: 14 },
  };

  const dim = dimensions[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.outer,
          {
            width: dim.outer,
            height: dim.outer,
            borderRadius: dim.outer / 2,
            borderColor: color,
            backgroundColor: theme.isDark ? `${color}15` : `${color}10`,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: dim.inner,
              height: dim.inner,
              borderRadius: dim.inner / 2,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[styles.score, { color, fontSize: dim.fontSize }]}>
            {score}
          </Text>
          {size !== 'sm' && (
            <Text style={[styles.outOf, { color: theme.colors.textTertiary, fontSize: dim.labelSize - 2 }]}>
              / 100
            </Text>
          )}
        </View>
      </View>
      {showLabel && (
        <View style={[styles.labelBadge, { backgroundColor: `${color}18` }]}>
          <View style={[styles.labelDot, { backgroundColor: color }]} />
          <Text style={[styles.labelText, { color, fontSize: dim.labelSize }]}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  outer: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  score: {
    fontWeight: '700',
  },
  outOf: {
    marginTop: -2,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 5,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontWeight: '600',
  },
});

export default memo(SafetyScoreIndicator);
