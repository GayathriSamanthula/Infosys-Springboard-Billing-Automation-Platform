import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const refundService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.REFUNDS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /refunds failed or offline', error);
      return [];
    }
  },

  processRefund: async (data) => {
    const payload = {
      invoice_id: Number(data.invoice_id),
      reason: data.reason || null,
    };
    if (data.amount !== undefined && data.amount !== null && data.amount !== '') {
      payload.amount = Number(data.amount);
    }
    const response = await api.post(ENDPOINTS.PROCESS_REFUND, payload);
    return response.data;
  },
};
