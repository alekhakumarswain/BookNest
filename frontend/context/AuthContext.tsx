'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, getAccessToken } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load current user profile on initial render
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAccessToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const { data } = await api.get('/api/auth/me');
          setUser(data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setAccessToken(null);
          setToken(null);
          setUser(null);
        }
      } else {
        // Try silent refresh if no access token in localStorage
        try {
          const { data } = await api.post('/api/auth/refresh');
          setAccessToken(data.access_token);
          setToken(data.access_token);
          setUser(data.user);
        } catch (err) {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/api/auth/signup', { name, email, password });
    setAccessToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
