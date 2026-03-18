import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = memo(({ message = 'Loading...' }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
});

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({ icon = 'inbox', title, message, action }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon as any} size={64} color={theme.colors.gray300} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
});

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = memo(({ message = 'Something went wrong', onRetry }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={64} color={theme.colors.danger} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Oops!</Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <View style={styles.action}>
          <Text
            onPress={onRetry}
            style={[styles.retryBtn, { color: theme.colors.primary }]}
          >
            Tap to retry
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight:200,
  },
  text: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: 20,
  },
  retryBtn: {
    fontSize: 15,
    fontWeight: '600',
  },
});
