import type {
  AttendancePass,
  AppNotification,
  AthleteGoal,
  AthleteMembership,
  AthletePayment,
  AthleteProfileSummary,
  AthleteProgress,
  AthleteRegistration,
  BodyMeasurement,
  BodyMeasurementInput,
  BasicUserProfile,
  DietPlan,
  FitnessGoal,
  GymDetails,
  GymSummary,
  LoginRequest,
  RegistrationResult,
  MembershipRequestResult,
  OtpChannel,
  OtpRequestResult,
  OtpVerificationResult,
  SessionStore,
  SessionTokens,
  TrainingProgram,
  UploadResult,
  InsuranceDocument,
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

  registerAthlete(input: AthleteRegistration & { verificationToken: string }) {
    return this.request<RegistrationResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  requestOtp(channel: OtpChannel, destination: string) {
    return this.request<OtpRequestResult>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({
        channel,
        destination,
        purpose: 'REGISTER',
      }),
    });
  }

  verifyOtp(challengeId: string, code: string) {
    return this.request<OtpVerificationResult>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
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

  getGym(slug: string) {
    return this.request<GymDetails>(`/tenants/${encodeURIComponent(slug)}`);
  }

  requestMembership(tenantId: string, planId: string) {
    return this.request<MembershipRequestResult>('/athletes/me/memberships', {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify({ tenantId, planId }),
    });
  }

  getAttendancePass() {
    return this.request<AttendancePass>('/attendance/pass', { authenticated: true });
  }

  getMyProfile() {
    return this.request<AthleteProfileSummary>('/athletes/me/profile', { authenticated: true });
  }

  getMyBasicProfile() {
    return this.request<BasicUserProfile>('/profiles/me', { authenticated: true });
  }

  updateMyBasicProfile(
    input: Partial<Pick<BasicUserProfile, 'firstName' | 'lastName' | 'city' | 'address' | 'profileImageUrl'>>,
  ) {
    return this.request<BasicUserProfile>('/profiles/me', {
      method: 'PATCH',
      authenticated: true,
      body: JSON.stringify(input),
    });
  }

  uploadFile(
    purpose: 'PROFILE_IMAGE' | 'INSURANCE_DOCUMENT',
    file: { uri: string; name: string; type: string },
  ) {
    const form = new FormData();
    form.append('purpose', purpose);
    form.append('file', file as unknown as Blob);
    return this.request<UploadResult>('/uploads/local', {
      method: 'POST',
      authenticated: true,
      body: form,
    });
  }

  uploadProfileImage(file: { uri: string; name: string; type: string }) {
    return this.uploadFile('PROFILE_IMAGE', file);
  }

  getMyMemberships() {
    return this.request<AthleteMembership[]>('/athletes/me/memberships', { authenticated: true });
  }

  getMyTrainingPrograms() {
    return this.request<TrainingProgram[]>('/programs/me', { authenticated: true });
  }

  getMyDietPlans() {
    return this.request<DietPlan[]>('/diet/me', { authenticated: true });
  }

  getMyProgress() {
    return this.request<AthleteProgress>('/athletes/me/progress', { authenticated: true });
  }

  getMyMeasurements() {
    return this.request<BodyMeasurement[]>('/athletes/me/measurements', {
      authenticated: true,
    });
  }

  addMyMeasurement(input: BodyMeasurementInput) {
    return this.request<BodyMeasurement>('/athletes/me/measurements', {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify(input),
    });
  }

  createMyGoal(input: { type: FitnessGoal; targetValue?: number; targetDate?: string }) {
    return this.request<AthleteGoal>('/athletes/me/goals', {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify(input),
    });
  }

  getMyPayments() {
    return this.request<AthletePayment[]>('/payments/mine', { authenticated: true });
  }

  startMembershipPayment(membershipId: string) {
    return this.request<{ paymentId: string; redirectUrl: string }>(
      `/payments/memberships/${encodeURIComponent(membershipId)}/zarinpal`,
      { method: 'POST', authenticated: true },
    );
  }

  submitInsurance(input: {
    documentUrl: string;
    provider?: string;
    policyNumber?: string;
    validFrom?: string;
    validUntil?: string;
  }) {
    return this.request<InsuranceDocument>('/athletes/me/insurance', {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify(input),
    });
  }

  getMyNotifications() {
    return this.request<AppNotification[]>('/notifications/mine', {
      authenticated: true,
    });
  }

  markNotificationRead(notificationId: string) {
    return this.request<{ updated: number }>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: 'PATCH', authenticated: true },
    );
  }

  markAllNotificationsRead() {
    return this.request<{ updated: number }>('/notifications/read-all', {
      method: 'PATCH',
      authenticated: true,
    });
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
    if (
      options.body &&
      !(typeof FormData !== 'undefined' && options.body instanceof FormData)
    ) {
      headers.set('Content-Type', 'application/json');
    }
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
