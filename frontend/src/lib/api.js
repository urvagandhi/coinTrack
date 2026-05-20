import axios from 'axios';
import { logger } from './logger';

// Base URL from environment — Next.js rewrites /api/* to backend in dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || (typeof window === 'undefined' ? 'http://localhost:8080' : '');

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    transitional: { silentJSONParsing: true },
});

export const BROKERS = {
    ZERODHA: 'zerodha',
    UPSTOX: 'upstox',
    ANGELONE: 'angelone',
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

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

    getRefreshToken: () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('ct_refresh');
    },

    setRefreshToken: (token) => {
        if (typeof window === 'undefined') return;
        if (token) localStorage.setItem('ct_refresh', token);
    },

    removeAll: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('ct_jwt');
        sessionStorage.removeItem('ct_jwt');
        localStorage.removeItem('ct_refresh');
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

// ============================================================================
// REFRESH TOKEN QUEUE — prevents parallel refresh race condition
// ============================================================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use(
    (config) => {
        const token = tokenManager.getToken();
        if (token && !tokenManager.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.metadata = { startTime: new Date() };
        return config;
    },
    (error) => {
        logger.error('[API] Request Error', { error: error.message });
        return Promise.reject(error);
    }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

api.interceptors.response.use(
    (response) => {
        if (response.config.metadata?.startTime) {
            const duration = new Date() - response.config.metadata.startTime;
            if (duration > 1000) {
                logger.warn('[API] Slow Request', {
                    url: response.config.url,
                    method: response.config.method,
                    duration,
                });
            }
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Helper: normalize any error into { message, status, original }
        const normalize = (err) => ({
            message:
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'An unexpected error occurred',
            status: err.response?.status,
            original: err,
        });

        // ── Layer 1: Auto-retry for cold starts (5xx, timeout, network) ──
        // Skip retry for auth endpoints (__skipRetry flag)
        if (
            originalRequest &&
            !originalRequest.__isRetry &&
            !originalRequest.__skipRetry
        ) {
            const isNetworkError = !error.response;
            const isServerError = error.response && error.response.status >= 500;
            const isTimeout = error.code === 'ECONNABORTED';

            if (isNetworkError || isServerError || isTimeout) {
                originalRequest.__isRetry = true;
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return api(originalRequest);
            }
        }

        // ── Layer 2: 401 token refresh with queue ──
        if (error.response?.status === 401 && originalRequest && !originalRequest.__isRefreshRetry) {
            // Skip refresh for auth endpoints (login 401 = wrong credentials, not expired token)
            if (originalRequest.__skipRefresh) {
                return Promise.reject(normalize(error));
            }

            // Skip refresh for the refresh endpoint itself
            if (originalRequest.url?.includes('/api/auth/refresh')) {
                tokenManager.removeAll();
                return Promise.reject(normalize(error));
            }

            // No refresh token available — clean logout, don't enter refresh flow
            if (!tokenManager.getRefreshToken()) {
                tokenManager.removeAll();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
                }
                return Promise.reject(normalize(error));
            }

            if (isRefreshing) {
                // Another request is already refreshing — queue this one
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(normalize(err)));
            }

            originalRequest.__isRefreshRetry = true;
            isRefreshing = true;

            try {
                const refreshToken = tokenManager.getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const { data: refreshData } = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const newTokens = refreshData?.data || refreshData;
                if (!newTokens?.token) {
                    throw new Error('Refresh response missing token');
                }

                tokenManager.setToken(newTokens.token);
                if (newTokens.refreshToken) {
                    tokenManager.setRefreshToken(newTokens.refreshToken);
                }

                processQueue(null, newTokens.token);

                originalRequest.headers['Authorization'] = `Bearer ${newTokens.token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                tokenManager.removeAll();

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
                }

                return Promise.reject(normalize(refreshError));
            } finally {
                isRefreshing = false;
            }
        }

        // Suppress 401 logging (common during expiry)
        if (error.response?.status !== 401) {
            logger.error('[API] Response Error', {
                status: error.response?.status ?? 'Network/CORS',
                url: originalRequest?.url ?? 'Unknown',
                method: originalRequest?.method ?? 'Unknown',
                message: error.message,
            });
        }

        // ── Layer 3: Normalize error for frontend ──
        return Promise.reject(normalize(error));
    }
);

// ============================================================================
// ENDPOINTS
// ============================================================================

export const endpoints = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        totp: {
            setup: '/api/auth/2fa/setup',
            verify: '/api/auth/2fa/verify',
            loginTotp: '/api/auth/login/totp',
            loginRecovery: '/api/auth/login/recovery',
            initiateReset: '/api/auth/2fa/reset',
            verifyReset: '/api/auth/2fa/reset/verify',
            getStatus: '/api/auth/2fa/status',
            registerSetup: '/api/auth/2fa/register/setup',
            registerVerify: '/api/auth/2fa/register/verify',
        },
    },
    users: {
        me: '/api/users/me',
        update: '/api/users/me',
        changePassword: '/api/users/me/password',
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
        syncStatus: '/api/portfolio/sync/status',
    },
    brokers: {
        connect: (broker) => `/api/brokers/${broker}/connect`,
        status: (broker) => `/api/brokers/${broker}/status`,
        zerodha: { saveCredentials: '/api/brokers/zerodha/credentials' },
        upstox: {
            saveCredentials: '/api/brokers/upstox/credentials',
            disconnect: '/api/brokers/upstox/disconnect',
        },
        angelone: {
            saveCredentials: '/api/brokers/angelone/credentials',
            connect: '/api/brokers/angelone/connect',
            disconnect: '/api/brokers/angelone/disconnect',
        },
        callback: '/api/brokers/callback',
    },
    notes: {
        list: '/api/notes',
        create: '/api/notes',
        update: (id) => `/api/notes/${id}`,
        delete: (id) => `/api/notes/${id}`,
    },
    email: {
        verify: '/api/auth/email/verify',
        resend: '/api/auth/email/resend',
        change: '/api/auth/email/change',
        changeVerify: '/api/auth/email/change/verify',
    },
    twofa: {
        recovery: '/api/auth/2fa/recovery',
        recoveryVerify: '/api/auth/2fa/recovery/verify',
    },
    password: {
        forgot: '/api/auth/forgot-password',
        forgotVerify: '/api/auth/forgot-password/verify',
        reset: '/api/auth/reset-password',
    },
    public: {
        contact: '/api/public/contact',
    },
};

// ============================================================================
// HELPERS
// ============================================================================

const unwrapResponse = (data) => {
    if (data && typeof data === 'object' && data.success === true && 'data' in data) {
        return data.data;
    }
    return data;
};

// Auth endpoints must not auto-retry on 5xx/timeout (prevents double registration, double TOTP)
// __skipRefresh: a 401 from login means "wrong credentials", not "expired token"
const noRetry = { __skipRetry: true, __skipRefresh: true };

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
    login: async (credentials) => {
        const { data } = await api.post(endpoints.auth.login, credentials, noRetry);
        return unwrapResponse(data);
    },
    register: async (userData) => {
        const { data } = await api.post(endpoints.auth.register, userData, noRetry);
        return unwrapResponse(data);
    },
    logout: async () => {
        try {
            await api.post(endpoints.auth.logout, null, noRetry);
        } catch {
            // Server-side invalidation is best-effort
        } finally {
            tokenManager.removeAll();
        }
    },
    refresh: async (refreshToken) => {
        const { data } = await api.post('/api/auth/refresh', { refreshToken }, noRetry);
        return unwrapResponse(data);
    },
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
    getProfile: async () => {
        const { data } = await api.get(endpoints.users.me);
        return unwrapResponse(data);
    },
    updateProfile: async (payload) => {
        const { data } = await api.put(endpoints.users.update, payload);
        return unwrapResponse(data);
    },
    changePassword: async (newPassword, oldPassword) => {
        const { data } = await api.put(endpoints.users.changePassword, {
            password: newPassword,
            oldPassword,
        });
        return unwrapResponse(data);
    },
};

// ============================================================================
// PORTFOLIO API
// ============================================================================

export const portfolioAPI = {
    getSummary: async () => {
        const { data } = await api.get(endpoints.portfolio.summary);
        return unwrapResponse(data);
    },
    getHoldings: async () => {
        const { data } = await api.get(endpoints.portfolio.holdings);
        return unwrapResponse(data) || [];
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
        const { data } = await api.get(endpoints.portfolio.mfOrders);
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
        // Manual unwrap: response has sibling unlinkedSipOrders field
        // alongside data, so unwrapResponse() doesn't work here
        if (data && data.success) {
            const payload = data.data || {};
            return {
                data: payload.data || [],
                unlinkedSipOrders: payload.unlinkedSipOrders || [],
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
    },
    getSyncStatus: async () => {
        const { data } = await api.get(endpoints.portfolio.syncStatus);
        return unwrapResponse(data);
    },
    manualRefresh: async () => {
        const { data } = await api.post('/api/portfolio/refresh');
        return unwrapResponse(data);
    },
};

// ============================================================================
// BROKER API
// ============================================================================

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
    handleCallback: async (brokerName, tokenOrCode) => {
        // Supports both Zerodha (requestToken string) and Upstox (code string)
        const payload = typeof tokenOrCode === 'string'
            ? { broker: brokerName, requestToken: tokenOrCode }
            : { broker: brokerName, ...tokenOrCode };
        const { data } = await api.post(endpoints.brokers.callback, payload);
        return unwrapResponse(data);
    },
    saveUpstoxCredentials: async (creds) => {
        const { data } = await api.post(endpoints.brokers.upstox.saveCredentials, creds);
        return unwrapResponse(data);
    },
    disconnectUpstox: async () => {
        const { data } = await api.post(endpoints.brokers.upstox.disconnect);
        return unwrapResponse(data);
    },
    saveAngelOneCredentials: async (creds) => {
        const { data } = await api.post(endpoints.brokers.angelone.saveCredentials, creds);
        return unwrapResponse(data);
    },
    connectAngelOne: async () => {
        const { data } = await api.post(endpoints.brokers.angelone.connect);
        return unwrapResponse(data);
    },
    disconnectAngelOne: async () => {
        const { data } = await api.post(endpoints.brokers.angelone.disconnect);
        return unwrapResponse(data);
    },
};

// ============================================================================
// NOTES API
// ============================================================================

export const notesAPI = {
    getAll: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.set('page', params.page);
        if (params.size !== undefined) searchParams.set('size', params.size);
        if (params.search) searchParams.set('search', params.search);
        if (params.tag) searchParams.set('tag', params.tag);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.notes.list}${qs ? '?' + qs : ''}`);
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
    },
};

// ============================================================================
// EMAIL API
// ============================================================================

export const emailAPI = {
    verify: async (token, type = null) => {
        const { data } = await api.post(endpoints.email.verify, { token, type }, noRetry);
        return unwrapResponse(data);
    },
    resend: async () => {
        const { data } = await api.post(endpoints.email.resend, null, noRetry);
        return unwrapResponse(data);
    },
    change: async (newEmail) => {
        const { data } = await api.post(endpoints.email.change, { newEmail }, noRetry);
        return unwrapResponse(data);
    },
};

// ============================================================================
// 2FA RECOVERY API
// ============================================================================

export const twofaAPI = {
    requestRecovery: async (identifier) => {
        const { data } = await api.post(endpoints.twofa.recovery, { identifier }, noRetry);
        return unwrapResponse(data);
    },
    verifyRecovery: async (token) => {
        const { data } = await api.post(endpoints.twofa.recoveryVerify, { token }, noRetry);
        return unwrapResponse(data);
    },
};

// ============================================================================
// PASSWORD RESET API
// ============================================================================

export const passwordAPI = {
    forgot: async (identifier) => {
        const { data } = await api.post(endpoints.password.forgot, { identifier }, noRetry);
        return unwrapResponse(data);
    },
    forgotVerify: async (token) => {
        const { data } = await api.post(endpoints.password.forgotVerify, { token }, noRetry);
        return unwrapResponse(data);
    },
    reset: async (tempToken, newPassword) => {
        const { data } = await api.post(
            endpoints.password.reset,
            { newPassword },
            { ...noRetry, headers: { Authorization: `Bearer ${tempToken}` } }
        );
        return unwrapResponse(data);
    },
};

// ============================================================================
// CONTACT API
// ============================================================================

export const contactAPI = {
    sendMessage: async (formData) => {
        const { data } = await api.post(endpoints.public.contact, formData);
        return unwrapResponse(data);
    },
};

// ============================================================================
// TOTP 2FA API
// ============================================================================

export const totpAPI = {
    setup: async () => {
        const { data } = await api.post(endpoints.auth.totp.setup, null, noRetry);
        return unwrapResponse(data);
    },
    verify: async (code) => {
        const { data } = await api.post(endpoints.auth.totp.verify, { code }, noRetry);
        return unwrapResponse(data);
    },
    loginTotp: async (tempToken, code) => {
        const { data } = await api.post(endpoints.auth.totp.loginTotp, { tempToken, code }, noRetry);
        return unwrapResponse(data);
    },
    loginRecovery: async (tempToken, code) => {
        const { data } = await api.post(endpoints.auth.totp.loginRecovery, { tempToken, code }, noRetry);
        return unwrapResponse(data);
    },
    initiateReset: async (currentCode) => {
        const { data } = await api.post(endpoints.auth.totp.initiateReset, { code: currentCode }, noRetry);
        return unwrapResponse(data);
    },
    verifyReset: async (code) => {
        const { data } = await api.post(endpoints.auth.totp.verifyReset, { code }, noRetry);
        return unwrapResponse(data);
    },
    getStatus: async () => {
        const { data } = await api.get(endpoints.auth.totp.getStatus);
        return unwrapResponse(data);
    },
    registerSetup: async (tempToken) => {
        const { data } = await api.post(endpoints.auth.totp.registerSetup, { tempToken }, noRetry);
        return unwrapResponse(data);
    },
    registerVerify: async (tempToken, code) => {
        const { data } = await api.post(endpoints.auth.totp.registerVerify, { tempToken, code }, noRetry);
        return unwrapResponse(data);
    },
};

export default api;
