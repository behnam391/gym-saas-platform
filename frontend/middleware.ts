import { NextRequest, NextResponse } from 'next/server';
import { dashboardForRole } from './lib/auth';

function readRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const portal = request.nextUrl.pathname.startsWith('/dashboard/gym-owner')
    ? 'owner'
    : request.nextUrl.pathname.startsWith('/dashboard/super-admin')
      ? 'admin'
      : request.nextUrl.pathname.startsWith('/dashboard/nutritionist')
        ? 'nutritionist'
        : request.nextUrl.pathname.startsWith('/dashboard/reception')
          ? 'reception'
          : request.nextUrl.pathname.startsWith('/dashboard/buffet')
            ? 'buffet'
            : request.nextUrl.pathname.startsWith('/dashboard/trainer')
              ? 'trainer'
              : 'athlete';
  const loginUrl = new URL(`/auth/login/${portal}`, request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);

  if (!token) return NextResponse.redirect(loginUrl);

  const role = readRole(token);
  if (!role) return NextResponse.redirect(loginUrl);

  const allowedRoot = dashboardForRole(role);
  if (!request.nextUrl.pathname.startsWith(allowedRoot)) {
    return NextResponse.redirect(new URL(allowedRoot, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
