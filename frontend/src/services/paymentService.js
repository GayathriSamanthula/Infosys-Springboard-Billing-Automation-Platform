import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const paymentService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /payments failed or offline', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await api.get(ENDPOINTS.PAYMENT_BY_ID(id));
    return response.data;
  },

  processPayment: async (data) => {
    const payload = {
      subscription_id: Number(data.subscription_id),
      amount: Number(data.amount),
      payment_method: data.payment_method,
    };
    if (data.invoice_id) {
      payload.invoice_id = Number(data.invoice_id);
    }
    const response = await api.post(ENDPOINTS.PROCESS_PAYMENT, payload);
    return response.data;
  },
};
