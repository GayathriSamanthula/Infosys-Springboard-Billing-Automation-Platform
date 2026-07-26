const TOKEN_KEY = 'nexora_jwt_token';
const USER_KEY = 'nexora_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    return {
      id: 1,
      name: 'Gayatri Samanthula',
      role: 'System Administrator',
      email: 'gayatri.samanthula@nexora.com',
    };
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
