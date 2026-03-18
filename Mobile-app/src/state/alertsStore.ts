import { create } from 'zustand';
import { Alert, AlertSeverity } from '../types';
import { alertsApi } from '../api/alerts';

interface AlertsState {
  alerts: Alert[];
  filteredAlerts: Alert[];
  activeFilter: AlertSeverity | 'all';
  isLoading: boolean;
  error: string | null;

  fetchAlerts: () => Promise<void>;
  setFilter: (filter: AlertSeverity | 'all') => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  filteredAlerts: [],
  activeFilter: 'all',
  isLoading: false,
  error: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await alertsApi.getAlerts();
      if (res.success) {
        const alerts = res.data;
        const { activeFilter } = get();
        const filteredAlerts = activeFilter === 'all'
          ? alerts
          : alerts.filter((a) => a.severity === activeFilter);
        set({ alerts, filteredAlerts, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load alerts' });
    }
  },

  setFilter: (filter) => {
    const { alerts } = get();
    const filteredAlerts = filter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === filter);
    set({ activeFilter: filter, filteredAlerts });
  },
}));
