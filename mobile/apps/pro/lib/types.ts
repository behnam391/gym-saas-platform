import type { AppNotification, BasicUserProfile, UserRole } from '@gordyar/mobile-core';

export type ProRole = Extract<
  UserRole,
  'GYM_OWNER' | 'RECEPTION' | 'BUFFET_STAFF' | 'TRAINER' | 'NUTRITIONIST'
>;

export const ROLE_META: Record<
  ProRole,
  { label: string; shortLabel: string; icon: string; description: string }
> = {
  GYM_OWNER: {
    label: 'مدیر باشگاه',
    shortLabel: 'مدیریت',
    icon: 'business',
    description: 'اعضا، پرسنل، مالی و عملیات باشگاه',
  },
  RECEPTION: {
    label: 'پذیرش',
    shortLabel: 'پذیرش',
    icon: 'scan',
    description: 'ورود و خروج، اعضا و درخواست‌ها',
  },
  BUFFET_STAFF: {
    label: 'بوفه‌دار',
    shortLabel: 'بوفه',
    icon: 'cafe',
    description: 'سفارش‌ها، محصولات و موجودی',
  },
  TRAINER: {
    label: 'مربی',
    shortLabel: 'مربی',
    icon: 'barbell',
    description: 'شاگردان و برنامه‌های تمرینی',
  },
  NUTRITIONIST: {
    label: 'مشاور تغذیه',
    shortLabel: 'تغذیه',
    icon: 'nutrition',
    description: 'مراجعان و برنامه‌های غذایی',
  },
};

export type ProProfile = BasicUserProfile;

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  isActive: boolean;
  isRestricted: boolean;
  isMinor: boolean;
  memberships: Array<{
    id: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    plan: { title: string };
  }>;
  insuranceDocs?: Array<{
    id: string;
    status: string;
    provider?: string | null;
    validUntil?: string | null;
  }>;
  parentalConsent?: { id: string; status: string } | null;
};

export type CrowdStatus = {
  activeCount: number;
  capacity: number;
  percentage: number;
  level?: string;
};

export type AttendanceRecord = {
  id: string;
  checkInAt: string;
  checkOutAt?: string | null;
  method: string;
  user: { id: string; firstName: string; lastName: string; mobile: string };
  membership?: { plan: { title: string } } | null;
};

export type PaymentSummary = {
  revenueThisMonth: number;
  successfulPaymentsThisMonth: number;
  pendingPayments: number;
  activeMemberships: number;
};

export type StaffRole = Exclude<ProRole, 'GYM_OWNER'>;
export type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  trainerProfile?: { specialties: string[]; status: string } | null;
  nutritionistProfile?: { status: string } | null;
  temporaryPassword?: string;
};

export type CafeteriaSummary = {
  openOrders: number;
  readyOrders: number;
  lowStock: number;
  products: number;
  deliveredRevenue: number;
};

export type CafeteriaCategory = { id: string; name: string };
export type CafeteriaProduct = {
  id: string;
  title: string;
  description?: string | null;
  price: number | string;
  inventory: number;
  isActive: boolean;
  category: CafeteriaCategory;
};

export type CafeteriaOrder = {
  id: string;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number | string;
  createdAt: string;
  user: { firstName: string; lastName: string; mobile: string };
  items: Array<{ id: string; quantity: number; product: { title: string } }>;
};

export type TrainerStudent = {
  id: string;
  user: { id: string; firstName: string; lastName: string; mobile: string };
};

export type NutritionClient = {
  id: string;
  user: { id: string; firstName: string; lastName: string; mobile: string };
  athlete: {
    weightKg?: number | null;
    measurements: Array<{ weightKg?: number | null }>;
    goals: Array<{ type: string }>;
  };
};

export type Conversation = {
  conversationId: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  } | null;
  lastMessage: Message;
  unreadCount: number;
};

export type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; role: UserRole };
};

export type ProNotification = AppNotification;

export type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
};
