'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Search,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { AttendanceRecord } from './attendance-manager';
import { Badge } from './badge';
import { Button } from './button';
import { MembershipCard } from './membership-card';

interface AttendanceReportResponse {
  records: AttendanceRecord[];
  summary: {
    totalVisits: number;
    uniqueMembers: number;
    openVisits: number;
    completedVisits: number;
    totalMinutes: number;
    averageMinutes: number;
  };
  truncated: boolean;
  range: { from: string; to: string };
}

interface ReportFilters {
  from: string;
  to: string;
  search: string;
  method: string;
  status: string;
}

const METHOD_LABELS: Record<string, string> = {
  QR_CODE: 'گُردیار Pass',
  MEMBERSHIP_CARD: 'کارت عضویت',
  FINGERPRINT: 'اثر انگشت',
  FACE_RECOGNITION: 'تشخیص چهره',
  NFC_PHONE: 'NFC موبایل',
  MANUAL: 'ثبت دستی',
};

function inputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultFilters(): ReportFilters {
  const today = new Date();
  return {
    from: inputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: inputDate(today),
    search: '',
    method: '',
    status: '',
  };
}

function rangeToIso(filters: ReportFilters) {
  const from = new Date(`${filters.from}T00:00:00`);
  const to = new Date(`${filters.to}T00:00:00`);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function durationMinutes(record: AttendanceRecord) {
  if (!record.checkOutAt) return null;
  return Math.max(
    0,
    Math.round(
      (new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime()) /
        60_000,
    ),
  );
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return 'در حال حضور';
  if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? `${hours.toLocaleString('fa-IR')} ساعت و ${rest.toLocaleString('fa-IR')} دقیقه`
    : `${hours.toLocaleString('fa-IR')} ساعت`;
}

function csvCell(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

export function AttendanceReport() {
  const initial = useMemo(() => defaultFilters(), []);
  const [draft, setDraft] = useState<ReportFilters>(initial);
  const [applied, setApplied] = useState<ReportFilters>(initial);
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const range = rangeToIso(applied);
        const params = new URLSearchParams(range);
        if (applied.search.trim()) params.set('search', applied.search.trim());
        if (applied.method) params.set('method', applied.method);
        if (applied.status) params.set('status', applied.status);
        const result = await api.get<AttendanceReportResponse>(
          `/attendance/report?${params.toString()}`,
        );
        if (active) setReport(result);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof ApiError
              ? cause.message
              : 'دریافت گزارش حضور و غیاب انجام نشد.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [applied]);

  function applyPreset(type: 'today' | 'week' | 'month') {
    const today = new Date();
    let from = new Date(today);
    if (type === 'week') {
      const daysFromSaturday = (today.getDay() + 1) % 7;
      from.setDate(today.getDate() - daysFromSaturday);
    }
    if (type === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    const next = { ...draft, from: inputDate(from), to: inputDate(today) };
    setDraft(next);
    setApplied(next);
  }

  function downloadExcelCsv() {
    if (!report?.records.length) return;
    const header = [
      'نام عضو',
      'شماره موبایل',
      'پلن',
      'تاریخ و ساعت ورود',
      'تاریخ و ساعت خروج',
      'مدت حضور (دقیقه)',
      'روش ثبت',
      'وضعیت',
    ];
    const rows = report.records.map((record) => {
      const duration = durationMinutes(record);
      return [
        `${record.user.firstName} ${record.user.lastName}`,
        record.user.mobile,
        record.membership?.plan.title ?? '',
        formatDateTime(record.checkInAt),
        record.checkOutAt ? formatDateTime(record.checkOutAt) : '',
        duration ?? '',
        METHOD_LABELS[record.method] ?? record.method,
        record.checkOutAt ? 'تکمیل‌شده' : 'در حال حضور',
      ];
    });
    const content = `\uFEFF${[header, ...rows]
      .map((row) => row.map((cell) => csvCell(cell)).join(','))
      .join('\r\n')}`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gordyar-attendance-${applied.from}-${applied.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const summary = report?.summary;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">گزارش حضور اعضا</h2>
          <p className="mt-1 text-sm text-muted">
            تحلیل روزانه و ماهانه، جست‌وجوی اعضا و دریافت فایل مناسب Excel
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={downloadExcelCsv}
          disabled={loading || !report?.records.length}
        >
          <FileSpreadsheet className="size-4 text-success" />
          دانلود برای Excel
        </Button>
      </div>

      <MembershipCard>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => applyPreset('today')}>
            امروز
          </Button>
          <Button size="sm" variant="secondary" onClick={() => applyPreset('week')}>
            این هفته
          </Button>
          <Button size="sm" variant="secondary" onClick={() => applyPreset('month')}>
            این ماه
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">از تاریخ</span>
            <input
              type="date"
              value={draft.from}
              max={draft.to}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base/40 px-3"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">تا تاریخ</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              max={inputDate(new Date())}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base/40 px-3"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">عضو یا موبایل</span>
            <span className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="نام یا شماره موبایل"
                className="h-11 w-full rounded-xl border border-white/10 bg-base/40 pr-9 pl-3 outline-none focus:border-accent/60"
              />
            </span>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">روش ثبت</span>
            <select
              value={draft.method}
              onChange={(event) => setDraft({ ...draft, method: event.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base/40 px-3"
            >
              <option value="">همه روش‌ها</option>
              {Object.entries(METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted">وضعیت</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base/40 px-3"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="OPEN">در حال حضور</option>
              <option value="COMPLETED">تکمیل‌شده</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-danger">{error}</p> : <span />}
          <Button
            onClick={() => setApplied({ ...draft })}
            disabled={loading || !draft.from || !draft.to}
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Filter className="size-4" />}
            اعمال فیلتر
          </Button>
        </div>
      </MembershipCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MembershipCard className="flex items-center justify-between p-5">
          <div><p className="text-sm text-muted">تعداد مراجعه</p><p className="mt-2 text-3xl font-extrabold">{(summary?.totalVisits ?? 0).toLocaleString('fa-IR')}</p></div>
          <CalendarDays className="size-9 text-accent-soft" />
        </MembershipCard>
        <MembershipCard className="flex items-center justify-between p-5">
          <div><p className="text-sm text-muted">اعضای یکتا</p><p className="mt-2 text-3xl font-extrabold">{(summary?.uniqueMembers ?? 0).toLocaleString('fa-IR')}</p></div>
          <Users className="size-9 text-accent-soft" />
        </MembershipCard>
        <MembershipCard className="flex items-center justify-between p-5">
          <div><p className="text-sm text-muted">میانگین حضور</p><p className="mt-2 text-lg font-extrabold">{formatDuration(summary?.averageMinutes ?? 0)}</p></div>
          <Clock3 className="size-9 text-accent-soft" />
        </MembershipCard>
        <MembershipCard className="flex items-center justify-between p-5">
          <div><p className="text-sm text-muted">حضور باز</p><p className="mt-2 text-3xl font-extrabold">{(summary?.openVisits ?? 0).toLocaleString('fa-IR')}</p></div>
          <UserRoundCheck className="size-9 text-success" />
        </MembershipCard>
      </div>

      <MembershipCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <h3 className="font-bold">جزئیات تردد</h3>
          {report?.truncated && <Badge tone="warning">نمایش ۵۰۰۰ رکورد اول</Badge>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-surface-raised text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">عضو</th>
                <th className="px-5 py-3 font-medium">پلن</th>
                <th className="px-5 py-3 font-medium">ورود</th>
                <th className="px-5 py-3 font-medium">خروج</th>
                <th className="px-5 py-3 font-medium">مدت حضور</th>
                <th className="px-5 py-3 font-medium">روش</th>
                <th className="px-5 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-muted"><LoaderCircle className="mx-auto mb-2 size-6 animate-spin" />در حال دریافت گزارش…</td></tr>
              )}
              {!loading && report?.records.map((record) => (
                <tr key={record.id} className="border-t border-white/10">
                  <td className="px-5 py-4"><p className="font-bold">{record.user.firstName} {record.user.lastName}</p><p className="text-xs text-muted">{record.user.mobile}</p></td>
                  <td className="px-5 py-4 text-muted">{record.membership?.plan.title ?? '—'}</td>
                  <td className="px-5 py-4">{formatDateTime(record.checkInAt)}</td>
                  <td className="px-5 py-4 text-muted">{record.checkOutAt ? formatDateTime(record.checkOutAt) : '—'}</td>
                  <td className="px-5 py-4">{formatDuration(durationMinutes(record))}</td>
                  <td className="px-5 py-4 text-muted">{METHOD_LABELS[record.method] ?? record.method}</td>
                  <td className="px-5 py-4"><Badge tone={record.checkOutAt ? 'muted' : 'success'}>{record.checkOutAt ? 'تکمیل‌شده' : 'در حال حضور'}</Badge></td>
                </tr>
              ))}
              {!loading && report?.records.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-muted">در این بازه رکوردی پیدا نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </MembershipCard>
    </section>
  );
}
