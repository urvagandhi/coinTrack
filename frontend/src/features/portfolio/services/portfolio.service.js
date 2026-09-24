import { apiClient, unwrapResponse } from './api.client';

export const portfolioService = {
  getSummary: async () => {
    const { data } = await apiClient.get('/api/portfolio/summary');
    return unwrapResponse(data);
  },

  getHoldings: async (broker = null) => {
    const url = broker
      ? `/api/portfolio/holdings?broker=${encodeURIComponent(broker)}`
      : '/api/portfolio/holdings';
    const { data } = await apiClient.get(url);
    return unwrapResponse(data);
  },

  getPositions: async (broker = null) => {
    const url = broker
      ? `/api/portfolio/positions?broker=${encodeURIComponent(broker)}`
      : '/api/portfolio/positions';
    const { data } = await apiClient.get(url);
    return unwrapResponse(data);
  },

  getOrders: async (broker = null) => {
    const url = broker
      ? `/api/portfolio/orders?broker=${encodeURIComponent(broker)}`
      : '/api/portfolio/orders';
    const { data } = await apiClient.get(url);
    return unwrapResponse(data);
  },

  getTrades: async (broker = null) => {
    const url = broker
      ? `/api/portfolio/trades?broker=${encodeURIComponent(broker)}`
      : '/api/portfolio/trades';
    const { data } = await apiClient.get(url);
    return unwrapResponse(data);
  },

  getNetWorthHistory: async () => {
    const { data } = await apiClient.get('/api/portfolio/net-worth-history');
    return unwrapResponse(data);
  },
};

export default portfolioService;
