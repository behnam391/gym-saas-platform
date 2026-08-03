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

export type OtpChannel = 'SMS' | 'EMAIL';
export type OtpPurpose = 'REGISTER' | 'ONBOARDING' | 'RESET_PASSWORD' | 'LOGIN';

export type OtpRequestResult = {
  challengeId: string;
  expiresAt: string;
  retryAfterSeconds: number;
  message: string;
  debugCode?: string;
};

export type OtpVerificationResult = {
  verificationToken: string;
  channel: OtpChannel;
  destination: string;
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
  address?: string | null;
  profileImageUrl?: string | null;
  isMinor: boolean;
  isRestricted: boolean;
  parentalConsent?: ParentalConsent | null;
  insuranceDocs: InsuranceDocument[];
  memberships: AthleteMembership[];
};

export type BasicUserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  role: UserRole;
  city?: string | null;
  address?: string | null;
  profileImageUrl?: string | null;
  tenant?: { id: string; name: string; logoUrl?: string | null } | null;
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

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type FitnessGoal =
  | 'FAT_LOSS'
  | 'MUSCLE_GAIN'
  | 'GENERAL_FITNESS'
  | 'ENDURANCE'
  | 'REHABILITATION';

export type TrainingExercise = {
  id: string;
  name: string;
  sets?: number | null;
  reps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  sortOrder: number;
};

export type TrainingSession = {
  id: string;
  dayOfWeek: number;
  title: string;
  exercises: TrainingExercise[];
};

export type TrainingProgram = {
  id: string;
  title: string;
  goal?: FitnessGoal | null;
  status: ProgramStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  trainer: {
    user: { firstName: string; lastName: string };
  };
  sessions: TrainingSession[];
};

export type DietMeal = {
  id: string;
  mealTime: string;
  description: string;
  calories?: number | null;
  sortOrder: number;
};

export type DietPlan = {
  id: string;
  title: string;
  goal?: FitnessGoal | null;
  status: ProgramStatus;
  dailyCalories?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  nutritionist: {
    user: { firstName: string; lastName: string };
  };
  meals: DietMeal[];
};

export type BodyMeasurement = {
  id: string;
  recordedAt: string;
  weightKg?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  calfCm?: number | null;
  neckCm?: number | null;
  shoulderCm?: number | null;
  bodyFatPercent?: number | null;
};

export type BodyMeasurementInput = Omit<BodyMeasurement, 'id' | 'recordedAt'> & {
  recordedAt?: string;
};

export type AthleteGoal = {
  id: string;
  type: FitnessGoal;
  targetValue?: number | null;
  targetDate?: string | null;
  achieved: boolean;
  createdAt: string;
};

export type AthleteProgress = {
  latestMeasurement?: BodyMeasurement | null;
  weightChangeKg?: number | null;
  attendanceLast30Days: number;
  activePrograms: number;
  activeDiets: number;
  goals: AthleteGoal[];
  measurements: BodyMeasurement[];
};

export type AthletePayment = {
  id: string;
  amount: number | string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  method: 'CASH' | 'POS' | 'ONLINE_GATEWAY' | 'WALLET';
  gatewayRef?: string | null;
  gatewayCardPan?: string | null;
  paidAt?: string | null;
  createdAt: string;
  membership?: { plan?: { title: string } } | null;
  order?: { id: string; totalAmount: number | string } | null;
};

export type UploadResult = {
  url: string;
  purpose: string;
  ownerId: string;
  size: number;
  contentType: string;
};

export type InsuranceDocument = {
  id: string;
  documentUrl: string;
  provider?: string | null;
  policyNumber?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

export type ParentalConsent = {
  id: string;
  guardianName: string;
  guardianNationalId: string;
  guardianMobile: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  channel: 'IN_APP' | 'SMS' | 'EMAIL' | 'PUSH';
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type PlatformProfessional = {
  id: string;
  type: 'TRAINER' | 'NUTRITIONIST';
  fullName: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  specialties: string[];
  province?: string | null;
  city?: string | null;
  serviceMode: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  consultationFee?: number | string | null;
  rating: number;
  isFeatured: boolean;
  isActive: boolean;
};

export type ConsultationRequest = {
  id: string;
  professionalId: string;
  status: 'REQUESTED' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  preferredAt?: string | null;
  message?: string | null;
  createdAt: string;
  professional: PlatformProfessional;
};

export type SessionStore = {
  load(): Promise<SessionTokens | null>;
  save(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
};
