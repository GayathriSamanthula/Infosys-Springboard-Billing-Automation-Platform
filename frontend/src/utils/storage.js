const TOKEN_KEY = 'nexora_jwt_token';
const USER_KEY = 'nexora_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token'),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
  },

  getUser: () => {
    const user = localStorage.getItem(USER_KEY) || localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch (e) {}
    }
    return null;
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  },
  removeUser: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
  },
};
