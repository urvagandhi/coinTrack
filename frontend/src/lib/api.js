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
    fd: {
        list: '/api/fixed-deposits',
        create: '/api/fixed-deposits',
        update: (id) => `/api/fixed-deposits/${id}`,
        delete: (id) => `/api/fixed-deposits/${id}`,
        close: (id) => `/api/fixed-deposits/${id}/close`,
        summary: '/api/fixed-deposits/summary',
        export: '/api/fixed-deposits/export',
        getById: (id) => `/api/fixed-deposits/${id}`,
    },
    ppf: {
        list: '/api/ppf/transactions',
        create: '/api/ppf/transactions',
        update: (id) => `/api/ppf/transactions/${id}`,
        delete: (id) => `/api/ppf/transactions/${id}`,
        summary: '/api/ppf/summary',
        export: '/api/ppf/export',
        getById: (id) => `/api/ppf/transactions/${id}`,
        settings: '/api/ppf/settings',
        withdrawalStatus: '/api/ppf/withdrawal-status',
    },
    epf: {
        list: '/api/epf/transactions',
        create: '/api/epf/transactions',
        update: (id) => `/api/epf/transactions/${id}`,
        delete: (id) => `/api/epf/transactions/${id}`,
        summary: '/api/epf/summary',
        export: '/api/epf/export',
        getById: (id) => `/api/epf/transactions/${id}`,
        settings: '/api/epf/settings',
        interestRates: '/api/epf/interest-rates',
    },
    goldSilver: {
        list: '/api/gold-silver',
        create: '/api/gold-silver',
        update: (id) => `/api/gold-silver/${id}`,
        delete: (id) => `/api/gold-silver/${id}`,
        summary: '/api/gold-silver/summary',
        export: '/api/gold-silver/export',
        getById: (id) => `/api/gold-silver/${id}`,
        marketRate: '/api/gold-silver/market-rate',
        ratesCurrent: '/api/gold-silver/rates/current',
        ratesRefresh: '/api/gold-silver/rates/refresh',
        ratesUsage: '/api/gold-silver/rates/usage',
        ratesHealth: '/api/gold-silver/rates/health',
        rateSettings: '/api/gold-silver/rate-settings',
        rateMode: (id) => `/api/gold-silver/${id}/rate-mode`,
        purityOptions: '/api/gold-silver/purity-options',
    },
    mutualFund: {
        dashboard: '/api/mutual-fund/dashboard',
        export: '/api/mutual-fund/export',
        
        schemes: '/api/mutual-fund/schemes',
        schemeSummary: '/api/mutual-fund/scheme-summary',
        schemeDropdown: '/api/mutual-fund/schemes/dropdown',
        schemeSearch: '/api/mutual-fund/schemes/search',
        schemeCategory: (cat) => `/api/mutual-fund/schemes/category/${cat}`,
        schemePlatform: (plat) => `/api/mutual-fund/schemes/platform/${plat}`,
        schemeBank: (bank) => `/api/mutual-fund/schemes/bank/${bank}`,
        updateScheme: (id) => `/api/mutual-fund/schemes/${id}`,
        deleteScheme: (id) => `/api/mutual-fund/schemes/${id}`,
        
        lumpsum: '/api/mutual-fund/lumpsum',
        lumpsumPage: '/api/mutual-fund/lumpsum/page',
        lumpsumDateRange: '/api/mutual-fund/lumpsum/date-range',
        lumpsumFinYear: (year) => `/api/mutual-fund/lumpsum/financial-year/${year}`,
        updateLumpsum: (id) => `/api/mutual-fund/lumpsum/${id}`,
        deleteLumpsum: (id) => `/api/mutual-fund/lumpsum/${id}`,
        
        sipMandate: '/api/mutual-fund/sip-mandate',
        sipMandateStatus: (status) => `/api/mutual-fund/sip-mandate/status/${status}`,
        updateSipMandate: (id) => `/api/mutual-fund/sip-mandate/${id}`,
        stopSipMandate: (id) => `/api/mutual-fund/sip-mandate/${id}/stop`,
        restartSipMandate: (id) => `/api/mutual-fund/sip-mandate/${id}/restart`,
        deleteSipMandate: (id) => `/api/mutual-fund/sip-mandate/${id}`,
        
        sipContribution: '/api/mutual-fund/sip-contribution',
        sipContributionMandate: (id) => `/api/mutual-fund/sip-contribution/mandate/${id}`,
        sipContributionDateRange: '/api/mutual-fund/sip-contribution/date-range',
        sipContributionFinYear: (year) => `/api/mutual-fund/sip-contribution/financial-year/${year}`,
        updateSipContribution: (id) => `/api/mutual-fund/sip-contribution/${id}`,
        deleteSipContribution: (id) => `/api/mutual-fund/sip-contribution/${id}`,
        
        redemption: '/api/mutual-fund/redemption',
        redemptionDateRange: '/api/mutual-fund/redemption/date-range',
        redemptionFinYear: (year) => `/api/mutual-fund/redemption/financial-year/${year}`,
        updateRedemption: (id) => `/api/mutual-fund/redemption/${id}`,
        deleteRedemption: (id) => `/api/mutual-fund/redemption/${id}`,
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
    googleLogin: async (code, redirectUri) => {
        const { data } = await api.post('/api/auth/oauth2/google', { code, redirectUri }, noRetry);
        return unwrapResponse(data);
    },
    completeGoogleProfile: async (payload) => {
        const { data } = await api.post('/api/auth/oauth2/complete-profile', payload, noRetry);
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

// ============================================================================
// FIXED DEPOSIT API
// ============================================================================

export const fdAPI = {
    getAll: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.fd.list}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || {};
    },
    getSummary: async () => {
        const { data } = await api.get(endpoints.fd.summary);
        return unwrapResponse(data);
    },
    getById: async (id) => {
        const { data } = await api.get(endpoints.fd.getById(id));
        return unwrapResponse(data);
    },
    create: async (fdData) => {
        const { data } = await api.post(endpoints.fd.create, fdData);
        return unwrapResponse(data);
    },
    update: async (id, fdData) => {
        const { data } = await api.put(endpoints.fd.update(id), fdData);
        return unwrapResponse(data);
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.fd.delete(id));
        return unwrapResponse(data);
    },
    close: async (id) => {
        const { data } = await api.patch(endpoints.fd.close(id));
        return unwrapResponse(data);
    },
    exportCSV: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const response = await api.get(`${endpoints.fd.export}${qs ? '?' + qs : ''}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

// ============================================================================
// PUBLIC PROVIDENT FUND (PPF) API
// ============================================================================

export const ppfAPI = {
    getAll: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.ppf.list}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || {};
    },
    getSummary: async () => {
        const { data } = await api.get(endpoints.ppf.summary);
        return unwrapResponse(data);
    },
    getById: async (id) => {
        const { data } = await api.get(endpoints.ppf.getById(id));
        return unwrapResponse(data);
    },
    create: async (txnData) => {
        const { data } = await api.post(endpoints.ppf.create, txnData);
        return unwrapResponse(data);
    },
    update: async (id, txnData) => {
        const { data } = await api.put(endpoints.ppf.update(id), txnData);
        return unwrapResponse(data);
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.ppf.delete(id));
        return unwrapResponse(data);
    },
    getSettings: async () => {
        const { data } = await api.get(endpoints.ppf.settings);
        return unwrapResponse(data);
    },
    updateSettings: async (settingsData) => {
        const { data } = await api.put(endpoints.ppf.settings, settingsData);
        return unwrapResponse(data);
    },
    getWithdrawalStatus: async () => {
        const { data } = await api.get(endpoints.ppf.withdrawalStatus);
        return unwrapResponse(data);
    },
    exportCSV: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const response = await api.get(`${endpoints.ppf.export}${qs ? '?' + qs : ''}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

// ============================================================================
// EMPLOYEE PROVIDENT FUND (EPF) API
// ============================================================================

export const epfAPI = {
    getAll: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.epf.list}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || {};
    },
    getSummary: async () => {
        const { data } = await api.get(endpoints.epf.summary);
        return unwrapResponse(data);
    },
    getById: async (id) => {
        const { data } = await api.get(endpoints.epf.getById(id));
        return unwrapResponse(data);
    },
    create: async (txnData) => {
        const { data } = await api.post(endpoints.epf.create, txnData);
        return unwrapResponse(data);
    },
    update: async (id, txnData) => {
        const { data } = await api.put(endpoints.epf.update(id), txnData);
        return unwrapResponse(data);
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.epf.delete(id));
        return unwrapResponse(data);
    },
    getSettings: async () => {
        const { data } = await api.get(endpoints.epf.settings);
        return unwrapResponse(data);
    },
    updateSettings: async (settingsData) => {
        const { data } = await api.put(endpoints.epf.settings, settingsData);
        return unwrapResponse(data);
    },
    getInterestRates: async () => {
        const { data } = await api.get(endpoints.epf.interestRates);
        return unwrapResponse(data) || [];
    },
    saveInterestRate: async (rateData) => {
        const { data } = await api.post(endpoints.epf.interestRates, rateData);
        return unwrapResponse(data);
    },
    exportCSV: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const response = await api.get(`${endpoints.epf.export}${qs ? '?' + qs : ''}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

// ============================================================================
// GOLD & SILVER API
// ============================================================================

export const goldSilverAPI = {
    getAll: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.goldSilver.list}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || {};
    },
    getSummary: async () => {
        const { data } = await api.get(endpoints.goldSilver.summary);
        return unwrapResponse(data);
    },
    getById: async (id) => {
        const { data } = await api.get(endpoints.goldSilver.getById(id));
        return unwrapResponse(data);
    },
    create: async (gsData) => {
        const { data } = await api.post(endpoints.goldSilver.create, gsData);
        return unwrapResponse(data);
    },
    update: async (id, gsData) => {
        const { data } = await api.put(endpoints.goldSilver.update(id), gsData);
        return unwrapResponse(data);
    },
    delete: async (id) => {
        const { data } = await api.delete(endpoints.goldSilver.delete(id));
        return unwrapResponse(data);
    },
    updateMarketRate: async (rateData) => {
        const { data } = await api.patch(endpoints.goldSilver.marketRate, rateData);
        return unwrapResponse(data);
    },
    getCurrentRates: async () => {
        const { data } = await api.get(endpoints.goldSilver.ratesCurrent);
        return unwrapResponse(data) || [];
    },
    refreshRates: async () => {
        const { data } = await api.post(endpoints.goldSilver.ratesRefresh);
        return unwrapResponse(data) || [];
    },
    getApiUsage: async () => {
        const { data } = await api.get(endpoints.goldSilver.ratesUsage);
        return unwrapResponse(data);
    },
    getApiHealth: async () => {
        const { data } = await api.get(endpoints.goldSilver.ratesHealth);
        return unwrapResponse(data);
    },
    getRateSettings: async () => {
        const { data } = await api.get(endpoints.goldSilver.rateSettings);
        return unwrapResponse(data);
    },
    updateRateSettings: async (settingsData) => {
        const { data } = await api.put(endpoints.goldSilver.rateSettings, settingsData);
        return unwrapResponse(data);
    },
    updateRateMode: async (id, payload) => {
        const { data } = await api.patch(endpoints.goldSilver.rateMode(id), payload);
        return unwrapResponse(data);
    },
    getPurityOptions: async (metalType) => {
        const qs = metalType ? `?metalType=${metalType}` : '';
        const { data } = await api.get(`${endpoints.goldSilver.purityOptions}${qs}`);
        return unwrapResponse(data) || [];
    },
    createPurityOption: async (optionData) => {
        const { data } = await api.post(endpoints.goldSilver.purityOptions, optionData);
        return unwrapResponse(data);
    },
    exportCSV: async (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        const response = await api.get(`${endpoints.goldSilver.export}${qs ? '?' + qs : ''}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

// ============================================================================
// MUTUAL FUND API
// ============================================================================

export const mutualFundAPI = {
    getDashboard: async () => {
        const { data } = await api.get(endpoints.mutualFund.dashboard);
        return unwrapResponse(data);
    },
    exportExcel: async () => {
        const response = await api.get(endpoints.mutualFund.export, {
            responseType: 'blob',
        });
        return response.data;
    },
    getSchemeDropdown: async () => {
        const { data } = await api.get(endpoints.mutualFund.schemeDropdown);
        return unwrapResponse(data) || [];
    },
    getSchemes: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.includeRedeemed) searchParams.set('includeRedeemed', params.includeRedeemed);
        if (params.holderName) searchParams.set('holderName', params.holderName);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.mutualFund.schemes}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || [];
    },
    getSchemeSummaries: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.includeRedeemed) searchParams.set('includeRedeemed', params.includeRedeemed);
        if (params.holderName) searchParams.set('holderName', params.holderName);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.mutualFund.schemeSummary}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || [];
    },
    createScheme: async (schemeData) => {
        const { data } = await api.post(endpoints.mutualFund.schemes, schemeData);
        return unwrapResponse(data);
    },
    updateScheme: async (id, schemeData) => {
        const { data } = await api.put(endpoints.mutualFund.updateScheme(id), schemeData);
        return unwrapResponse(data);
    },
    deleteScheme: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteScheme(id));
        return unwrapResponse(data);
    },
    
    getLumpsum: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.schemeId) searchParams.set('schemeId', params.schemeId);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.mutualFund.lumpsum}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || [];
    },
    getLumpsumPaginated: async (page = 0, size = 10) => {
        const { data } = await api.get(`${endpoints.mutualFund.lumpsumPage}?page=${page}&size=${size}`);
        return unwrapResponse(data);
    },
    createLumpsum: async (txnData) => {
        const { data } = await api.post(endpoints.mutualFund.lumpsum, txnData);
        return unwrapResponse(data);
    },
    updateLumpsum: async (id, txnData) => {
        const { data } = await api.put(endpoints.mutualFund.updateLumpsum(id), txnData);
        return unwrapResponse(data);
    },
    deleteLumpsum: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteLumpsum(id));
        return unwrapResponse(data);
    },

    getSipMandates: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.schemeId) searchParams.set('schemeId', params.schemeId);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.mutualFund.sipMandate}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || [];
    },
    getSipMandatesByStatus: async (status) => {
        const { data } = await api.get(endpoints.mutualFund.sipMandateStatus(status));
        return unwrapResponse(data) || [];
    },
    createSipMandate: async (mandateData) => {
        const { data } = await api.post(endpoints.mutualFund.sipMandate, mandateData);
        return unwrapResponse(data);
    },
    updateSipMandate: async (id, mandateData) => {
        const { data } = await api.put(endpoints.mutualFund.updateSipMandate(id), mandateData);
        return unwrapResponse(data);
    },
    stopSipMandate: async ({ id, date }) => {
        const { data } = await api.patch(endpoints.mutualFund.stopSipMandate(id), { date });
        return unwrapResponse(data);
    },
    restartSipMandate: async ({ id, date }) => {
        const { data } = await api.patch(endpoints.mutualFund.restartSipMandate(id), { date });
        return unwrapResponse(data);
    },
    deleteSipMandate: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteSipMandate(id));
        return unwrapResponse(data);
    },

    getSipContributions: async (schemeId) => {
        const qs = schemeId ? `?schemeId=${schemeId}` : '';
        const { data } = await api.get(`${endpoints.mutualFund.sipContribution}${qs}`);
        return unwrapResponse(data) || [];
    },
    createSipContribution: async (contributionData) => {
        const { data } = await api.post(endpoints.mutualFund.sipContribution, contributionData);
        return unwrapResponse(data);
    },
    updateSipContribution: async (id, contributionData) => {
        const { data } = await api.put(endpoints.mutualFund.updateSipContribution(id), contributionData);
        return unwrapResponse(data);
    },
    deleteSipContribution: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteSipContribution(id));
        return unwrapResponse(data);
    },

    getRedemptions: async (schemeId) => {
        const qs = schemeId ? `?schemeId=${schemeId}` : '';
        const { data } = await api.get(`${endpoints.mutualFund.redemption}${qs}`);
        return unwrapResponse(data) || [];
    },
    createRedemption: async (txnData) => {
        const { data } = await api.post(endpoints.mutualFund.redemption, txnData);
        return unwrapResponse(data);
    },
    updateRedemption: async (id, txnData) => {
        const { data } = await api.put(endpoints.mutualFund.updateRedemption(id), txnData);
        return unwrapResponse(data);
    },
    deleteRedemption: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteRedemption(id));
        return unwrapResponse(data);
    },

    getValuations: async (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.holderName) searchParams.set('holderName', params.holderName);
        if (params.platform) searchParams.set('platform', params.platform);
        const qs = searchParams.toString();
        const { data } = await api.get(`${endpoints.mutualFund.valuation}${qs ? '?' + qs : ''}`);
        return unwrapResponse(data) || [];
    },
    createValuation: async (valData) => {
        const { data } = await api.post(endpoints.mutualFund.valuation, valData);
        return unwrapResponse(data);
    },
    updateValuation: async (id, valData) => {
        const { data } = await api.put(endpoints.mutualFund.updateValuation(id), valData);
        return unwrapResponse(data);
    },
    deleteValuation: async (id) => {
        const { data } = await api.delete(endpoints.mutualFund.deleteValuation(id));
        return unwrapResponse(data);
    },
};

export default api;
