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
        orders: '/api/portfolio/orders',
        funds: '/api/portfolio/funds',
        mfHoldings: '/api/portfolio/mf/holdings',
        mfOrders: '/api/portfolio/mf/orders',
        mfSips: '/api/portfolio/mf/sips',
        mfInstruments: '/api/portfolio/mf/instruments',
        mfTimeline: '/api/portfolio/mf/timeline',
        trades: '/api/portfolio/trades',
        profile: '/api/portfolio/profile',
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

// Helper to unwrap ApiResponse if present
const unwrapResponse = (data) => {
    if (data && typeof data === 'object' && data.success === true && 'data' in data) {
        return data.data;
    }
    return data;
};

export const authAPI = {
    login: async (credentials) => {
        const { data } = await api.post(endpoints.auth.login, credentials);
        return unwrapResponse(data); // Expect { token, user } or { requiresOtp }
    },
    verifyOtp: async (payload) => {
        const { data } = await api.post(endpoints.auth.verifyOtp, payload);
        return unwrapResponse(data);
    },
    resendOtp: async (username) => {
        const { data } = await api.post(endpoints.auth.resendOtp, { username });
        return unwrapResponse(data);
    },
    register: async (userData) => {
        const { data } = await api.post(endpoints.auth.register, userData);
        return unwrapResponse(data);
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
        return unwrapResponse(data);
    },
    updateProfile: async (id, payload) => {
        const { data } = await api.put(endpoints.users.update(id), payload);
        return unwrapResponse(data);
    },
    changePassword: async (id, newPassword, oldPassword) => {
        const { data } = await api.post(`/api/users/${id}/change-password`, {
            password: newPassword,
            oldPassword: oldPassword
        });
        return unwrapResponse(data);
    }
};

export const portfolioAPI = {
    getSummary: async () => {
        const { data } = await api.get(endpoints.portfolio.summary);
        return unwrapResponse(data);
    },
    getHoldings: async () => {
        const { data } = await api.get(endpoints.portfolio.holdings);
        return unwrapResponse(data) || []; // Default to empty array
    },
    getPositions: async () => {
        const { data } = await api.get(endpoints.portfolio.positions);
        return unwrapResponse(data) || [];
    },
    getOrders: async () => {
        const { data } = await api.get(endpoints.portfolio.orders);
        return unwrapResponse(data) || [];
    },
    getFunds: async () => {
        const { data } = await api.get(endpoints.portfolio.funds);
        return unwrapResponse(data);
    },
    getMfHoldings: async () => {
        const { data } = await api.get(endpoints.portfolio.mfHoldings);
        return unwrapResponse(data) || [];
    },
    getMfOrders: async () => {
        const { data } = await api.get(endpoints.portfolio.mfOrders); // Corrected from hardcoded string
        return unwrapResponse(data) || [];
    },
    getTrades: async () => {
        const { data } = await api.get(endpoints.portfolio.trades);
        return unwrapResponse(data) || [];
    },
    getProfile: async () => {
        const { data } = await api.get(endpoints.portfolio.profile);
        return unwrapResponse(data);
    },
    getMfSips: async () => {
        const { data } = await api.get(endpoints.portfolio.mfSips);
        // Special case: MfSips response contains 'unlinkedSipOrders' sibling to 'data'
        // If we just unwrap, we lose it.
        // unwrapResponse checks for success=true and returns 'data'.
        // If the backend sends { success: true, data: [...], unlinkedSipOrders: [...] }
        // unwrapResponse will return [...].
        // We need to preserve unlinkedSipOrders.
        // Let's manually unwrap so we can attach unlinkedSipOrders to the result array or return an object.
        // Returning an object { sips: [], unlinked: [] } is better structure but changes existing expectations.
        // However, standard unwrap returns `data`.
        // Let's modify unwrapResponse is risky for global.
        // We will return the FULL response data directly here, bypassing unwrapResponse for this specific call,
        // or re-shape it.

        if (data && data.success) {
            const payload = data.data || {};
            return {
                data: payload.data || [],
                unlinkedSipOrders: payload.unlinkedSipOrders || []
            };
        }
        return { data: [], unlinkedSipOrders: [] };
    },
    getMfInstruments: async () => {
        const { data } = await api.get(endpoints.portfolio.mfInstruments);
        return unwrapResponse(data) || [];
    },
    getMfTimeline: async () => {
        const { data } = await api.get(endpoints.portfolio.mfTimeline);
        return unwrapResponse(data) || [];
    }
};

export const brokerAPI = {
    getConnectUrl: async (brokerName) => {
        const { data } = await api.get(endpoints.brokers.connect(brokerName));
        return unwrapResponse(data);
    },
    saveZerodhaCredentials: async (creds) => {
        const { data } = await api.post(endpoints.brokers.zerodha.saveCredentials, creds);
        return unwrapResponse(data);
    },
    getStatus: async (brokerName) => {
        const { data } = await api.get(endpoints.brokers.status(brokerName));
        return unwrapResponse(data);
    },
    handleCallback: async (brokerName, requestToken) => {
        const { data } = await api.post(endpoints.brokers.callback, {
            broker: brokerName,
            requestToken
        });
        return unwrapResponse(data);
    }
};

export const notesAPI = {
    getAll: async () => {
        const { data } = await api.get(endpoints.notes.list);
        return unwrapResponse(data) || [];
    },
    create: async (note) => {
        const { data } = await api.post(endpoints.notes.create, note);
        return unwrapResponse(data);
    },
    update: async (id, note) => {
        const { data } = await api.put(endpoints.notes.update(id), note);
        return unwrapResponse(data);
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.notes.delete(id));
        return unwrapResponse(data);
    }
};

export default api;
