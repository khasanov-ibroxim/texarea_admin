// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Session cookie (express-session)
    const sessionCookie = request.cookies.get('connect.sid')?.value;
    const path = request.nextUrl.pathname;

    console.log('🔍 Middleware:', {
        path,
        hasSession: !!sessionCookie
    });

    // Public routes
    const isPublicRoute = path === '/login';

    // Protected routes
    const isProtectedRoute =
        path === '/dashboard' ||
        path.startsWith('/dashboard/') ||
        path.startsWith('/blogs') ||
        path.startsWith('/images');

    // Root path
    if (path === '/') {
        const redirectUrl = sessionCookie ? '/dashboard' : '/login';
        console.log(`→ Redirecting to ${redirectUrl}`);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Login page - session bor bo'lsa dashboard ga
    if (isPublicRoute && sessionCookie) {
        console.log('→ Already logged in, redirect to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protected pages - session yo'q bo'lsa login ga
    if (isProtectedRoute && !sessionCookie) {
        console.log('→ Not authenticated, redirect to login');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/login',
        '/dashboard',
        '/dashboard/:path*',
        '/blogs/:path*',
        '/images/:path*',
    ],
};