'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Loading tugagandan keyin tekshirish
    if (!loading) {
      const token = localStorage.getItem('auth_token');

      console.log('🔒 ProtectedRoute check:', {
        user,
        hasToken: !!token,
        loading
      });

      if (!token || !user) {
        console.log('❌ No auth - redirecting to login');
        router.push('/login');
      } else {
        console.log('✅ Authenticated - showing content');
        setIsChecking(false);
      }
    }
  }, [user, loading, router]);

  // Loading yoki checking holatida
  if (loading || isChecking) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
    );
  }

  // User yo'q bo'lsa null qaytarish
  if (!user) {
    return null;
  }

  // User bor bo'lsa content ko'rsatish
  return <>{children}</>;
}