'use client';

import { useEffect } from 'react';

export default function HomePage() {
    useEffect(() => {
        // Root page ga kirsangiz avtomatik dashboard ga yo'naltirish
        window.location.href = '/dashboard';
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}