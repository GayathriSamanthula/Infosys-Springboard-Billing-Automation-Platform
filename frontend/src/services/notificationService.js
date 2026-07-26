import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const notificationService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.NOTIFICATIONS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /notifications failed or offline', error);
      return [];
    }
  },

  markAsRead: async (id) => {
    const response = await api.patch(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    return response.data;
  },
};
