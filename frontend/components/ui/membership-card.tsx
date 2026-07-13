import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * The signature element of this design system: a callback to the physical
 * laminated gym membership card, rendered with a thin brass edge-light and
 * soft inner shadow. Reused for marketplace gym cards, membership plan
 * cards, and the athlete's own digital membership card — never as a generic
 * flat panel.
 */
export function MembershipCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('membership-card p-6', className)} {...props} />;
}
