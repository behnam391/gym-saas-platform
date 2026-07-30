'use client';

import { useState } from 'react';
import { Check, CreditCard, Eye, ShieldCheck, X } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { api, ApiError } from '../../lib/api';

export interface ManagedMember {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  isMinor: boolean;
  isRestricted: boolean;
  insuranceDocs: Array<{ id: string; status: string; provider?: string | null; validUntil?: string | null; rejectionReason?: string | null }>;
  parentalConsent?: {
    status: string;
    guardianName: string;
    guardianNationalId: string;
    guardianMobile: string;
    documentUrl: string;
    rejectionReason?: string | null;
  } | null;
  memberships: Array<{ id: string; status: string; plan: { title: string; price: number | string } }>;
}

const MEMBERSHIP_LABEL: Record<string, string> = { ACTIVE: 'فعال', PENDING_INSURANCE: 'منتظر بیمه', PENDING_PAYMENT: 'منتظر پرداخت', EXPIRED: 'منقضی', SUSPENDED: 'تعلیق', CANCELLED: 'لغوشده' };
const INSURANCE_LABEL: Record<string, string> = { PENDING: 'در انتظار بررسی', APPROVED: 'تاییدشده', REJECTED: 'ردشده' };

export function MembersTable({ initialMembers }: { initialMembers: ManagedMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS'>('POS');
  const [error, setError] = useState<string | null>(null);

  async function reviewConsent(userId: string, status: 'APPROVED' | 'REJECTED') {
    setBusyId(userId); setError(null);
    try {
      const rejectionReason = status === 'REJECTED'
        ? 'اطلاعات ولی یا فایل رضایت‌نامه نیاز به اصلاح دارد.'
        : undefined;
      await api.patch(`/tenants/me/parental-consent/${userId}`, { status, rejectionReason });
      setMembers((items) => items.map((item) => item.id === userId ? {
        ...item,
        isRestricted: status === 'APPROVED' ? false : item.isRestricted,
        parentalConsent: item.parentalConsent
          ? { ...item.parentalConsent, status, rejectionReason }
          : null,
      } : item));
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'ثبت تایید رضایت‌نامه انجام نشد.'); }
    finally { setBusyId(null); }
  }

  async function reviewInsurance(memberId: string, documentId: string, status: 'APPROVED' | 'REJECTED') {
    setBusyId(documentId); setError(null);
    try {
      await api.patch(`/tenants/me/insurance/${documentId}`, { status, rejectionReason: status === 'REJECTED' ? 'مدرک بارگذاری‌شده نیاز به اصلاح دارد.' : undefined });
      setMembers((items) => items.map((item) => item.id === memberId ? {
        ...item,
        insuranceDocs: item.insuranceDocs.map((doc) => doc.id === documentId ? { ...doc, status } : doc),
        memberships: status === 'APPROVED' ? item.memberships.map((membership) => membership.status === 'PENDING_INSURANCE' ? { ...membership, status: 'PENDING_PAYMENT' } : membership) : item.memberships,
      } : item));
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'بررسی بیمه انجام نشد.'); }
    finally { setBusyId(null); }
  }

  async function recordPayment(member: ManagedMember) {
    const membership = member.memberships[0];
    if (!membership) return;
    setBusyId(membership.id); setError(null);
    try {
      await api.post(`/payments/memberships/${membership.id}/manual`, { amount: Number(membership.plan.price), method: paymentMethod, gatewayRef: `LOCAL-${Date.now()}` });
      setMembers((items) => items.map((item) => item.id === member.id ? { ...item, memberships: item.memberships.map((value) => value.id === membership.id ? { ...value, status: 'ACTIVE' } : value) } : item));
      setPaymentId(null);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'ثبت پرداخت انجام نشد.'); }
    finally { setBusyId(null); }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border/10">
      {error && <p className="bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-right text-sm">
          <thead className="bg-surface-raised text-muted"><tr><th className="px-4 py-3 font-medium">عضو</th><th className="px-4 py-3 font-medium">پلن</th><th className="px-4 py-3 font-medium">بیمه ورزشی</th><th className="px-4 py-3 font-medium">دسترسی</th><th className="px-4 py-3 font-medium">عملیات</th></tr></thead>
          <tbody>{members.map((member) => {
            const insurance = member.insuranceDocs[0];
            const membership = member.memberships[0];
            return <tr key={member.id} className="border-t border-border/10 align-top"><td className="px-4 py-4"><p className="font-bold">{member.firstName} {member.lastName}</p><p className="text-xs text-muted">{member.mobile}</p></td><td className="px-4 py-4"><p>{membership?.plan.title ?? 'بدون پلن'}</p>{membership && <Badge tone={membership.status === 'ACTIVE' ? 'success' : 'warning'}>{MEMBERSHIP_LABEL[membership.status] ?? membership.status}</Badge>}</td><td className="px-4 py-4">{insurance ? <div><Badge tone={insurance.status === 'APPROVED' ? 'success' : insurance.status === 'REJECTED' ? 'danger' : 'warning'}>{INSURANCE_LABEL[insurance.status] ?? insurance.status}</Badge>{insurance.provider && <p className="mt-1 text-xs text-muted">{insurance.provider}</p>}</div> : <Badge tone="danger">ثبت نشده</Badge>}</td><td className="px-4 py-4">{member.isRestricted ? <Badge tone="warning">محدود</Badge> : <Badge tone="success">کامل</Badge>}{member.parentalConsent && <div className="mt-2 space-y-1 text-xs text-muted"><p>ولی: {member.parentalConsent.guardianName}</p><p>{member.parentalConsent.guardianMobile} · {member.parentalConsent.guardianNationalId}</p><a href={member.parentalConsent.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-soft"><Eye className="size-3.5" />مشاهده رضایت‌نامه</a></div>}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2">{insurance?.status === 'PENDING' && <><Button size="sm" disabled={busyId === insurance.id} onClick={() => reviewInsurance(member.id, insurance.id, 'APPROVED')}><Check className="size-3.5" />تایید بیمه</Button><Button size="sm" variant="danger" disabled={busyId === insurance.id} onClick={() => reviewInsurance(member.id, insurance.id, 'REJECTED')}><X className="size-3.5" />رد</Button></>}{member.isRestricted && member.parentalConsent?.status === 'PENDING' && <><Button size="sm" disabled={busyId === member.id} onClick={() => reviewConsent(member.id, 'APPROVED')}><ShieldCheck className="size-3.5" />تایید رضایت‌نامه</Button><Button size="sm" variant="danger" disabled={busyId === member.id} onClick={() => reviewConsent(member.id, 'REJECTED')}><X className="size-3.5" />رد رضایت‌نامه</Button></>}{membership?.status === 'PENDING_PAYMENT' && <Button size="sm" onClick={() => setPaymentId(paymentId === membership.id ? null : membership.id)}><CreditCard className="size-3.5" />ثبت پرداخت</Button>}</div>{paymentId === membership?.id && <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-raised p-3"><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'CASH' | 'POS')} className="h-9 rounded-lg border border-white/10 bg-surface px-2"><option value="POS">کارت‌خوان</option><option value="CASH">نقدی</option></select><span className="text-xs text-muted">{Number(membership.plan.price).toLocaleString('fa-IR')} تومان</span><Button size="sm" disabled={busyId === membership.id} onClick={() => recordPayment(member)}>تایید پرداخت</Button></div>}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
