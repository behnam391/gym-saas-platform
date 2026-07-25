'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Fingerprint,
  Link2,
  PlugZap,
  ScanFace,
  ShieldCheck,
  SmartphoneNfc,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

interface Device {
  id: string;
  name: string;
  type: string;
  vendor?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  apiKeyLast4: string;
  status: string;
  lastSeenAt?: string | null;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
}

interface Credential {
  id: string;
  type: string;
  identifierLast4?: string | null;
  label?: string | null;
  isActive: boolean;
  createdAt: string;
  user: Member;
}

const TYPES = [
  { value: 'CARD', label: 'کارت عضویت', short: 'کارت', icon: CreditCard, hint: 'UID یا شماره کارت' },
  { value: 'FINGERPRINT', label: 'اثر انگشت', short: 'اثر انگشت', icon: Fingerprint, hint: 'شناسه کاربر در دستگاه' },
  { value: 'FACE_RECOGNITION', label: 'تشخیص چهره', short: 'چهره', icon: ScanFace, hint: 'شناسه چهره در دستگاه' },
  { value: 'NFC_PHONE', label: 'NFC گوشی', short: 'NFC', icon: SmartphoneNfc, hint: 'شناسه امن NFC' },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'در انتظار اتصال',
  CONNECTED: 'متصل',
  OFFLINE: 'آفلاین',
  DISABLED: 'غیرفعال',
};

export function AttendanceDevicesManager({
  initial,
  initialCredentials,
  members,
}: {
  initial: Device[];
  initialCredentials: Credential[];
  members: Member[];
}) {
  const [devices, setDevices] = useState(initial);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [secret, setSecret] = useState<{ key: string; endpoint: string } | null>(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', type: 'FINGERPRINT', vendor: '', model: '', serialNumber: '' });
  const [credentialForm, setCredentialForm] = useState({ userId: members[0]?.id ?? '', type: 'FINGERPRINT', identifier: '', label: '' });
  const [error, setError] = useState<string | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createDevice(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null); setSecret(null);
    try {
      const created = await api.post<Device & { apiKey: string; eventEndpoint: string }>('/attendance-devices', deviceForm);
      setDevices((current) => [created, ...current]);
      setSecret({ key: created.apiKey, endpoint: created.eventEndpoint });
      setDeviceForm((current) => ({ ...current, name: '', vendor: '', model: '', serialNumber: '' }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت دستگاه انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function changeDeviceStatus(device: Device) {
    setBusyId(device.id); setError(null);
    try {
      const changed = await api.patch<Device>(`/attendance-devices/${device.id}/status`, {
        status: device.status === 'DISABLED' ? 'PENDING' : 'DISABLED',
      });
      setDevices((items) => items.map((item) => item.id === device.id ? changed : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت دستگاه انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  async function linkCredential(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setCredentialError(null);
    try {
      const created = await api.post<Credential>('/attendance-devices/credentials', credentialForm);
      setCredentials((items) => [created, ...items.filter((item) => item.id !== created.id)]);
      setCredentialForm((current) => ({ ...current, identifier: '', label: '' }));
    } catch (cause) {
      setCredentialError(cause instanceof ApiError ? cause.message : 'اتصال شناسه عضو انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleCredential(credential: Credential) {
    setBusyId(credential.id); setCredentialError(null);
    try {
      const changed = await api.patch<Credential>(`/attendance-devices/credentials/${credential.id}/status`, {
        isActive: !credential.isActive,
      });
      setCredentials((items) => items.map((item) => item.id === credential.id ? changed : item));
    } catch (cause) {
      setCredentialError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت شناسه انجام نشد.');
    } finally {
      setBusyId(null);
    }
  }

  const selectedType = TYPES.find((item) => item.value === credentialForm.type) ?? TYPES[0];

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TYPES.map(({ value, label, icon: Icon }) => {
          const count = devices.filter((device) => device.type === value).length;
          return <MembershipCard key={value} className="relative overflow-hidden"><Icon className="mb-3 size-6 text-accent-soft" /><p className="font-bold">{label}</p><p className="mt-1 text-xs text-muted">{count.toLocaleString('fa-IR')} دستگاه ثبت‌شده</p></MembershipCard>;
        })}
      </div>

      <MembershipCard className="border-accent/20 bg-accent/5">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['۱', 'معرفی دستگاه', 'نوع، سازنده و سریال'],
            ['۲', 'دریافت کلید اتصال', 'کلید فقط یک‌بار نمایش داده می‌شود'],
            ['۳', 'اتصال شناسه عضو', 'شناسه دستگاه به حساب عضو وصل می‌شود'],
            ['۴', 'ثبت خودکار تردد', 'ورود و خروج از وب‌سرویس امن'],
          ].map(([step, title, description]) => <div key={step} className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-base">{step}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div></div>)}
        </div>
      </MembershipCard>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.4fr]">
        <MembershipCard>
          <h2 className="text-lg font-extrabold">افزودن دستگاه جدید</h2>
          <p className="mb-5 mt-1 text-sm leading-6 text-muted">برای هر گیت یا دستگاه یک اتصال مستقل بسازید.</p>
          <form onSubmit={createDevice} className="flex flex-col gap-3">
            <Input label="نام دستگاه" placeholder="مثلاً گیت ورودی بانوان" value={deviceForm.name} onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })} required />
            <label className="flex flex-col gap-1.5 text-sm text-muted">نوع دستگاه<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={deviceForm.type} onChange={(event) => setDeviceForm({ ...deviceForm, type: event.target.value })}>{TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
            <Input label="سازنده" placeholder="مثلاً ZKTeco" value={deviceForm.vendor} onChange={(event) => setDeviceForm({ ...deviceForm, vendor: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2"><Input label="مدل" value={deviceForm.model} onChange={(event) => setDeviceForm({ ...deviceForm, model: event.target.value })} /><Input label="شماره سریال" value={deviceForm.serialNumber} onChange={(event) => setDeviceForm({ ...deviceForm, serialNumber: event.target.value })} /></div>
            {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading}><PlugZap className="size-4" />{loading ? 'در حال ثبت…' : 'ساخت اتصال دستگاه'}</Button>
          </form>
          {secret && <div className="mt-5 rounded-xl border border-warning/20 bg-warning/10 p-4"><p className="text-sm font-extrabold text-warning">کلید اتصال را همین حالا ذخیره کنید</p><p className="mt-1 text-xs leading-5 text-muted">بعداً فقط چهار رقم آخر قابل مشاهده است.</p><code dir="ltr" className="mt-3 block break-all rounded-lg bg-base/60 p-3 text-left text-xs text-ink">{secret.key}</code><p dir="ltr" className="mt-2 text-left text-xs text-muted">POST {secret.endpoint}</p></div>}
        </MembershipCard>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">دستگاه‌های باشگاه</h2><p className="text-sm text-muted">سلامت اتصال و آخرین ارتباط</p></div><Badge tone="accent">{devices.length.toLocaleString('fa-IR')} دستگاه</Badge></div>
          {devices.map((device) => {
            const type = TYPES.find((item) => item.value === device.type);
            const Icon = type?.icon ?? PlugZap;
            return <MembershipCard key={device.id}><div className="flex flex-wrap items-start gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-surface-raised text-accent-soft"><Icon className="size-5" /></span><div className="min-w-48 flex-1"><p className="font-bold">{device.name}</p><p className="mt-1 text-sm text-muted">{type?.label}{device.vendor ? ` · ${device.vendor}` : ''}{device.model ? ` ${device.model}` : ''}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted"><span>کلید: ••••{device.apiKeyLast4}</span>{device.serialNumber && <span>سریال: {device.serialNumber}</span>}<span>{device.lastSeenAt ? `آخرین اتصال: ${new Date(device.lastSeenAt).toLocaleString('fa-IR')}` : 'هنوز رویدادی دریافت نشده'}</span></div></div><div className="flex items-center gap-2"><Badge tone={device.status === 'CONNECTED' ? 'success' : device.status === 'DISABLED' ? 'danger' : 'warning'}>{STATUS_LABEL[device.status] ?? device.status}</Badge><Button size="sm" variant="ghost" disabled={busyId === device.id} onClick={() => changeDeviceStatus(device)}>{device.status === 'DISABLED' ? 'فعال‌سازی' : 'غیرفعال‌سازی'}</Button></div></div></MembershipCard>;
          })}
          {!devices.length && <MembershipCard className="py-10 text-center text-sm text-muted">هنوز دستگاهی ثبت نشده است.</MembershipCard>}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[.9fr_1.4fr]">
        <MembershipCard>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-success/10 text-success"><Link2 className="size-5" /></span><div><h2 className="font-extrabold">اتصال شناسه تردد به عضو</h2><p className="text-xs text-muted">مرحله لازم برای ثبت مکانیزه</p></div></div>
          <form onSubmit={linkCredential} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm text-muted">عضو باشگاه<select required className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={credentialForm.userId} onChange={(event) => setCredentialForm({ ...credentialForm, userId: event.target.value })}><option value="">انتخاب عضو</option>{members.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName} · {member.mobile}</option>)}</select></label>
            <label className="flex flex-col gap-1.5 text-sm text-muted">روش شناسایی<select className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink" value={credentialForm.type} onChange={(event) => setCredentialForm({ ...credentialForm, type: event.target.value })}>{TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
            <Input label={selectedType.hint} placeholder="شناسه‌ای که دستگاه برای این عضو ارسال می‌کند" value={credentialForm.identifier} onChange={(event) => setCredentialForm({ ...credentialForm, identifier: event.target.value })} required />
            <Input label="عنوان اختیاری" placeholder="مثلاً کارت اصلی یا چهره ورودی ۱" value={credentialForm.label} onChange={(event) => setCredentialForm({ ...credentialForm, label: event.target.value })} />
            {credentialError && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{credentialError}</p>}
            <Button type="submit" disabled={loading || !members.length}><CheckCircle2 className="size-4" />ثبت اتصال عضو</Button>
          </form>
        </MembershipCard>

        <div className="flex flex-col gap-3">
          <div><h2 className="text-lg font-extrabold">شناسه‌های متصل‌شده</h2><p className="text-sm text-muted">مدیریت کارت، چهره، اثر انگشت و NFC اعضا</p></div>
          {credentials.map((credential) => {
            const type = TYPES.find((item) => item.value === credential.type);
            const Icon = type?.icon ?? ShieldCheck;
            return <MembershipCard key={credential.id} className="flex flex-wrap items-center gap-4"><span className="grid size-10 place-items-center rounded-2xl bg-surface-raised text-accent-soft"><Icon className="size-5" /></span><div className="min-w-48 flex-1"><p className="font-bold">{credential.user.firstName} {credential.user.lastName}</p><p className="mt-1 text-xs text-muted">{type?.label} · پایان شناسه {credential.identifierLast4 ? `••••${credential.identifierLast4}` : 'ثبت‌شده'}{credential.label ? ` · ${credential.label}` : ''}</p></div><Badge tone={credential.isActive ? 'success' : 'danger'}>{credential.isActive ? 'فعال' : 'غیرفعال'}</Badge><Button size="sm" variant="ghost" disabled={busyId === credential.id} onClick={() => toggleCredential(credential)}>{credential.isActive ? 'تعلیق شناسه' : 'فعال‌سازی'}</Button></MembershipCard>;
          })}
          {!credentials.length && <MembershipCard className="py-10 text-center text-sm text-muted">هنوز شناسه‌ای به اعضا متصل نشده است.</MembershipCard>}
          <MembershipCard className="border-success/20 bg-success/5 text-sm leading-6"><p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" /><span><strong>حریم خصوصی داده‌های زیستی:</strong> تصویر چهره و الگوی اثر انگشت در باشگاه‌یار ذخیره نمی‌شود. دستگاه فقط شناسه داخلی خود را می‌فرستد و سامانه نسخه هش‌شده آن را نگهداری می‌کند.</span></p></MembershipCard>
        </div>
      </section>
    </div>
  );
}
