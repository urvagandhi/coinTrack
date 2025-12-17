'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import { authAPI, tokenManager, totpAPI, userAPI } from '../lib/api';
import { logger } from '../lib/logger';

// Auth context
const AuthContext = createContext(null);

// Auth states
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_USER: 'SET_USER',
    SET_ERROR: 'SET_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
    user: null, // Full user profile object
    isAuthenticated: false,
    isLoading: true, // Start loading to check token status
    error: null,
};

// Auth reducer
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                error: action.payload ? null : state.error,
            };

        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...initialState,
                isLoading: false,
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // LIFECYCLE: Initialize auth state on mount
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        logger.debug('Initializing Auth State');
        // Do NOT set loading to true immediately if we have a token (optimistic auth)
        // This prevents flickering to login page
        const token = tokenManager.getToken();

        if (!token || tokenManager.isTokenExpired(token)) {
            logger.info('No valid token found during init, starting as guest');
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            return;
        }

        // If we have a token, start loading but don't clear user yet
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            // Verify token with backend and get user data
            const userData = await userAPI.getProfile();

            logger.info('Auth initialized successfully', { userId: userData.id });
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });

        } catch (error) {
            logger.warn('Auth initialization failed', { error: error.message, status: error.status });

            // CRITICAL: Only logout if explicitly 401 Unauthorized
            // Network errors or 500s should NOT log the user out
            if (error.status === 401) {
                logger.error('Token invalid (401), logging out');
                tokenManager.removeToken();
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
            } else {
                // For other errors, keep the error state but don't destroy session
                dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Failed to refresh session: ' + error.message });
            }
        }
    };

    const login = async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            let response = await authAPI.login(credentials);

            // Handle ApiResponse wrapper if present
            if (response.success && response.data) {
                response = response.data;
            }

            // CASE 1: TOTP Required (user has TOTP set up)
            if (response.requiresOtp) {
                logger.info('Login requires TOTP verification', { username: response.username });
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return {
                    success: true,
                    requiresTotp: true,
                    tempToken: response.tempToken,
                    userId: response.userId,
                    username: response.username,
                    message: response.message
                };
            }

            // CASE 2: TOTP Setup Required (user has NOT set up TOTP yet)
            if (response.requireTotpSetup) {
                logger.info('Login requires TOTP setup', { username: response.username });
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return {
                    success: true,
                    requireTotpSetup: true,
                    tempToken: response.tempToken,
                    userId: response.userId,
                    username: response.username,
                    message: response.message
                };
            }

            // CASE 2: Direct Success (Token + User)
            // LoginResponse is flat, so we verify token and construct user object
            const { token, ...userData } = response;

            if (token) {
                const user = {
                    id: userData.userId,
                    username: userData.username,
                    email: userData.email,
                    name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username).trim(),
                    name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username).trim(),
                    phoneNumber: userData.mobile,
                    bio: userData.bio,
                    location: userData.location,
                };

                tokenManager.setToken(token, true);
                logger.info('Login successful', { userId: user.id });
                dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
                return { success: true, user };
            }

            throw new Error('Invalid server response during login');

        } catch (error) {
            logger.error('Login failed', { error: error.message });
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });

            return {
                success: false,
                error: error.message
            };
        }
    };

    const verifyOtp = async (username, otp, remember = true) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            let response = await authAPI.verifyOtp({ username, otp });

            // Handle ApiResponse wrapper if present
            if (response.success && response.data) {
                response = response.data;
            }

            const { token, ...userData } = response;

            if (token) {
                const user = {
                    id: userData.userId,
                    username: userData.username,
                    email: userData.email,
                    name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username).trim(),
                    name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username).trim(),
                    phoneNumber: userData.mobile,
                    bio: userData.bio,
                    location: userData.location,
                };

                tokenManager.setToken(token, remember);
                logger.info('OTP Verification successful', { username });

                dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
                return { success: true, user };
            }

            throw new Error('OTP Verification failed: No token received');

        } catch (error) {
            logger.error('OTP Verification failed', { error: error.message });
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
            return { success: false, error: error.message };
        }
    };

    const resendOtp = async (username) => {
        try {
            const response = await authAPI.resendOtp(username);
            return { success: true, message: response.message };
        } catch (error) {
            logger.error('Resend OTP failed', { error: error.message });
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        logger.info('Logging out user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authAPI.logout();
        } catch (error) {
            // Ignore server-side logout errors, proceed to client cleanup
            logger.warn('Server logout failed (non-critical)', { error: error.message });
        } finally {
            tokenManager.removeToken();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });

            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    };

    // --------------------------------------------------------------------------
    // Helper Functions for TOTP Login Completion
    // --------------------------------------------------------------------------

    const fetchUserProfile = async () => {
        try {
            const userData = await userAPI.getProfile();
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
            return userData;
        } catch (error) {
            logger.error('Failed to fetch user profile', { error: error.message });
            throw error;
        }
    };

    const handleTotpLoginSuccess = (token, userData) => {
        logger.info('TOTP login successful', { userId: userData.userId });
        tokenManager.setToken(token, true);
        const user = {
            id: userData.userId,
            username: userData.username,
            email: userData.email,
            name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username)?.trim() || userData.username,
            phoneNumber: userData.mobile,
            bio: userData.bio,
            location: userData.location,
        };
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    };

    // --------------------------------------------------------------------------
    // TOTP 2FA Methods
    // --------------------------------------------------------------------------

    const setupTotp = async () => {
        try {
            const data = await totpAPI.setup();
            return { success: true, data };
        } catch (error) {
            logger.error('TOTP Setup Error:', { error: error.message });
            return { success: false, error: error.message || 'Setup failed' };
        }
    };

    const verifyTotpSetup = async (code) => {
        try {
            const data = await totpAPI.verify(code);
            await fetchUserProfile(); // Refresh profile to update TOTP status
            return { success: true, backupCodes: data.backupCodes };
        } catch (error) {
            return { success: false, error: error.message || 'Verification failed' };
        }
    };

    const verifyTotpLogin = async (tempToken, code) => {
        try {
            const data = await totpAPI.loginTotp(tempToken, code);
            if (data.token) {
                handleTotpLoginSuccess(data.token, data);
                return { success: true };
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (error) {
            return { success: false, error: error.message || 'Invalid code' };
        }
    };

    const verifyRecoveryLogin = async (tempToken, code) => {
        try {
            const data = await totpAPI.loginRecovery(tempToken, code);
            if (data.token) {
                handleTotpLoginSuccess(data.token, data);
                return { success: true };
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (error) {
            return { success: false, error: error.message || 'Invalid recovery code' };
        }
    };

    const resetTotp = async (currentCode) => {
        try {
            const data = await totpAPI.initiateReset(currentCode);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Reset initiation failed' };
        }
    };

    const verifyResetTotp = async (code) => {
        try {
            const data = await totpAPI.verifyReset(code);
            await fetchUserProfile();
            return { success: true, backupCodes: data.backupCodes };
        } catch (error) {
            return { success: false, error: error.message || 'Reset verification failed' };
        }
    };

    const contextValue = {
        ...state,
        login,
        verifyOtp,
        resendOtp,
        logout,
        register: authAPI.register, // Pass-through
        setupTotp,
        verifyTotpSetup,
        verifyTotpLogin,
        verifyRecoveryLogin,
        resetTotp,
        verifyResetTotp,
        // Utilities
        isLoggedIn: state.isAuthenticated,
        userId: state.user?.id,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// HOC for protected routes
export function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return null; // Or legitimate loading spinner
        }

        if (!isAuthenticated) {
            if (typeof window !== 'undefined') {
                // Prevent infinite loops if already on login
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
            return null;
        }

        return <Component {...props} />;
    };
}

export default AuthContext;
