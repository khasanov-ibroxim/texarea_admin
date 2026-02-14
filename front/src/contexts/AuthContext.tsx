'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    try {
      console.log('1️⃣ Login qilinmoqda...', { username });

      const response = await api.post('/auth/login', { username, password });

      console.log('2️⃣ Server javobi:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      // Response headers da Set-Cookie bormi?
      console.log('3️⃣ Set-Cookie header:', response.headers['set-cookie']);

      // Browser cookie lari
      console.log('4️⃣ document.cookie (login dan oldin):', document.cookie);

      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Login muvaffaqiyatli!');

        // 1 soniya kutamiz - cookie set bo'lishini kutish
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('5️⃣ document.cookie (1 soniya kutgandan keyin):', document.cookie);

        // Agar cookie hali ham bo'sh bo'lsa
        if (!document.cookie.includes('auth_token')) {
          console.error('❌ XATO: Cookie set bo\'lmadi!');
          console.error('Backend CORS yoki cookie konfiguratsiyasini tekshiring!');
          toast.error('Cookie muammosi! Backend ni tekshiring.');
          return;
        }

        console.log('6️⃣ Redirect qilinmoqda /dashboard ga...');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('❌ Login xatosi:', error);
      console.error('Error response:', error.response);
      const message = error.response?.data?.message || 'Login xatosi';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logout...');
    api.post('/auth/logout').catch(console.error);
    setUser(null);
    toast.success('Logout muvaffaqiyatli');
    window.location.href = '/login';
  };

  return (
      <AuthContext.Provider value={{ user, setUser, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};