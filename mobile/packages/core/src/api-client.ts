import type {
  AthleteRegistration,
  GymSummary,
  LoginRequest,
  RegistrationResult,
  SessionStore,
  SessionTokens,
} from './types';

type RequestOptions = RequestInit & {
  authenticated?: boolean;
  retryAfterRefresh?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class GordyarApiClient {
  private refreshPromise: Promise<SessionTokens | null> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly sessionStore: SessionStore,
  ) {}

  async login(input: Omit<LoginRequest, 'expectedRole'>): Promise<SessionTokens> {
    const tokens = await this.request<SessionTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...input, expectedRole: 'ATHLETE' }),
    });
    await this.sessionStore.save(tokens);
    return tokens;
  }

  registerAthlete(input: AthleteRegistration) {
    return this.request<RegistrationResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  searchGyms(query: Record<string, string | number | undefined> = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    const suffix = params.size ? `?${params.toString()}` : '';
    return this.request<GymSummary[]>(`/tenants${suffix}`);
  }

  getMyProfile<T = unknown>() {
    return this.request<T>('/athletes/me/profile', { authenticated: true });
  }

  getMyMemberships<T = unknown>() {
    return this.request<T>('/athletes/me/memberships', { authenticated: true });
  }

  async logout() {
    const session = await this.sessionStore.load();
    if (session?.refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } finally {
        await this.sessionStore.clear();
      }
    }
  }

  private async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const session = options.authenticated ? await this.sessionStore.load() : null;
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body) headers.set('Content-Type', 'application/json');
    if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);

    const response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });

    if (
      response.status === 401 &&
      options.authenticated &&
      options.retryAfterRefresh !== false
    ) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.request<T>(path, { ...options, retryAfterRefresh: false });
      }
    }

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
          ? payload.message
          : 'ارتباط با گُردیار ناموفق بود.';
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  private refreshSession() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<SessionTokens | null> {
    const session = await this.sessionStore.load();
    if (!session?.refreshToken) return null;

    try {
      const next = await this.request<SessionTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      await this.sessionStore.save(next);
      return next;
    } catch {
      await this.sessionStore.clear();
      return null;
    }
  }
}
