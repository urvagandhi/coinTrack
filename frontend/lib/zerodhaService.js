'use client';

// Zerodha API service functions
const API_BASE_URL = '/api';

export const zerodhaService = {
    // Set Zerodha credentials for a user
    setCredentials: async (credentials) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/set-credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to set credentials');
        }

        return await response.text();
    },

    // Get Zerodha login URL for a user
    getLoginUrl: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/login-url?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get login URL');
        }

        return await response.text();
    },

    // Connect Zerodha account with request token
    connectAccount: async (requestToken, appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/connect?requestToken=${requestToken}&appUserId=${appUserId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to connect account');
        }

        return await response.json();
    },

    // Get Zerodha account status
    getAccountStatus: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/me?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get account status');
        }

        return await response.text();
    },

    // Check if credentials are set for a user
    checkCredentials: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${API_BASE_URL}/zerodha/login-url?appUserId=${appUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // If login URL can be generated, credentials are set
                return { hasCredentials: true };
            } else {
                const error = await response.text();
                if (error.includes('API key not set') || error.includes('No Zerodha account')) {
                    return { hasCredentials: false };
                }
                throw new Error(error);
            }
        } catch (error) {
            if (error.message.includes('API key not set') || error.message.includes('No Zerodha account')) {
                return { hasCredentials: false };
            }
            throw error;
        }
    },

    // Get holdings
    getHoldings: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/stocks/holdings?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get holdings');
        }

        return await response.json();
    },

    // Get mutual fund holdings
    getMFHoldings: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/mf/holdings?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get MF holdings');
        }

        return await response.json();
    },

    // Get SIPs
    getSIPs: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/mf/sips?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get SIPs');
        }

        return await response.json();
    },

    // Get profile information
    getProfile: async (appUserId) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/zerodha/profile?appUserId=${appUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to get profile');
        }

        return await response.json();
    }
};