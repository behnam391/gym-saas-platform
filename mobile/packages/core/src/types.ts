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
  description?: string | null;
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
  plan: MembershipPlanSummary;
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

export type GymProfessional = {
  id: string;
  name: string;
  specialty: string;
  bio?: string | null;
  profileImageUrl?: string | null;
};

export type GymDetails = GymSummary & {
  phone?: string | null;
  email?: string | null;
  workingHours?: Record<string, string> | null;
  trainers: GymProfessional[];
  nutritionists: GymProfessional[];
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
  }>;
};

export type MembershipRequestResult = {
  membership: AthleteMembership;
  requiresReauthentication: boolean;
  message: string;
};

export type AttendancePass = {
  token: string;
  expiresAt: string;
  expiresInSeconds: number;
  athleteName: string;
  gym: { id: string; name: string; slug: string };
  planTitle: string;
};

export type SessionStore = {
  load(): Promise<SessionTokens | null>;
  save(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
};
