import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const planService = {
  /**
   * Fetch all plans dynamically from the FastAPI backend GET /plans
   */
  getAll: async (status = null) => {
    try {
      const response = await api.get(ENDPOINTS.PLANS, {
        params: status ? { status } : {},
      });
      return response.data;
    } catch (error) {
      console.warn('FastAPI backend not reachable on GET /plans, returning empty array or local cache', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await api.get(ENDPOINTS.PLAN_BY_ID(id));
    return response.data;
  },

  create: async (planData) => {
    const response = await api.post(ENDPOINTS.PLANS, {
      name: planData.name,
      description: planData.description || '',
      price: Number(planData.price),
      billing_cycle: (planData.billing_cycle || 'MONTHLY').toUpperCase(),
      trial_period_days: Number(planData.trial_period_days || 0),
      features: planData.features || '',
      status: planData.status || 'ACTIVE',
    });
    return response.data;
  },

  update: async (id, planData) => {
    const payload = { ...planData };
    if (payload.billing_cycle) {
      payload.billing_cycle = payload.billing_cycle.toUpperCase();
    }
    const response = await api.put(ENDPOINTS.PLAN_BY_ID(id), payload);
    return response.data;
  },

  archive: async (id) => {
    const response = await api.put(ENDPOINTS.ARCHIVE_PLAN(id));
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(ENDPOINTS.PLAN_BY_ID(id));
    return response.data;
  },
};
