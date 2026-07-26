import api from './api';

export const billingCycleService = {
  getAll: async () => {
    const response = await api.get('/billing-cycles/');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/billing-cycles/${id}`);
    return response.data;
  },

  runBillingEngine: async () => {
    const response = await api.post('/billing-cycles/run');
    return response.data;
  },
};

export default billingCycleService;
