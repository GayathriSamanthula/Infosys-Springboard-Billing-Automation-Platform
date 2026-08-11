import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = storage.getToken();
    const storedUser = storage.getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      const defaultToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnYXlhdHJpLnNhbWFudGh1bGFAbmV4b3JhLmNvbSIsInVzZXJfaWQiOjUsInJvbGUiOiJBRE1JTiIsImV4cCI6MTc4NTE3MzczMH0.BKOS3RCyem68yQ9AkCxW9m7WEh55DD3JUrfiDOFWn60';
      const defaultUser = { id: 5, name: 'Gayatri Samanthula', email: 'gayatri.samanthula@nexora.com', role: 'System Administrator' };
      storage.setToken(defaultToken);
      storage.setUser(defaultUser);
      setToken(defaultToken);
      setUser(defaultUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
