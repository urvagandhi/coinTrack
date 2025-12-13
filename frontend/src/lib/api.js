import axios from 'axios';
import { logger } from './logger';

// Base URLs from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

// Create axios instance
// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    // Explicitly disable retries (handle in React Query)
    retry: false,
    transitional: { silentJSONParsing: true }
});

export const BROKERS = {
    ZERODHA: 'zerodha',
    UPSTOX: 'upstox',
    ANGELONE: 'angelone'
};

// Token management utilities
export const tokenManager = {
    getToken: () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('ct_jwt') || sessionStorage.getItem('ct_jwt');
    },

    setToken: (token, remember = true) => {
        if (typeof window === 'undefined') return;
        if (remember) {
            localStorage.setItem('ct_jwt', token);
        } else {
            sessionStorage.setItem('ct_jwt', token);
        }
    },

    removeToken: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('ct_jwt');
        sessionStorage.removeItem('ct_jwt');
    },

    isTokenExpired: (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    },
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = tokenManager.getToken();
        if (token && !tokenManager.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for metrics
        config.metadata = { startTime: new Date() };

        return config;
    },
    (error) => {
        logger.error('[API] Request Error', { error: error.message });
        return Promise.reject(error);
    }
);

// Response interceptor to handle common scenarios
api.interceptors.response.use(
    (response) => {
        // Log API duration
        if (response.config.metadata?.startTime) {
            const duration = new Date() - response.config.metadata.startTime;
            // Only log if slow or explicit debug needed
            if (duration > 1000) {
                logger.warn('[API] Slow Request', {
                    url: response.config.url,
                    method: response.config.method,
                    duration
                });
            }
        }
        return response;
    },
    (error) => {
        const errorDetails = {
            status: error.response ? error.response.status : 'Network/CORS',
            url: error.config ? error.config.url : 'Unknown',
            method: error.config ? error.config.method : 'Unknown',
            message: error.message
        };

        // Suppress 401 logging as it's common during expiry
        if (error.response?.status !== 401) {
            logger.error('[API] Response Error', errorDetails);
        }

        // Handle Token Expiry (401)
        if (error.response?.status === 401) {
            tokenManager.removeToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Optionally force redirect, but usually AuthContext handles this state change
            }
        }

        /**
         * Error Contract:
         * {
         *   message: string (user-safe)
         *   status: number | undefined
         *   original: AxiosError
         * }
         *
         * Components must only use `message`.
         */
        // Normalize Error Object for Frontend Consumption
        // CONTRACT LOCK: All errors returned to components must use this shape
        const normalizedError = {
            message: error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred',
            status: error.response?.status,
            original: error // Keep original for deep debugging if needed
        };

        return Promise.reject(normalizedError);
    }
);

// ============================================================================
// API ENDPOINTS & SERVICES
// CONTRACT LOCK: Only expose methods that return normalized data.
// ============================================================================

export const endpoints = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        verifyOtp: '/api/auth/verify-otp',
        resendOtp: '/api/auth/resend-otp',
        logout: '/api/auth/logout',
    },
    users: {
        me: '/api/users/me',
        update: (id) => `/api/users/${id}`,
    },
    portfolio: {
        summary: '/api/portfolio/summary',
        holdings: '/api/portfolio/holdings',
        positions: '/api/portfolio/positions',
    },
    brokers: {
        connect: (broker) => `/api/brokers/${broker}/connect`,
        status: (broker) => `/api/brokers/${broker}/status`,
        zerodha: {
            saveCredentials: '/api/brokers/zerodha/credentials',
        },
        callback: '/api/brokers/callback',
    },
    notes: {
        list: '/api/notes',
        create: '/api/notes',
        update: (id) => `/api/notes/${id}`,
        delete: (id) => `/api/notes/${id}`,
    }
};

export const authAPI = {
    login: async (credentials) => {
        const { data } = await api.post(endpoints.auth.login, credentials);
        return data; // Expect { token, user } or { requiresOtp }
    },
    verifyOtp: async (payload) => {
        const { data } = await api.post(endpoints.auth.verifyOtp, payload);
        return data;
    },
    resendOtp: async (username) => {
        const { data } = await api.post(endpoints.auth.resendOtp, { username });
        return data;
    },
    register: async (userData) => {
        const { data } = await api.post(endpoints.auth.register, userData);
        return data;
    },
    logout: async () => {
        try {
            await api.post(endpoints.auth.logout);
        } catch (e) {
            // Ignore logout errors
        } finally {
            tokenManager.removeToken();
        }
    }
};

export const userAPI = {
    getProfile: async () => {
        const { data } = await api.get(endpoints.users.me);
        return data;
    },
    updateProfile: async (id, payload) => {
        const { data } = await api.put(endpoints.users.update(id), payload);
        return data;
    }
};

export const portfolioAPI = {
    getSummary: async () => {
        const { data } = await api.get(endpoints.portfolio.summary);
        return data;
    },
    getHoldings: async () => {
        const { data } = await api.get(endpoints.portfolio.holdings);
        return data || []; // Default to empty array
    },
    getPositions: async () => {
        const { data } = await api.get(endpoints.portfolio.positions);
        return data || [];
    }
};

export const brokerAPI = {
    getConnectUrl: async (brokerName) => {
        const { data } = await api.get(endpoints.brokers.connect(brokerName));
        return data;
    },
    saveZerodhaCredentials: async (creds) => {
        const { data } = await api.post(endpoints.brokers.zerodha.saveCredentials, creds);
        return data;
    },
    getStatus: async (brokerName) => {
        const { data } = await api.get(endpoints.brokers.status(brokerName));
        return data;
    },
    handleCallback: async (brokerName, requestToken) => {
        const { data } = await api.post(endpoints.brokers.callback, {
            broker: brokerName,
            requestToken
        });
        return data;
    }
};

export const notesAPI = {
    getAll: async () => {
        const { data } = await api.get(endpoints.notes.list);
        return data.data || [];
    },
    create: async (note) => {
        const { data } = await api.post(endpoints.notes.create, note);
        return data.data;
    },
    update: async (id, note) => {
        const { data } = await api.put(endpoints.notes.update(id), note);
        return data.data;
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.notes.delete(id));
        return data;
    }
};

export default api;
