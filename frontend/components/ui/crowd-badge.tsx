import { Badge } from './badge';

const LEVEL_MAP: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  GREEN: { label: 'شلوغی کم', tone: 'success' },
  YELLOW: { label: 'شلوغی متوسط', tone: 'warning' },
  RED: { label: 'شلوغی زیاد', tone: 'danger' },
};

export function CrowdBadge({ level }: { level: string }) {
  const info = LEVEL_MAP[level] ?? LEVEL_MAP.GREEN;
  return (
    <Badge tone={info.tone} className="crowd-pulse">
      <span className="size-1.5 rounded-full bg-current" />
      {info.label}
    </Badge>
  );
}
