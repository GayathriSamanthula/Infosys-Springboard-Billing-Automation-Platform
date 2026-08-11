import api from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';
import { storage } from '../utils/storage';

export const authService = {
  login: async (email, password) => {
    try {
      // 1. Attempt login with backend FastAPI
      const response = await api.post(ENDPOINTS.LOGIN, { email, password });
      const { access_token } = response.data;
      const userObj = {
        id: response.data.user_id || 5,
        email: email,
        role: response.data.role || 'System Administrator',
        name: 'Gayatri Samanthula',
      };
      storage.setToken(access_token);
      storage.setUser(userObj);
      return { success: true, token: access_token, user: userObj };
    } catch (error) {
      console.warn('Authentication failed for admin login:', error);
      const errMsg = error?.response?.data?.detail || 'Invalid admin email or password.';
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    storage.clearAuth();
  },

  getCurrentUser: () => {
    return storage.getUser();
  },
};
