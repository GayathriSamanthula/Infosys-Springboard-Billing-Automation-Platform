import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const customerService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.CUSTOMERS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /customers failed or offline', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await api.get(ENDPOINTS.CUSTOMER_BY_ID(id));
    return response.data;
  },

  getHistory: async (id) => {
    try {
      const response = await api.get(`/customers/${id}/history`);
      return response.data;
    } catch (err) {
      const custRes = await api.get(ENDPOINTS.CUSTOMER_BY_ID(id));
      return { customer: custRes.data, subscriptions: [], invoices: [] };
    }
  },

  create: async (data) => {
    const response = await api.post(ENDPOINTS.CUSTOMERS, {
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      country: data.country || 'India',
      address: data.address || null,
      customer_status: (data.customer_status || 'ACTIVE').toUpperCase(),
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(ENDPOINTS.CUSTOMER_BY_ID(id), {
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      country: data.country || 'India',
      address: data.address || null,
      customer_status: (data.customer_status || 'ACTIVE').toUpperCase(),
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(ENDPOINTS.CUSTOMER_BY_ID(id));
    return response.data;
  },
};
