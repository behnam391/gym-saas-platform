import { BRAND } from '../../lib/brand';
import { cn } from '../../lib/cn';

type BrandLogoSize = 'sm' | 'md' | 'lg';

const SIZE_STYLES: Record<
  BrandLogoSize,
  { mark: string; name: string; meta: string; gap: string }
> = {
  sm: {
    mark: 'size-9 rounded-xl',
    name: 'text-[1.05rem]',
    meta: 'text-[0.55rem]',
    gap: 'gap-2.5',
  },
  md: {
    mark: 'size-11 rounded-[0.95rem]',
    name: 'text-[1.35rem]',
    meta: 'text-[0.62rem]',
    gap: 'gap-3',
  },
  lg: {
    mark: 'size-14 rounded-[1.15rem]',
    name: 'text-[1.75rem]',
    meta: 'text-[0.7rem]',
    gap: 'gap-3.5',
  },
};

export function BrandMark({
  size = 'md',
  className,
}: {
  size?: BrandLogoSize;
  className?: string;
}) {
  const styles = SIZE_STYLES[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden border border-accent/35',
        'bg-[linear-gradient(145deg,rgba(228,199,102,.2),rgba(201,162,39,.04)_48%,rgba(76,175,109,.12))]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_10px_24px_-12px_rgba(201,162,39,.85)]',
        styles.mark,
        className,
      )}
    >
      <span className="absolute inset-x-[18%] top-[15%] h-px bg-gradient-to-r from-transparent via-accent-soft/80 to-transparent" />
      <svg
        viewBox="0 0 152 152"
        className="relative size-[78%]"
        focusable="false"
      >
        <path
          d="M31 46h91v20H64c-13 0-21 7-21 18 0 12 8 19 21 19h34V88h24v35H64c-28 0-46-15-46-39s18-38 46-38Z"
          fill="currentColor"
          className="text-accent-soft"
        />
        <path d="M87 21h14v17H87zm23 5h14v14h-14z" fill="currentColor" className="text-accent-soft" />
        <path d="M50 135h52" stroke="currentColor" strokeWidth="7" strokeLinecap="round" className="text-success" />
      </svg>
    </span>
  );
}

export function BrandLogo({
  size = 'md',
  subtitle = BRAND.slogan,
  showSubtitle = true,
  className,
}: {
  size?: BrandLogoSize;
  subtitle?: string;
  showSubtitle?: boolean;
  className?: string;
}) {
  const styles = SIZE_STYLES[size];

  return (
    <span
      role="img"
      aria-label={`${BRAND.name}، ${BRAND.slogan}`}
      className={cn('inline-flex select-none items-center', styles.gap, className)}
    >
      <BrandMark size={size} />
      <span className="min-w-0">
        <span
          className={cn(
            'block whitespace-nowrap font-black leading-none',
            styles.name,
          )}
        >
          <span className="text-accent-soft">گُرد</span>
          <span className="text-ink">یار</span>
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'mt-1 block whitespace-nowrap font-semibold leading-none text-muted',
              styles.meta,
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
