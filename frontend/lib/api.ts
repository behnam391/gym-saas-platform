const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const SERVER_DEMO_MODE =
  process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface RequestOptions extends RequestInit {
  accessToken?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const isBrowser = typeof window !== 'undefined';
  // Browser requests pass through the Next.js BFF. It owns the httpOnly
  // session cookies, refreshes expired access tokens, and never exposes a
  // refresh token to JavaScript. Server Components call Nest directly.
  let res: Response;
  if (!isBrowser && SERVER_DEMO_MODE) {
    const { demoRequest } = await import('./demo-api');
    res = await demoRequest(path, {
      method: (rest.method as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE') ?? 'GET',
      body: rest.body,
      accessToken,
    });
  } else {
    const url = isBrowser ? `/api/backend${path}` : `${API_BASE}${path}`;
    res = await fetch(url, {
      ...rest,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join('، ')
      : body.message;
    throw new ApiError(res.status, message ?? 'خطایی در ارتباط با سرور رخ داد.');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
