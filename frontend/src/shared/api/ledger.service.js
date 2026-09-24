import { apiClient, unwrapResponse } from './api.client';

export const ledgerService = {
  // ── EPF ──
  epf: {
    getSummary: async () =>
      unwrapResponse((await apiClient.get('/api/epf/summary')).data),
    getTransactions: async () =>
      unwrapResponse((await apiClient.get('/api/epf/transactions')).data),
    createTransaction: async payload =>
      unwrapResponse(
        (await apiClient.post('/api/epf/transactions', payload)).data
      ),
    updateTransaction: async (id, payload) =>
      unwrapResponse(
        (await apiClient.put(`/api/epf/transactions/${id}`, payload)).data
      ),
    deleteTransaction: async id =>
      unwrapResponse(
        (await apiClient.delete(`/api/epf/transactions/${id}`)).data
      ),
    getSettings: async () =>
      unwrapResponse((await apiClient.get('/api/epf/settings')).data),
    updateSettings: async payload =>
      unwrapResponse((await apiClient.put('/api/epf/settings', payload)).data),
  },

  // ── PPF ──
  ppf: {
    getSummary: async () =>
      unwrapResponse((await apiClient.get('/api/ppf/summary')).data),
    getTransactions: async () =>
      unwrapResponse((await apiClient.get('/api/ppf/transactions')).data),
    createTransaction: async payload =>
      unwrapResponse(
        (await apiClient.post('/api/ppf/transactions', payload)).data
      ),
    updateTransaction: async (id, payload) =>
      unwrapResponse(
        (await apiClient.put(`/api/ppf/transactions/${id}`, payload)).data
      ),
    deleteTransaction: async id =>
      unwrapResponse(
        (await apiClient.delete(`/api/ppf/transactions/${id}`)).data
      ),
    getSettings: async () =>
      unwrapResponse((await apiClient.get('/api/ppf/settings')).data),
    updateSettings: async payload =>
      unwrapResponse((await apiClient.put('/api/ppf/settings', payload)).data),
  },

  // ── Fixed Deposits ──
  fixedDeposit: {
    getSummary: async () =>
      unwrapResponse((await apiClient.get('/api/fixed-deposit/summary')).data),
    getAll: async () =>
      unwrapResponse((await apiClient.get('/api/fixed-deposit')).data),
    create: async payload =>
      unwrapResponse(
        (await apiClient.post('/api/fixed-deposit', payload)).data
      ),
    update: async (id, payload) =>
      unwrapResponse(
        (await apiClient.put(`/api/fixed-deposit/${id}`, payload)).data
      ),
    delete: async id =>
      unwrapResponse((await apiClient.delete(`/api/fixed-deposit/${id}`)).data),
    withdraw: async (id, payload) =>
      unwrapResponse(
        (await apiClient.post(`/api/fixed-deposit/${id}/withdraw`, payload))
          .data
      ),
  },

  // ── Gold & Silver ──
  goldSilver: {
    getSummary: async () =>
      unwrapResponse((await apiClient.get('/api/gold-silver/summary')).data),
    getHoldings: async () =>
      unwrapResponse((await apiClient.get('/api/gold-silver/holdings')).data),
    createHolding: async payload =>
      unwrapResponse(
        (await apiClient.post('/api/gold-silver/holdings', payload)).data
      ),
    updateHolding: async (id, payload) =>
      unwrapResponse(
        (await apiClient.put(`/api/gold-silver/holdings/${id}`, payload)).data
      ),
    deleteHolding: async id =>
      unwrapResponse(
        (await apiClient.delete(`/api/gold-silver/holdings/${id}`)).data
      ),
    getRateSettings: async () =>
      unwrapResponse(
        (await apiClient.get('/api/gold-silver/rate-settings')).data
      ),
    updateRateSettings: async payload =>
      unwrapResponse(
        (await apiClient.put('/api/gold-silver/rate-settings', payload)).data
      ),
    getLiveRates: async () =>
      unwrapResponse((await apiClient.get('/api/gold-silver/live-rates')).data),
  },

  // ── Notes ──
  notes: {
    getAll: async () =>
      unwrapResponse((await apiClient.get('/api/notes')).data),
    create: async payload =>
      unwrapResponse((await apiClient.post('/api/notes', payload)).data),
    update: async (id, payload) =>
      unwrapResponse((await apiClient.put(`/api/notes/${id}`, payload)).data),
    delete: async id =>
      unwrapResponse((await apiClient.delete(`/api/notes/${id}`)).data),
  },
};

export default ledgerService;
