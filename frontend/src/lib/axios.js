import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
    withCredentials: true, // Send HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for 401 handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Convert API error to user-friendly message
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        // Handle 401 Unauthorized (Token Expiry)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint
                await api.post('/api/auth/refresh');

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - Redirect to login or let the error propagate
                // In a real app, you might trigger a global logout action here
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
