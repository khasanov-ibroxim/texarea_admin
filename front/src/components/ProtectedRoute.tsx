'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Faqat user ma'lumotlarini yuklash
    // Middleware token ni allaqachon tekshirgan
    const loadUser = async () => {
      try {
        const response = await api.get('/auth/check');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [user, setUser]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
    );
  }

  return <>{children}</>;
}