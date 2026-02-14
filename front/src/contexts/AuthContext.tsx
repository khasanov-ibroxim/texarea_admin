'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.data.success && response.data.token) {
        const { token, user } = response.data;

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        toast.success('Login muvaffaqiyatli!');

        // BU JUDA MUHIM - "/" ga redirect qilish
        window.location.href = '/';
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login xatosi';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(console.error);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout muvaffaqiyatli');
    window.location.href = '/login';
  };

  return (
      <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};