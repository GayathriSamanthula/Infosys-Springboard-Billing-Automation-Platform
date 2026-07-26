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
    const response = await api.post(ENDPOINTS.PROCESS_REFUND, {
      invoice_id: Number(data.invoice_id),
      reason: data.reason || null,
    });
    return response.data;
  },
};
