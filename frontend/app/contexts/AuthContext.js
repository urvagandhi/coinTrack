'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);
    
    // Check if route exists (basic check for known routes)
    const knownRoutes = ['/login', '/register', '/dashboard', '/'];
    const isKnownRoute = knownRoutes.includes(pathname) || pathname.startsWith('/dashboard/');

    const
        checkAuth = async () => {
            try {
                // Check if we have a token in localStorage or cookies
                const token = localStorage.getItem('authToken') || getCookie('authToken');

                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // Verify token with your Spring Boot backend
                const response = await fetch('/api/users/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });


                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('authToken');
                    deleteCookie('authToken');
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

    const login = async (credentials) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                // Store the token
                localStorage.setItem('authToken', data.token);
                setCookie('authToken', data.token, 7); // 7 days

                setUser(data.user);
                router.push('/dashboard');
                return { success: true };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            // Optional: Call logout endpoint on backend
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state
            localStorage.removeItem('authToken');
            deleteCookie('authToken');
            setUser(null);
            router.push('/login');
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                // Auto-login after successful registration
                return await login({
                    usernameOrEmail: userData.email,
                    password: userData.password
                });
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (!loading) {
            // Only redirect if it's a known route
            if (!user && !isPublicRoute && isKnownRoute) {
                // User is not authenticated and trying to access protected route
                router.push('/login');
            } else if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
                // User is authenticated and on login/register page or root
                router.push('/dashboard');
            }
        }
    }, [user, loading, pathname, isPublicRoute, isKnownRoute, router]);

    // Helper functions for cookie management
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                register,
                loading,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
