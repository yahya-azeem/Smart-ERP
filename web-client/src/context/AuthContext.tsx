import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, setTenantFromToken } from '../api/client';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // CVE-06: Use sessionStorage instead of localStorage to reduce XSS exposure
  // Token is not persisted across browser restarts, reducing the theft window
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // CVE-13: Dynamically set tenant-id from JWT claims
      setTenantFromToken(token);
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      delete apiClient.defaults.headers.common['x-tenant-id'];
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
