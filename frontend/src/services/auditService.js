import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';

export const auditService = {
  getAll: async () => {
    try {
      const response = await api.get(ENDPOINTS.AUDIT_LOGS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('GET /audit-logs failed or offline', error);
      return [];
    }
  },
};
