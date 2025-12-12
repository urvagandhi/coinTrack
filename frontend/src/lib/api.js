import axios from 'axios';

// Base URLs from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common scenarios
api.interceptors.response.use(
    (response) => {
        // Add response time for debugging
        if (response.config.metadata?.startTime) {
            const duration = new Date() - response.config.metadata.startTime;
            response.duration = duration;

            if (process.env.NODE_ENV === 'development') {
                console.log(`API Call: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
            }
        }

        return response;
    },
    (error) => {
        const errorDetails = {
            status: error.response ? error.response.status : 'No Response (Network/CORS?)',
            data: error.response ? error.response.data : 'No Data',
            message: error.message || 'Unknown Error',
            url: error.config ? error.config.url : 'Unknown URL',
            method: error.config ? error.config.method : 'Unknown Method'
        };

        console.error('🚨 API Error:', errorDetails);

        // Handle common error scenarios
        if (error.response?.status === 401) {
            // Token expired or invalid
            tokenManager.removeToken();

            // Only redirect if we're in the browser and not already on login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }
        }

        // Handle network errors
        if (!error.response) {
            error.message = 'Network error. Please check your internet connection.';
        }

        // Add user-friendly error messages from backend
        if (error.response?.data?.message) {
            error.userMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            error.userMessage = error.response.data.error;
        } else if (error.response?.status >= 500) {
            error.userMessage = 'Server error. Please try again later.';
        } else if (error.response?.status >= 400) {
            error.userMessage = typeof error.response.data === 'string' ? error.response.data : 'Invalid request. Please check your input.';
        }

        return Promise.reject(error);
    }
);

// API endpoints mapping to actual backend routes (scanned from Spring Boot controllers)
export const endpoints = {
    // Authentication endpoints - mapped from UserController and LoginController
    auth: {
        login: '/api/auth/login',           // UserController @PostMapping("/auth/login")
        loginLegacy: '/login',              // LoginController @PostMapping("/login") - fallback
        register: '/api/auth/register',     // UserController @PostMapping("/auth/register")
        verifyToken: '/api/auth/verify-token', // UserController @GetMapping("/auth/verify-token")
        verifyOtp: '/api/auth/verify-otp',    // UserController @PostMapping("/auth/verify-otp")
        resendOtp: '/api/auth/resend-otp',    // UserController @PostMapping("/auth/resend-otp")
        checkUsername: (username) => `/api/auth/check-username/${username}`, // UserController
    },

    // User management endpoints - mapped from UserController
    users: {
        list: '/api/users',                 // UserController @GetMapping("/users")
        me: '/api/users/me',                // UserController @GetMapping("/users/me")
        getById: (id) => `/api/users/${id}`, // UserController @GetMapping("/users/{id}")
        update: (id) => `/api/users/${id}`,  // UserController @PutMapping("/users/{id}")
        delete: (id) => `/api/users/${id}`,  // UserController @DeleteMapping("/users/{id}")
    },

    // Broker endpoints - mapped from actual controller annotations
    brokers: {
        // Zerodha - mapped from ZerodhaController @RequestMapping("/api/brokers/zerodha")
        zerodha: {
            loginUrl: '/api/brokers/zerodha/login-url',        // @GetMapping("/login-url")
            callback: '/api/brokers/zerodha/callback',         // @GetMapping("/callback")
            credentials: '/api/brokers/zerodha/credentials',   // @PostMapping("/credentials")
            connect: '/api/brokers/zerodha/connect',           // @PostMapping("/connect")
            connectGet: '/api/brokers/zerodha/connect',        // @GetMapping("/connect")
            status: '/api/brokers/zerodha/status',             // @GetMapping("/status")
            profile: '/api/brokers/zerodha/profile',           // @GetMapping("/profile")
            holdings: '/api/brokers/zerodha/holdings',         // @GetMapping("/holdings")
            positions: '/api/brokers/zerodha/positions',       // @GetMapping("/positions")
            orders: '/api/brokers/zerodha/orders',             // @GetMapping("/orders")
            mfHoldings: '/api/brokers/zerodha/mf/holdings',    // @GetMapping("/mf/holdings")
            mfSips: '/api/brokers/zerodha/mf/sips',           // @GetMapping("/mf/sips")
        },

        // Upstox - mapped from UpstoxController @RequestMapping("/api/brokers/upstox")
        upstox: {
            loginUrl: '/api/brokers/upstox/login-url',         // @GetMapping("/login-url")
            callback: '/api/brokers/upstox/callback',          // @PostMapping("/callback")
            credentials: '/api/brokers/upstox/credentials',    // @PostMapping("/credentials")
            holdings: '/api/brokers/upstox/holdings',          // @GetMapping("/holdings")
            orders: '/api/brokers/upstox/orders',              // @GetMapping("/orders")
            positions: '/api/brokers/upstox/positions',        // @GetMapping("/positions")
            status: '/api/brokers/upstox/status',              // @GetMapping("/status")
            disconnect: '/api/brokers/upstox/disconnect',      // @PostMapping("/disconnect")
        },

        // Angel One - mapped from AngelOneController @RequestMapping("/api/brokers/angelone")
        angelone: {
            loginUrl: '/api/brokers/angelone/login-url',       // @GetMapping("/login-url")
            credentials: '/api/brokers/angelone/credentials',  // @PostMapping("/credentials")
            connect: '/api/brokers/angelone/connect',          // @PostMapping("/connect")
            holdings: '/api/brokers/angelone/holdings',        // @GetMapping("/holdings")
            orders: '/api/brokers/angelone/orders',            // @GetMapping("/orders")
            positions: '/api/brokers/angelone/positions',      // @GetMapping("/positions")
            status: '/api/brokers/angelone/status',            // @GetMapping("/status")
            refreshToken: '/api/brokers/angelone/refresh-token', // @PostMapping("/refresh-token")
            disconnect: '/api/brokers/angelone/disconnect',    // @PostMapping("/disconnect")
        },
    },

    // Market data endpoints - These are not found in backend controllers
    // Adding as placeholders with graceful degradation
    market: {
        snapshot: '/api/market/snapshot',     // Not found in backend - will gracefully degrade
        history: '/api/market/history',       // Not found in backend - will gracefully degrade
        search: '/api/market/search',         // Not found in backend - will gracefully degrade
        quote: (symbol) => `/api/market/quote/${symbol}`, // Not found in backend - will gracefully degrade
    },

    // Portfolio endpoints - These are not found in backend controllers
    // Adding as placeholders with graceful degradation
    portfolio: {
        summary: '/api/portfolio/summary',     // Not found in backend - will gracefully degrade
        holdings: '/api/portfolio/holdings',   // Not found in backend - will gracefully degrade
        performance: '/api/portfolio/performance', // Not found in backend - will gracefully degrade
    },
};

// API service functions
export const authAPI = {
    login: async (credentials, remember = false) => {
        // Map frontend field to backend DTO field
        const payload = {
            usernameOrEmailOrMobile: credentials.usernameOrEmail || credentials.usernameOrEmailOrMobile,
            password: credentials.password
        };

        console.log('🔐 Sending login request to', endpoints.auth.login, 'with username:', payload.usernameOrEmailOrMobile);

        try {
            const response = await api.post(endpoints.auth.login, payload);

            console.log('✅ Login response received:', {
                hasToken: !!response.data.token,
                requiresOtp: response.data.requiresOtp,
                hasUserId: !!response.data.userId,
                username: response.data.username
            });

            // Handle both 'token' and 'accessToken' field names
            const token = response.data.token || response.data.accessToken;
            if (token) {
                tokenManager.setToken(token, remember);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Login API error:', {
                status: error.response ? error.response.status : 'N/A',
                message: error.userMessage || error.message,
                data: error.response ? error.response.data : 'No Data'
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post(endpoints.auth.logout);
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error.message);
        } finally {
            tokenManager.removeToken();
        }
    },

    register: async (userData) => {
        const response = await api.post(endpoints.auth.register, userData);
        return response.data;
    },

    // forgotPassword removed as backend endpoint does not exist. Use resendOtp flow instead.

    verifyOtp: async (username, otp) => {
        console.log('🔐 Verifying OTP for username:', username);

        try {
            const response = await api.post(endpoints.auth.verifyOtp, { username, otp });

            console.log('✅ OTP verified successfully, received token:', !!response.data.token);

            // Handle both 'token' and 'accessToken' field names
            const token = response.data.token || response.data.accessToken;
            if (token) {
                tokenManager.setToken(token);
            }

            return response.data;
        } catch (error) {
            console.error('❌ OTP verification failed:', {
                status: error.response ? error.response.status : 'N/A',
                message: error.userMessage || error.message,
                data: error.response ? error.response.data : 'No Data'
            });
            throw error;
        }
    },
    resendOtp: async (username) => {
        try {
            console.log('🔄 Resending OTP for:', username);
            const response = await api.post(endpoints.auth.resendOtp, { username });
            return response.data;
        } catch (error) {
            console.error('❌ Resend OTP failed:', {
                status: error.response ? error.response.status : 'N/A',
                message: error.userMessage || error.message,
                data: error.response ? error.response.data : 'No Data'
            });
            throw error;
        }
    },
};

export const userAPI = {
    getProfile: async () => {
        const response = await api.get(endpoints.users.me);
        return response.data;
    },

    updateProfile: async (id, userData) => {
        const response = await api.put(endpoints.users.update(id), userData);
        return response.data;
    },

    changePassword: async (userId, password) => {
        // Use standard user update endpoint
        const response = await api.put(endpoints.users.update(userId), { password });
        return response.data;
    },
};

export const brokerAPI = {
    // Generic broker operations
    getBrokerStatus: async (brokerName) => {
        const response = await api.get(endpoints.brokers[brokerName].base);
        return response.data;
    },

    connectBroker: async (brokerName, credentials) => {
        const response = await api.post(endpoints.brokers[brokerName].connect, credentials);
        return response.data;
    },

    disconnectBroker: async (brokerName) => {
        const response = await api.post(endpoints.brokers[brokerName].disconnect);
        return response.data;
    },

    // Zerodha specific
    zerodha: {
        connect: (credentials) => api.post(endpoints.brokers.zerodha.connect, credentials),
        callback: (params) => api.post(endpoints.brokers.zerodha.callback, params),
        getProfile: () => api.get(endpoints.brokers.zerodha.profile),
        getHoldings: () => api.get(endpoints.brokers.zerodha.holdings),
        getPositions: () => api.get(endpoints.brokers.zerodha.positions),
        getOrders: () => api.get(endpoints.brokers.zerodha.orders),
    },

    // Upstox specific
    upstox: {
        connect: (credentials) => api.post(endpoints.brokers.upstox.connect, credentials),
        callback: (params) => api.post(endpoints.brokers.upstox.callback, params),
        getProfile: () => api.get(endpoints.brokers.upstox.profile),
        getHoldings: () => api.get(endpoints.brokers.upstox.holdings),
        getPositions: () => api.get(endpoints.brokers.upstox.positions),
        getOrders: () => api.get(endpoints.brokers.upstox.orders),
    },

    // Angel One specific
    angelone: {
        connect: (credentials) => api.post(endpoints.brokers.angelone.connect, credentials),
        callback: (params) => api.post(endpoints.brokers.angelone.callback, params),
        getProfile: () => api.get(endpoints.brokers.angelone.profile),
        getHoldings: () => api.get(endpoints.brokers.angelone.holdings),
        getPositions: () => api.get(endpoints.brokers.angelone.positions),
        getOrders: () => api.get(endpoints.brokers.angelone.orders),
    },
};

export const marketAPI = {
    getSnapshot: async () => {
        const response = await api.get(endpoints.market.snapshot);
        return response.data;
    },

    getHistory: async (symbol, range = '1d') => {
        const response = await api.get(endpoints.market.history, {
            params: { symbol, range },
        });
        return response.data;
    },

    getQuote: async (symbol) => {
        const response = await api.get(endpoints.market.quote(symbol));
        return response.data;
    },

    searchSymbols: async (query) => {
        const response = await api.get(endpoints.market.search, {
            params: { q: query },
        });
        return response.data;
    },
};

export const portfolioAPI = {
    getSummary: async () => {
        const response = await api.get(endpoints.portfolio.summary);
        return response.data;
    },

    getHoldings: async () => {
        const response = await api.get(endpoints.portfolio.holdings);
        return response.data;
    },

    getPerformance: async (period = '1M') => {
        const response = await api.get(endpoints.portfolio.performance, {
            params: { period },
        });
        return response.data;
    },
};

// Utility function to check if backend endpoint exists
export const checkEndpointAvailability = async (endpoint) => {
    try {
        await api.head(endpoint);
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            return false;
        }
        // For other errors, assume endpoint exists but there's another issue
        return true;
    }
};

export default api;
