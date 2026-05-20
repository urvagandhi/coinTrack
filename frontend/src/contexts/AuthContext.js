'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { authAPI, tokenManager, totpAPI, userAPI } from '../lib/api';
import { logger } from '../lib/logger';

const AuthContext = createContext(null);

const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_USER: 'SET_USER',
    SET_ERROR: 'SET_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };
        case AUTH_ACTIONS.SET_USER:
            return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false, error: null };
        case AUTH_ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };
        case AUTH_ACTIONS.LOGOUT:
            return { ...initialState };
        case AUTH_ACTIONS.CLEAR_ERROR:
            return { ...state, error: null };
        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const [isInitializing, setIsInitializing] = useState(true);
    const queryClient = useQueryClient();

    // ── Listen for session expiry events from api.js ──
    useEffect(() => {
        const handleSessionExpired = () => {
            logger.warn('Session expired (refresh token failed)');
            queryClient.clear();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        };

        window.addEventListener('auth:sessionExpired', handleSessionExpired);
        return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    }, [queryClient]);

    // ── Initialize auth state on mount ──
    useEffect(() => {
        initializeAuth();
        // Safety net: if init never completes (hung refresh/profile call),
        // force-exit the "isInitializing" gate after 8s so the UI can render
        // — guest if no auth, redirect target otherwise.
        const safety = setTimeout(() => {
            setIsInitializing((v) => {
                if (v) logger.warn('Auth init timed out — releasing isInitializing gate');
                return false;
            });
        }, 8000);
        return () => clearTimeout(safety);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeAuth = async () => {
        logger.debug('Initializing Auth State');

        try {
            const token = tokenManager.getToken();

            if (!token || tokenManager.isTokenExpired(token)) {
                // Try refresh before giving up
                const refreshToken = tokenManager.getRefreshToken();
                if (refreshToken) {
                    try {
                        const result = await authAPI.refresh(refreshToken);
                        if (result?.token) {
                            tokenManager.setToken(result.token);
                            if (result.refreshToken) tokenManager.setRefreshToken(result.refreshToken);
                        } else {
                            tokenManager.removeAll();
                            dispatch({ type: AUTH_ACTIONS.LOGOUT });
                            return;
                        }
                    } catch {
                        tokenManager.removeAll();
                        dispatch({ type: AUTH_ACTIONS.LOGOUT });
                        return;
                    }
                } else {
                    logger.info('No valid token found during init, starting as guest');
                    dispatch({ type: AUTH_ACTIONS.LOGOUT });
                    return;
                }
            }

            // We have a valid token — fetch profile
            const userData = await userAPI.getProfile();
            logger.info('Auth initialized successfully', { userId: userData.id });
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
        } catch (error) {
            logger.warn('Auth initialization failed', { error: error.message, status: error.status });
            // Any failure during init = clean logout (no error banner on login page)
            tokenManager.removeAll();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        } finally {
            setIsInitializing(false);
        }
    };

    // ── Login ──
    const login = useCallback(async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            let response = await authAPI.login(credentials);

            // Handle ApiResponse wrapper
            if (response.success && response.data) {
                response = response.data;
            }

            // CASE 1: TOTP required
            if (response.tempToken && !response.requireTotpSetup && !response.token) {
                logger.info('Login requires TOTP verification', { username: response.username });
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return {
                    success: true,
                    requiresTotp: true,
                    tempToken: response.tempToken,
                    userId: response.userId,
                    username: response.username,
                    message: response.message,
                };
            }

            // CASE 2: TOTP setup required
            if (response.requireTotpSetup) {
                logger.info('Login requires TOTP setup', { username: response.username });
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return {
                    success: true,
                    requireTotpSetup: true,
                    tempToken: response.tempToken,
                    userId: response.userId,
                    username: response.username,
                    message: response.message,
                };
            }

            // CASE 3: Direct success
            const { token, refreshToken: loginRefreshToken, ...userData } = response;

            if (token) {
                const user = {
                    id: userData.userId,
                    username: userData.username,
                    email: userData.email,
                    name: (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData.username).trim(),
                    phoneNumber: userData.mobile,
                    bio: userData.bio,
                    location: userData.location,
                };

                tokenManager.setToken(token, true);
                if (loginRefreshToken) tokenManager.setRefreshToken(loginRefreshToken);
                logger.info('Login successful', { userId: user.id });
                dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
                return { success: true, user };
            }

            throw new Error('Invalid server response during login');
        } catch (error) {
            logger.error('Login failed', { error: error.message });
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
            return { success: false, error: error.message };
        }
    }, []);

    // ── Logout ──
    const logout = useCallback(async () => {
        logger.info('Logging out user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authAPI.logout();
        } catch (error) {
            logger.warn('Server logout failed (non-critical)', { error: error.message });
        } finally {
            queryClient.clear();
            tokenManager.removeAll();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });

            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }, [queryClient]);

    // ── Register (with state tracking) ──
    const register = useCallback(async (userData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        try {
            const response = await authAPI.register(userData);
            return response;
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
            throw error;
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    // ── TOTP helpers ──

    const fetchUserProfile = useCallback(async () => {
        try {
            const userData = await userAPI.getProfile();
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
            return userData;
        } catch (error) {
            logger.error('Failed to fetch user profile', { error: error.message });
            throw error;
        }
    }, []);

    const handleTotpLoginSuccess = useCallback((token, userData) => {
        logger.info('TOTP login successful', { userId: userData.userId });
        tokenManager.setToken(token, true);
        if (userData.refreshToken) tokenManager.setRefreshToken(userData.refreshToken);
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
    }, []);

    const setupTotp = useCallback(async () => {
        try {
            const data = await totpAPI.setup();
            return { success: true, data };
        } catch (error) {
            logger.error('TOTP Setup Error:', { error: error.message });
            return { success: false, error: error.message || 'Setup failed' };
        }
    }, []);

    const verifyTotpSetup = useCallback(async (code) => {
        try {
            const data = await totpAPI.verify(code);
            // Don't call fetchUserProfile here — during initial setup the user
            // only has a temp token, not a real access token. The setup-2fa page
            // redirects to /login after completion where a proper token is issued.
            return { success: true, backupCodes: data.backupCodes };
        } catch (error) {
            return { success: false, error: error.message || 'Verification failed' };
        }
    }, []);

    const verifyTotpLogin = useCallback(async (tempToken, code) => {
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
    }, [handleTotpLoginSuccess]);

    const verifyRecoveryLogin = useCallback(async (tempToken, code) => {
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
    }, [handleTotpLoginSuccess]);

    const resetTotp = useCallback(async (currentCode) => {
        try {
            const data = await totpAPI.initiateReset(currentCode);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Reset initiation failed' };
        }
    }, []);

    const verifyResetTotp = useCallback(async (code) => {
        try {
            const data = await totpAPI.verifyReset(code);
            await fetchUserProfile();
            return { success: true, backupCodes: data.backupCodes };
        } catch (error) {
            return { success: false, error: error.message || 'Reset verification failed' };
        }
    }, [fetchUserProfile]);

    const contextValue = {
        ...state,
        isInitializing,
        login,
        logout,
        register,
        setupTotp,
        verifyTotpSetup,
        verifyTotpLogin,
        verifyRecoveryLogin,
        resetTotp,
        verifyResetTotp,
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

export function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isInitializing } = useAuth();

        if (isInitializing) return null;

        if (!isAuthenticated) {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
            return null;
        }

        return <Component {...props} />;
    };
}

export default AuthContext;
