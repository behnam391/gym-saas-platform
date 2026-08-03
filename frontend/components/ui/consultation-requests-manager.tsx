'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import type { PlatformProfessional } from './platform-professionals-manager';

export type ConsultationStatus =
  | 'REQUESTED'
  | 'CONTACTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AdminConsultationRequest {
  id: string;
  status: ConsultationStatus;
  preferredAt?: string | null;
  message?: string | null;
  createdAt: string;
  professional: PlatformProfessional;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string | null;
  };
}

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  REQUESTED: 'در انتظار بررسی',
  CONTACTED: 'تماس گرفته شد',
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
};

const STATUS_STYLE: Record<ConsultationStatus, string> = {
  REQUESTED: 'bg-warning/10 text-warning',
  CONTACTED: 'bg-surface-raised text-muted',
  CONFIRMED: 'bg-accent/10 text-accent-soft',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
};

export function ConsultationRequestsManager({
  initial,
}: {
  initial: AdminConsultationRequest[];
}) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'ALL' | ConsultationStatus>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'ALL' ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );

  async function updateStatus(item: AdminConsultationRequest, status: ConsultationStatus) {
    setUpdatingId(item.id);
    setError(null);
    try {
      const updated = await api.patch<AdminConsultationRequest>(
        `/platform-professionals/admin/consultations/${item.id}/status`,
        { status },
      );
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? updated : entry)),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'تغییر وضعیت درخواست انجام نشد.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">درخواست‌های مشاوره</h2>
          <p className="mt-1 text-sm text-muted">
            پیگیری درخواست ورزشکار و ثبت نتیجه تماس
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          وضعیت
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as 'ALL' | ConsultationStatus)
            }
            className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink">
            <option value="ALL">همه درخواست‌ها</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((item) => (
          <MembershipCard key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <h3 className="font-extrabold">
                    {item.athlete.firstName} {item.athlete.lastName}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    مشاوره با {item.professional.fullName}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl bg-surface-raised p-4 text-sm">
              <a href={`tel:${item.athlete.mobile}`} className="flex items-center gap-2">
                <Phone className="size-4 text-accent-soft" />
                <span dir="ltr">{item.athlete.mobile}</span>
              </a>
              {item.athlete.email ? (
                <a href={`mailto:${item.athlete.email}`} className="flex items-center gap-2">
                  <Mail className="size-4 text-accent-soft" />
                  <span>{item.athlete.email}</span>
                </a>
              ) : null}
              <p className="flex items-center gap-2 text-muted">
                <Clock3 className="size-4" />
                ثبت در {new Intl.DateTimeFormat('fa-IR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(item.createdAt))}
              </p>
              {item.preferredAt ? (
                <p className="flex items-center gap-2 text-muted">
                  <CalendarDays className="size-4" />
                  زمان ترجیحی {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(item.preferredAt))}
                </p>
              ) : null}
              {item.message ? (
                <p className="flex items-start gap-2 border-t border-border/10 pt-2 leading-6 text-muted">
                  <MessageSquareText className="mt-1 size-4 shrink-0" />
                  {item.message}
                </p>
              ) : null}
            </div>

            <label className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
              نتیجه پیگیری
              <select
                value={item.status}
                disabled={updatingId === item.id}
                onChange={(event) =>
                  updateStatus(item, event.target.value as ConsultationStatus)
                }
                className="h-11 min-w-44 rounded-xl border border-border/10 bg-surface px-3 text-ink disabled:opacity-60">
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </MembershipCard>
        ))}
      </div>

      {!visible.length ? (
        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-border/20 text-center text-muted">
          <div>
            <CheckCircle2 className="mx-auto mb-2 size-7" />
            <p>درخواستی با این وضعیت وجود ندارد.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
