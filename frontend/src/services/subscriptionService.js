import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const subscriptionService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.SUBSCRIPTIONS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /subscriptions failed or offline', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await api.get(ENDPOINTS.SUBSCRIPTION_BY_ID(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(ENDPOINTS.SUBSCRIPTIONS, {
      customer_id: Number(data.customer_id),
      plan_id: Number(data.plan_id),
      auto_renew: data.auto_renew ?? true,
    });
    return response.data;
  },

  pause: async (id) => {
    const response = await api.put(ENDPOINTS.PAUSE_SUBSCRIPTION(id));
    return response.data;
  },

  resume: async (id) => {
    const response = await api.put(ENDPOINTS.RESUME_SUBSCRIPTION(id));
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(ENDPOINTS.CANCEL_SUBSCRIPTION(id));
    return response.data;
  },
};
