/**
 * FinTech Data Access Layer (DAL) - Canonical API Client
 * Standards: OWASP API Security Top 10, JWT Refresh Flow, Zero-Leakage Error Normalization.
 */

import { logger } from '@/lib/logger';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window === 'undefined' ? 'http://localhost:8080' : '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  transitional: { silentJSONParsing: true },
});

/**
 * Enterprise Token Manager with Edge Middleware Cookie Synchronization
 */
export const tokenManager = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('ct_jwt') || sessionStorage.getItem('ct_jwt') || null
    );
  },

  setToken: (token, remember = true) => {
    if (typeof window === 'undefined' || !token) return;
    if (remember) {
      localStorage.setItem('ct_jwt', token);
    } else {
      sessionStorage.setItem('ct_jwt', token);
    }

    // Sync to secure cookie for Edge Middleware authentication
    try {
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `token=${encodeURIComponent(token)}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    } catch (e) {
      logger.warn('Failed to set auth cookie:', e);
    }
  },

  removeToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('ct_jwt');
    sessionStorage.removeItem('ct_jwt');
    localStorage.removeItem('ct_refresh');

    // Invalidate edge cookie
    try {
      document.cookie =
        'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch (e) {
      logger.warn('Failed to remove auth cookie:', e);
    }
  },

  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ct_refresh') || null;
  },

  setRefreshToken: token => {
    if (typeof window === 'undefined' || !token) return;
    localStorage.setItem('ct_refresh', token);
  },

  isTokenExpired: token => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};

// Request Interceptor: Injects Authorization Header
apiClient.interceptors.request.use(
  config => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: Standardizes Errors and Handles 401 Expirations
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = tokenManager.getRefreshToken();

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken }
          );
          if (data?.token) {
            tokenManager.setToken(data.token);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return apiClient(originalRequest);
          }
        } catch {
          tokenManager.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=true';
          }
        }
      } else {
        tokenManager.removeToken();
      }
    }

    // Normalized error structure
    const normalizedError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An unexpected network error occurred',
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };

    return Promise.reject(normalizedError);
  }
);

export const unwrapResponse = data => {
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

export default apiClient;
