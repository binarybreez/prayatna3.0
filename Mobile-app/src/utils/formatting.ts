import { AlertSeverity, AlertCategory, SafetyLevel } from '../types';

/** Format timestamp to relative time string */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Format date for display */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Format time for display */
export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/** Get severity color */
export const getSeverityColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'high': return '#DC2626';
    case 'moderate': return '#F59E0B';
    case 'minor': return '#6B7280';
    default: return '#6B7280';
  }
};

/** Get severity background color */
export const getSeverityBgColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case 'high': return '#FEE2E2';
    case 'moderate': return '#FEF3C7';
    case 'minor': return '#F3F4F6';
    default: return '#F3F4F6';
  }
};

/** Get safety level color */
export const getSafetyColor = (level: SafetyLevel): string => {
  switch (level) {
    case 'high': return '#16A34A';
    case 'medium': return '#F59E0B';
    case 'low': return '#DC2626';
    default: return '#6B7280';
  }
};

/** Get safety level background color */
export const getSafetyBgColor = (level: SafetyLevel): string => {
  switch (level) {
    case 'high': return '#DCFCE7';
    case 'medium': return '#FEF3C7';
    case 'low': return '#FEE2E2';
    default: return '#F3F4F6';
  }
};

/** Get alert category icon name (Material Icons) */
export const getAlertCategoryIcon = (category: AlertCategory): string => {
  switch (category) {
    case 'accident': return 'car-emergency';
    case 'safety': return 'shield-alert';
    case 'road_closure': return 'road-variant';
    case 'flood': return 'water';
    case 'fire': return 'fire';
    case 'theft': return 'lock-alert';
    case 'general': return 'alert-circle';
    default: return 'alert-circle';
  }
};

/** Get safety score label */
export const getSafetyLabel = (score: number): string => {
  if (score >= 80) return 'Safe';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Caution';
  return 'Unsafe';
};

/** Truncate text */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
