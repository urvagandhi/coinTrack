import { apiClient, unwrapResponse } from './api.client';

export const brokersService = {
  getStatus: async () => {
    const { data } = await apiClient.get('/api/brokers/status');
    return unwrapResponse(data);
  },

  syncBroker: async broker => {
    const { data } = await apiClient.post(`/api/brokers/${broker}/sync`);
    return unwrapResponse(data);
  },

  disconnectBroker: async broker => {
    const { data } = await apiClient.delete(`/api/brokers/${broker}`);
    return unwrapResponse(data);
  },

  connectZerodha: async payload => {
    const { data } = await apiClient.post(
      '/api/brokers/zerodha/connect',
      payload
    );
    return unwrapResponse(data);
  },

  connectUpstox: async payload => {
    const { data } = await apiClient.post(
      '/api/brokers/upstox/connect',
      payload
    );
    return unwrapResponse(data);
  },

  connectAngelOne: async payload => {
    const { data } = await apiClient.post(
      '/api/brokers/angelone/connect',
      payload
    );
    return unwrapResponse(data);
  },
};

export default brokersService;
