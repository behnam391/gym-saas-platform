import { LucideIcon } from 'lucide-react';
import { MembershipCard } from './membership-card';

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <MembershipCard className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-2xl font-extrabold">{value}</p>
      </div>
      <Icon className="size-7 text-accent-soft" />
    </MembershipCard>
  );
}
