export type SubscriptionFeature =
  | 'ADVERTISEMENTS'
  | 'DEVICE_INTEGRATION'
  | 'FINANCE_REPORTS'
  | 'PROFESSIONAL_FINANCE'
  | 'CUSTOM_INTEGRATIONS';

export type SubscriptionLimit = 'staff' | 'members' | 'devices';

export interface PlanEntitlements {
  features: SubscriptionFeature[];
  limits: Record<SubscriptionLimit, number>;
}

const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  STARTER: {
    features: [],
    limits: { staff: 3, members: 150, devices: 0 },
  },
  GROWTH: {
    features: [
      'ADVERTISEMENTS',
      'DEVICE_INTEGRATION',
      'FINANCE_REPORTS',
      'PROFESSIONAL_FINANCE',
    ],
    limits: { staff: 15, members: 2000, devices: 5 },
  },
  ENTERPRISE: {
    features: [
      'ADVERTISEMENTS',
      'DEVICE_INTEGRATION',
      'FINANCE_REPORTS',
      'PROFESSIONAL_FINANCE',
      'CUSTOM_INTEGRATIONS',
    ],
    limits: { staff: 100, members: 100000, devices: 50 },
  },
};

const FALLBACK_ENTITLEMENTS: PlanEntitlements = {
  features: [],
  limits: { staff: 1, members: 50, devices: 0 },
};

export function entitlementsForPlan(code: string): PlanEntitlements {
  return PLAN_ENTITLEMENTS[code] ?? FALLBACK_ENTITLEMENTS;
}
