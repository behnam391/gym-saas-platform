export function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fa-IR')} تومان`;
}

export function dateTime(value: string) {
  return new Date(value).toLocaleString('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function apiMessage(reason: unknown, fallback = 'ارتباط با سرور انجام نشد.') {
  if (reason instanceof Error && reason.message) return reason.message;
  return fallback;
}
