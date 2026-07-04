'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load cached user profile and attempt to fetch active session
  useEffect(() => {
    const initializeAuth = async () => {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      await checkSession();
    };

    initializeAuth();
  }, []);

  const checkSession = async () => {
    try {
      // Trigger a token refresh immediately on load
      const res = await apiClient.post('/api/auth/refresh');
      const { accessToken: newAccessToken } = res.data;

      // Set Axios auth header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      setAccessToken(newAccessToken);

      // Get profile details
      const profileRes = await apiClient.get('/api/auth/me');
      setUser(profileRes.data);
      localStorage.setItem('user', JSON.stringify(profileRes.data));
    } catch (err) {
      console.log('No active session found or refresh token expired.');
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      const { accessToken: token, user: userData } = res.data;

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessToken(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/signup', { name, email, password });
      const { accessToken: token, user: userData } = res.data;

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessToken(token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.error('Error loging out from server:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout, checkSession }}>
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
