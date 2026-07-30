import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { demoRequest } from '../../../../lib/demo-api';

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3000/api/v1';

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
const DEMO_MODE =
  process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  role: string;
  tenantId: string | null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

async function readBody(request: NextRequest): Promise<ArrayBuffer | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function forward(
  request: NextRequest,
  endpoint: string,
  accessToken?: string,
  bodyOverride?: string,
) {
  if (DEMO_MODE) {
    let body: unknown = bodyOverride;
    if (!bodyOverride) {
      const rawBody = await readBody(request);
      body = rawBody ? new TextDecoder().decode(rawBody) : undefined;
    }
    return demoRequest(endpoint, {
      method: request.method as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
      body,
      accessToken,
    });
  }

  const contentType = request.headers.get('content-type');
  const headers = new Headers({ Accept: 'application/json' });
  if (contentType) headers.set('Content-Type', contentType);
  if (bodyOverride) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const clientIp =
    request.headers.get('cf-connecting-ip') ??
    firstForwardedValue(request.headers.get('x-forwarded-for'));
  if (clientIp) headers.set('X-Forwarded-For', clientIp);

  return fetch(`${API_BASE}${endpoint}`, {
    method: request.method,
    headers,
    body: bodyOverride ?? (await readBody(request)),
    cache: 'no-store',
  });
}

async function asNextResponse(response: Response) {
  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

function setSessionCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60));
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(30 * 24 * 60 * 60),
  );
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, '', cookieOptions(0));
}

type RouteContext = { params: Promise<{ path: string[] }> };

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    // Next.js sees the container's internal URL behind Caddy. Caddy provides
    // the original public host/protocol through the standard forwarded
    // headers, so CSRF validation must compare against those values.
    const effectiveHost =
      firstForwardedValue(request.headers.get('x-forwarded-host')) ??
      request.headers.get('host') ??
      request.nextUrl.host;
    const effectiveProtocol =
      firstForwardedValue(request.headers.get('x-forwarded-proto')) ??
      request.nextUrl.protocol.replace(':', '');

    return (
      originUrl.host.toLowerCase() === effectiveHost.toLowerCase() &&
      originUrl.protocol === `${effectiveProtocol.toLowerCase()}:`
    );
  } catch {
    return false;
  }
}

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const pathname = `/${path.join('/')}`;
  const endpoint = `${pathname}${request.nextUrl.search}`;

  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { message: 'درخواست از مبدا نامعتبر رد شد.' },
        { status: 403 },
      );
    }
  }

  // Refresh rotation is an internal BFF operation. Never return a refresh
  // token to browser JavaScript through the generic proxy surface.
  if (pathname === '/auth/refresh') {
    return NextResponse.json({ message: 'مسیر یافت نشد.' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (pathname === '/auth/login' && request.method === 'POST') {
    const backendResponse = await forward(request, endpoint);
    const payload = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    const tokens = payload as TokenPair;
    const response = NextResponse.json({
      role: tokens.role,
      tenantId: tokens.tenantId,
    });
    setSessionCookies(response, tokens);
    return response;
  }

  if (pathname === '/auth/logout' && request.method === 'POST') {
    const backendResponse = refreshToken
      ? await forward(
          request,
          endpoint,
          undefined,
          JSON.stringify({ refreshToken }),
        )
      : new Response(JSON.stringify({ message: 'خروج با موفقیت انجام شد.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    const response = await asNextResponse(backendResponse);
    clearSessionCookies(response);
    return response;
  }

  let backendResponse = await forward(request, endpoint, accessToken);

  if (backendResponse.status === 401 && refreshToken) {
    const refreshResponse = DEMO_MODE
      ? await demoRequest('/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        })
      : await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          cache: 'no-store',
        });

    if (refreshResponse.ok) {
      const tokens = (await refreshResponse.json()) as TokenPair;
      backendResponse = await forward(request, endpoint, tokens.accessToken);
      const response = await asNextResponse(backendResponse);
      setSessionCookies(response, tokens);
      return response;
    }

    const response = await asNextResponse(backendResponse);
    clearSessionCookies(response);
    return response;
  }

  return asNextResponse(backendResponse);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
