import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';
import { API_BASE_URL, NETWORK_CONFIG } from '../config/apiConfig';

// ─── Backend Axios Client (real API calls) ──────────────────────────

export const backendClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: NETWORK_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Rakshak-Mobile/1.0',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok interstitial page
  },
});

// Request interceptor for logging
backendClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    console.log(`[API REQUEST] ${method} ${url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for logging & error handling
backendClient.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    console.log(`[API SUCCESS] ${url} (${response.status})`);
    return response;
  },
  (error: AxiosError) => {
    const url = error.config?.url || '';
    if (error.response) {
      console.warn(`[API FAILED] ${url} — Status ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      console.warn(`[API TIMEOUT] ${url} — Request timed out`);
    } else if (error.request) {
      console.warn(`[API NETWORK ERROR] ${url} — No response received`);
    } else {
      console.error(`[API SETUP ERROR] ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// ─── Retry wrapper ──────────────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = NETWORK_CONFIG.retryAttempts,
  delay: number = NETWORK_CONFIG.retryDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`[API RETRY] ${retries} attempts remaining, waiting ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay);
    }
    throw error;
  }
}

// ─── Legacy mock helpers (used by services that aren't yet integrated) ──

// Helper to simulate API delay
export const simulateDelay = (ms: number = 600): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to wrap mock data as API response
export function mockResponse<T>(data: T, success: boolean = true): ApiResponse<T> {
  return { data, success, message: success ? 'OK' : 'Error' };
}

// Legacy default export for backwards compatibility with mock services
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.rakshak.urin.dev/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default apiClient;
