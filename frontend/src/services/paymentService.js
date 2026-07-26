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
    const response = await api.post(ENDPOINTS.PROCESS_PAYMENT, {
      subscription_id: Number(data.subscription_id),
      amount: Number(data.amount),
      payment_method: data.payment_method,
    });
    return response.data;
  },
};
