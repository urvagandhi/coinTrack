import axios from 'axios';

// Base URLs from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
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
                console.info(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
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

        // Standardized Error Logging
        console.error('🚨 [API Error]', errorDetails);

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

// Single source of truth for all broker API interactions.
// Do not create broker-specific services outside this file.
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
        logout: '/api/auth/logout', // Placeholder if implemented in future
    },

    // User management endpoints - mapped from UserController
    users: {
        list: '/api/users',                 // UserController @GetMapping("/users")
        me: '/api/users/me',                // UserController @GetMapping("/users/me")
        getById: (id) => `/api/users/${id}`, // UserController @GetMapping("/users/{id}")
        update: (id) => `/api/users/${id}`,  // UserController @PutMapping("/users/{id}")
        delete: (id) => `/api/users/${id}`,  // UserController @DeleteMapping("/users/{id}")
    },

    // Broker endpoints - Mapped to BrokerConnectController & dedicated Broker Controllers
    brokers: {
        // Shared Connection Endpoints (BrokerConnectController)
        connect: (broker) => `/api/brokers/${broker}/connect`, // @GetMapping("/{broker}/connect")

        // Zerodha Specific (BrokerConnectController & ZerodhaBridgeController)
        zerodha: {
            saveCredentials: '/api/brokers/zerodha/credentials', // BrokerConnectController @PostMapping("/zerodha/credentials")
            callback: '/api/brokers/zerodha/callback',         // BrokerConnectController @PostMapping("/callback") (POST from frontend after bridge redirect)
            // Note: Actual data endpoints (holdings, profile etc) should be mapped here when backend implements them.
            // Currently using placeholders or assumed endpoints based on standard REST patterns.
            profile: '/api/brokers/zerodha/profile',
            holdings: '/api/brokers/zerodha/holdings',
            positions: '/api/brokers/zerodha/positions',
            orders: '/api/brokers/zerodha/orders',
            mfHoldings: '/api/brokers/zerodha/mf/holdings',
            mfSips: '/api/brokers/zerodha/mf/sips',
        },

        // Upstox Specific
        upstox: {
            // Placeholders
            profile: '/api/brokers/upstox/profile',
            holdings: '/api/brokers/upstox/holdings',
            positions: '/api/brokers/upstox/positions',
            orders: '/api/brokers/upstox/orders',
        },

        // Angel One Specific
        angelone: {
            // Placeholders
            profile: '/api/brokers/angelone/profile',
            holdings: '/api/brokers/angelone/holdings',
            positions: '/api/brokers/angelone/positions',
            orders: '/api/brokers/angelone/orders',
        },
    },

    // Notes endpoints - mapped from NoteController
    notes: {
        list: '/api/notes',
        create: '/api/notes',
        update: (id) => `/api/notes/${id}`,
        delete: (id) => `/api/notes/${id}`,
    },
};

// API service functions
export const authAPI = {
    login: async (credentials, remember = false) => {
        const payload = {
            usernameOrEmailOrMobile: credentials.usernameOrEmail || credentials.usernameOrEmailOrMobile,
            password: credentials.password
        };

        if (process.env.NODE_ENV === 'development') {
            console.info(`[Auth] Logging in: ${payload.usernameOrEmailOrMobile}`);
        }

        try {
            const response = await api.post(endpoints.auth.login, payload);

            if (process.env.NODE_ENV === 'development') {
                console.info('[Auth] Login successful');
            }

            // Handle both 'token' and 'accessToken' field names
            const token = response.data.token || response.data.accessToken;
            if (token) {
                tokenManager.setToken(token, remember);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post(endpoints.auth.logout);
        } catch (error) {
            // Ignore logout errors
        } finally {
            tokenManager.removeToken();
        }
    },

    register: async (userData) => {
        const response = await api.post(endpoints.auth.register, userData);
        return response.data;
    },

    verifyOtp: async (username, otp, remember = true) => {
        if (process.env.NODE_ENV === 'development') {
            console.info(`[Auth] Verifying OTP for: ${username}`);
        }

        try {
            const response = await api.post(endpoints.auth.verifyOtp, { username, otp });

            const token = response.data.token || response.data.accessToken;
            if (token) {
                tokenManager.setToken(token, remember);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    resendOtp: async (username) => {
        const response = await api.post(endpoints.auth.resendOtp, { username });
        return response.data;
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
        const response = await api.put(endpoints.users.update(userId), { password });
        return response.data;
    },
};

export const brokerAPI = {
    // Phase 1: Connection & Credentials

    // Check if user has credentials/account setup for broker
    // Uses generic connect endpoint which returns login URL if set up, or error if not.
    // Or we could implement a dedicated status endpoint if backend provided one.
    getConnectUrl: async (brokerName) => {
        try {
            const response = await api.get(endpoints.brokers.connect(brokerName));
            return response.data; // Expect { loginUrl: "..." }
        } catch (error) {
            throw error;
        }
    },

    // Zerodha specific credential saving
    saveZerodhaCredentials: async (credentials) => {
        // credentials: { apiKey, apiSecret }
        const response = await api.post(endpoints.brokers.zerodha.saveCredentials, credentials);
        return response.data;
    },

    // Callback handler for all brokers (standardized in BrokerConnectController)
    handleCallback: async (brokerName, requestToken) => {
        const payload = {
            broker: brokerName,
            requestToken: requestToken
        };
        // Backend: BrokerConnectController @PostMapping("/callback")
        const response = await api.post('/api/brokers/callback', payload);
        return response.data;
    },

    // Data Fetching Methods (Zerodha)
    zerodha: {
        getProfile: () => api.get(endpoints.brokers.zerodha.profile),
        getHoldings: () => api.get(endpoints.brokers.zerodha.holdings),
        getPositions: () => api.get(endpoints.brokers.zerodha.positions),
        getOrders: () => api.get(endpoints.brokers.zerodha.orders),
        getMFHoldings: () => api.get(endpoints.brokers.zerodha.mfHoldings),
        getMFSips: () => api.get(endpoints.brokers.zerodha.mfSips),
    },
};

export const notesAPI = {
    getAll: async () => {
        const response = await api.get(endpoints.notes.list);
        return response.data.data;
    },
    create: async (noteData) => {
        const response = await api.post(endpoints.notes.create, noteData);
        return response.data.data;
    },
    update: async (id, noteData) => {
        const response = await api.put(endpoints.notes.update(id), noteData);
        return response.data.data;
    },
    delete: async (id) => {
        const response = await api.delete(endpoints.notes.delete(id));
        return response.data;
    },
};

// Utility to check endpoint availability (Head request)
export const checkEndpointAvailability = async (endpoint) => {
    try {
        await api.head(endpoint);
        return true;
    } catch {
        return false;
    }
};

export default api;
