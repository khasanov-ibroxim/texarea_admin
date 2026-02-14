// lib/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // ← BU JUda MUHIM! Cookie lar bilan ishlash uchun
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - debug uchun
api.interceptors.request.use(
    (config) => {
        console.log('🚀 Request:', {
            method: config.method,
            url: config.url,
            withCredentials: config.withCredentials,
        });
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - debug uchun
api.interceptors.response.use(
    (response) => {
        console.log('✅ Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
            headers: response.headers,
        });
        return response;
    },
    (error) => {
        console.error('❌ Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
        });
        return Promise.reject(error);
    }
);

export default api;