import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const prorationService = {
  calculateProration: async (subscriptionId, newPlanId) => {
    const response = await api.post(ENDPOINTS.PRORATION_CALCULATE, {
      subscription_id: Number(subscriptionId),
      new_plan_id: Number(newPlanId),
    });
    return response.data;
  },
};
