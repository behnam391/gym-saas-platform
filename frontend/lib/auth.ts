export const ROLE_DASHBOARDS: Record<string, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  GYM_OWNER: '/dashboard/gym-owner',
  TRAINER: '/dashboard/trainer',
  NUTRITIONIST: '/dashboard/nutritionist',
  RECEPTION: '/dashboard/reception',
  BUFFET_STAFF: '/dashboard/buffet',
  ATHLETE: '/dashboard/athlete',
};

export function dashboardForRole(role: string): string {
  return ROLE_DASHBOARDS[role] ?? '/dashboard/athlete';
}
