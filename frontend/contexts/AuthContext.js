'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, userAPI, tokenManager } from '../lib/api';

// Auth context
const AuthContext = createContext(null);

// Auth states
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_USER: 'SET_USER',
    SET_AUTHENTICATED: 'SET_AUTHENTICATED',
    SET_ERROR: 'SET_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: null,
};

// Auth reducer
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                error: action.payload ? null : state.error, // Clear error when loading
            };

        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.SET_AUTHENTICATED:
            return {
                ...state,
                isAuthenticated: action.payload,
                isLoading: false,
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

// Auth provider component
export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on mount
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            const token = tokenManager.getToken();

            if (!token || tokenManager.isTokenExpired(token)) {
                // No valid token
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
                return;
            }

            // Verify token with backend and get user data
            const userData = await userAPI.getProfile();
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });

        } catch (error) {
            console.error('Auth initialization failed:', error);

            // If token is invalid, clear it
            if (error.response?.status === 401) {
                tokenManager.removeToken();
            }

            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    const login = async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const response = await authAPI.login(credentials);

            // Handle both possible response formats from backend
            const user = response.user || response.userDetails || response;
            const token = response.token || response.accessToken || response.jwt;

            if (user) {
                dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
                return { success: true, user, token };
            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Login failed';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });

            return {
                success: false,
                error: errorMessage,
                details: error.response?.data
            };
        }
    };

    const logout = async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authAPI.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error.message);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });

            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    };

    const register = async (userData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const response = await authAPI.register(userData);

            // Registration successful - user might need to login separately
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });

            return {
                success: true,
                message: 'Registration successful. Please login.',
                data: response
            };

        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Registration failed';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });

            return {
                success: false,
                error: errorMessage,
                details: error.response?.data
            };
        }
    };

    const updateProfile = async (profileData) => {
        if (!state.user?.id) {
            throw new Error('User not authenticated');
        }

        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            const updatedUser = await userAPI.updateProfile(state.user.id, profileData);
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });

            return { success: true, user: updatedUser };
        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Profile update failed';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const changePassword = async (passwordData) => {
        if (!state.user?.id) {
            throw new Error('User not authenticated');
        }

        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await userAPI.changePassword({
                ...passwordData,
                userId: state.user.id,
            });

            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Password change failed';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    const refreshUser = async () => {
        if (!state.isAuthenticated) return;

        try {
            const userData = await userAPI.getProfile();
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
            return userData;
        } catch (error) {
            console.error('Failed to refresh user data:', error);

            if (error.response?.status === 401) {
                // Token expired or invalid
                logout();
            }
            throw error;
        }
    };

    // Check if user has specific permissions (extensible for future use)
    const hasPermission = (permission) => {
        if (!state.user) return false;

        // Basic permission checks - extend as needed
        switch (permission) {
            case 'admin':
                return state.user.role === 'admin' || state.user.isAdmin;
            case 'user':
                return !!state.user;
            default:
                return false;
        }
    };

    const contextValue = {
        // State
        ...state,

        // Actions
        login,
        logout,
        register,
        updateProfile,
        changePassword,
        clearError,
        refreshUser,

        // Utilities
        hasPermission,
        isLoggedIn: state.isAuthenticated,
        userId: state.user?.id,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// HOC for components that need authentication
export function withAuth(Component) {
    const AuthenticatedComponent = (props) => {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ct-primary-600"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return null;
        }

        return <Component {...props} />;
    };

    AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

    return AuthenticatedComponent;
}

export default AuthContext;

/*
TODO: Enhanced Security Implementation
=============================================

For production environments, consider implementing the following security enhancements:

1. REFRESH TOKEN FLOW:
   - Store access token in memory (not localStorage)
   - Store refresh token in httpOnly cookie
   - Implement automatic token refresh
   - Add token refresh interceptor in axios

2. IMPLEMENTATION EXAMPLE:

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh', {}, {
      withCredentials: true, // Send httpOnly cookies
    });
    
    const newToken = response.data.accessToken;
    // Store in memory only
    setTokenInMemory(newToken);
    
    return newToken;
  } catch (error) {
    logout();
    throw error;
  }
};

// Add to axios interceptor:
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const newToken = await refreshToken();
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

3. BACKEND CHANGES NEEDED:
   - Add refresh token endpoint
   - Set httpOnly cookies for refresh tokens
   - Implement token blacklisting
   - Add CSRF protection

Current implementation uses localStorage for simplicity as requested,
but production apps should migrate to the refresh token approach.
*/