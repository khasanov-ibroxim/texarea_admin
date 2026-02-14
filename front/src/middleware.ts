import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Middleware hech narsa qilmasligiga ruxsat bering
    // Barcha auth tekshiruvlar client-side (ProtectedRoute) da amalga oshadi
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};