export type UserRole =
  | 'ATHLETE'
  | 'GYM_OWNER'
  | 'RECEPTION'
  | 'BUFFET'
  | 'TRAINER'
  | 'NUTRITIONIST'
  | 'SUPER_ADMIN';

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  tenantId: string | null;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  expectedRole: UserRole;
};

export type AthleteRegistration = {
  firstName: string;
  lastName: string;
  nationalId: string;
  mobile: string;
  email?: string;
  password: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  city?: string;
  address?: string;
  tenantId?: string;
  membershipPlanId?: string;
};

export type RegistrationResult = {
  userId: string;
  isMinor: boolean;
  membershipRequested: boolean;
  message: string;
};

export type MembershipPlanSummary = {
  id: string;
  title: string;
  durationDays: number;
  price: number | string;
};

export type AthleteMembership = {
  id: string;
  status:
    | 'PENDING_INSURANCE'
    | 'PENDING_PAYMENT'
    | 'ACTIVE'
    | 'EXPIRED'
    | 'SUSPENDED'
    | 'CANCELLED';
  startDate?: string | null;
  endDate?: string | null;
  plan: MembershipPlanSummary & { description?: string | null };
  tenant: { name: string; slug: string };
};

export type AthleteProfileSummary = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  isMinor: boolean;
  isRestricted: boolean;
  memberships: AthleteMembership[];
};

export type GymSummary = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  province?: string | null;
  county?: string | null;
  city?: string | null;
  address?: string | null;
  trustScore: number;
  genderPolicy?: 'MALE' | 'FEMALE' | null;
  facilities: Array<{ id: string; name: string }>;
  membershipPlans: MembershipPlanSummary[];
  galleryImages: Array<{ id: string; url: string; type: string }>;
  distanceKm?: number | null;
};

export type SessionStore = {
  load(): Promise<SessionTokens | null>;
  save(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
};
