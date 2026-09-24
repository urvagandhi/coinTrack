import { apiClient, unwrapResponse } from './api.client';

export const mutualFundsService = {
  // Safe internal proxy search (never calls external api.mfapi.in from browser)
  searchSchemes: async query => {
    if (!query || query.trim().length < 2) return [];
    const response = await fetch(
      `/api/mf-search?q=${encodeURIComponent(query.trim())}`
    );
    if (!response.ok) return [];
    return response.json();
  },

  getSummary: async () => {
    const { data } = await apiClient.get('/api/mutual-fund/summary');
    return unwrapResponse(data);
  },

  getHoldings: async () => {
    const { data } = await apiClient.get('/api/mutual-fund/holdings');
    return unwrapResponse(data);
  },

  getOrders: async () => {
    const { data } = await apiClient.get('/api/mutual-fund/orders');
    return unwrapResponse(data);
  },

  getSips: async () => {
    const { data } = await apiClient.get('/api/mutual-fund/sips');
    return unwrapResponse(data);
  },

  createSip: async payload => {
    const { data } = await apiClient.post('/api/mutual-fund/sips', payload);
    return unwrapResponse(data);
  },

  updateSip: async (id, payload) => {
    const { data } = await apiClient.put(
      `/api/mutual-fund/sips/${id}`,
      payload
    );
    return unwrapResponse(data);
  },

  deleteSip: async id => {
    const { data } = await apiClient.delete(`/api/mutual-fund/sips/${id}`);
    return unwrapResponse(data);
  },

  createLumpsum: async payload => {
    const { data } = await apiClient.post('/api/mutual-fund/lumpsum', payload);
    return unwrapResponse(data);
  },

  updateLumpsum: async (id, payload) => {
    const { data } = await apiClient.put(
      `/api/mutual-fund/lumpsum/${id}`,
      payload
    );
    return unwrapResponse(data);
  },

  deleteLumpsum: async id => {
    const { data } = await apiClient.delete(`/api/mutual-fund/lumpsum/${id}`);
    return unwrapResponse(data);
  },

  getRedemptionPreviewFifo: async ({ schemeId, date, units }) => {
    const params = new URLSearchParams({
      schemeId,
      date,
      units: String(units),
    });
    const { data } = await apiClient.get(
      `/api/mutual-fund/redemption/preview-fifo?${params}`
    );
    return unwrapResponse(data);
  },

  createRedemption: async payload => {
    const { data } = await apiClient.post(
      '/api/mutual-fund/redemption',
      payload
    );
    return unwrapResponse(data);
  },

  updateRedemption: async (id, payload) => {
    const { data } = await apiClient.put(
      `/api/mutual-fund/redemption/${id}`,
      payload
    );
    return unwrapResponse(data);
  },

  deleteRedemption: async id => {
    const { data } = await apiClient.delete(
      `/api/mutual-fund/redemption/${id}`
    );
    return unwrapResponse(data);
  },

  getValuations: async () => {
    const { data } = await apiClient.get('/api/mutual-fund/valuation');
    return unwrapResponse(data);
  },

  createValuation: async payload => {
    const { data } = await apiClient.post(
      '/api/mutual-fund/valuation',
      payload
    );
    return unwrapResponse(data);
  },

  updateValuation: async (id, payload) => {
    const { data } = await apiClient.put(
      `/api/mutual-fund/valuation/${id}`,
      payload
    );
    return unwrapResponse(data);
  },

  deleteValuation: async id => {
    const { data } = await apiClient.delete(`/api/mutual-fund/valuation/${id}`);
    return unwrapResponse(data);
  },
};

export default mutualFundsService;
