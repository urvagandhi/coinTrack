import { apiClient, tokenManager, unwrapResponse } from './api.client';

export const authService = {
  login: async credentials => {
    const { data } = await apiClient.post('/api/auth/login', credentials);
    if (data?.token) {
      tokenManager.setToken(data.token, credentials.rememberMe ?? true);
    }
    return unwrapResponse(data);
  },

  register: async payload => {
    const { data } = await apiClient.post('/api/auth/register', payload);
    return unwrapResponse(data);
  },

  verifyEmail: async (token, email) => {
    const { data } = await apiClient.post('/api/auth/verify-email', {
      token,
      email,
    });
    return unwrapResponse(data);
  },

  resendVerification: async email => {
    const { data } = await apiClient.post('/api/auth/resend-verification', {
      email,
    });
    return unwrapResponse(data);
  },

  forgotPassword: async email => {
    const { data } = await apiClient.post('/api/auth/forgot-password', {
      email,
    });
    return unwrapResponse(data);
  },

  resetPassword: async (token, newPassword) => {
    const { data } = await apiClient.post('/api/auth/reset-password', {
      token,
      newPassword,
    });
    return unwrapResponse(data);
  },

  verify2fa: async (code, tempToken) => {
    const { data } = await apiClient.post(
      '/api/auth/verify-2fa',
      { code },
      { headers: { Authorization: `Bearer ${tempToken}` } }
    );
    if (data?.token) {
      tokenManager.setToken(data.token);
    }
    return unwrapResponse(data);
  },

  setup2fa: async () => {
    const { data } = await apiClient.post('/api/auth/2fa/setup');
    return unwrapResponse(data);
  },

  confirm2fa: async (secret, code) => {
    const { data } = await apiClient.post('/api/auth/2fa/confirm', {
      secret,
      code,
    });
    return unwrapResponse(data);
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      tokenManager.removeToken();
    }
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get('/api/auth/me');
    return unwrapResponse(data);
  },
};

export default authService;
