'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  EyeOff,
  LoaderCircle,
  PlugZap,
  TestTube2,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';

interface IntegrationSettings {
  merchantIdHint?: string;
  apiKeyHint?: string;
  sandbox?: boolean;
  callbackUrl?: string;
  sender?: string;
  otpTemplate?: string;
  allowedRecipients?: string;
  dryRun?: boolean;
}

interface Integration {
  id: string;
  key: string;
  label: string;
  category: string;
  provider?: string | null;
  status: string;
  configuredFields: string[];
  settings?: IntegrationSettings | null;
  lastCheckedAt?: string | null;
}

const STATUS: Record<
  string,
  { label: string; tone: 'muted' | 'warning' | 'success' | 'danger' }
> = {
  NOT_CONFIGURED: { label: 'نیازمند تنظیم', tone: 'muted' },
  CONFIGURED: { label: 'ثبت‌شده؛ نیازمند تست', tone: 'warning' },
  HEALTHY: { label: 'اتصال سالم', tone: 'success' },
  DEGRADED: { label: 'خطا در اتصال', tone: 'danger' },
  DISABLED: { label: 'غیرفعال', tone: 'muted' },
};

export function PlatformIntegrationsPanel({ initial }: { initial: Integration[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const payment = items.find((item) => item.key === 'PAYMENT_GATEWAY');
  const sms = items.find((item) => item.key === 'SMS');
  const [paymentForm, setPaymentForm] = useState({
    merchantId: '',
    callbackUrl:
      payment?.settings?.callbackUrl ??
      'https://app-api.gordyar.ir/api/v1/payments/zarinpal/callback',
    sandbox: payment?.settings?.sandbox ?? false,
  });
  const [smsForm, setSmsForm] = useState({
    apiKey: '',
    sender: sms?.settings?.sender ?? '',
    otpTemplate: sms?.settings?.otpTemplate ?? '',
    allowedRecipients: sms?.settings?.allowedRecipients ?? '',
    dryRun: sms?.settings?.dryRun ?? true,
  });

  async function save(key: 'PAYMENT_GATEWAY' | 'SMS') {
    setBusy(`${key}:save`);
    setErrors((current) => ({ ...current, [key]: '' }));
    setMessages((current) => ({ ...current, [key]: '' }));
    try {
      const payload =
        key === 'PAYMENT_GATEWAY'
          ? {
              ...(paymentForm.merchantId ? { merchantId: paymentForm.merchantId } : {}),
              callbackUrl: paymentForm.callbackUrl,
              sandbox: paymentForm.sandbox,
            }
          : {
              ...(smsForm.apiKey ? { apiKey: smsForm.apiKey } : {}),
              sender: smsForm.sender,
              otpTemplate: smsForm.otpTemplate,
              allowedRecipients: smsForm.allowedRecipients,
              dryRun: smsForm.dryRun,
            };
      const changed = await api.patch<Integration[]>(
        `/super-admin/integrations/${key}/credentials`,
        payload,
      );
      setItems(changed);
      if (key === 'PAYMENT_GATEWAY') {
        setPaymentForm((current) => ({ ...current, merchantId: '' }));
      } else {
        setSmsForm((current) => ({ ...current, apiKey: '' }));
      }
      setMessages((current) => ({
        ...current,
        [key]: 'اطلاعات با رمزگذاری امن ذخیره شد. اکنون تست اتصال را اجرا کنید.',
      }));
    } catch (caught) {
      setErrors((current) => ({
        ...current,
        [key]:
          caught instanceof ApiError ? caught.message : 'ذخیره تنظیمات انجام نشد.',
      }));
    } finally {
      setBusy(null);
    }
  }

  async function test(key: 'PAYMENT_GATEWAY' | 'SMS') {
    setBusy(`${key}:test`);
    setErrors((current) => ({ ...current, [key]: '' }));
    setMessages((current) => ({ ...current, [key]: '' }));
    try {
      await api.post(`/super-admin/integrations/${key}/test`);
      setItems((current) =>
        current.map((item) =>
          item.key === key
            ? { ...item, status: 'HEALTHY', lastCheckedAt: new Date().toISOString() }
            : item,
        ),
      );
      setMessages((current) => ({
        ...current,
        [key]: 'اتصال با موفقیت بررسی شد و سالم است.',
      }));
    } catch (caught) {
      setItems((current) =>
        current.map((item) =>
          item.key === key ? { ...item, status: 'DEGRADED' } : item,
        ),
      );
      setErrors((current) => ({
        ...current,
        [key]:
          caught instanceof ApiError ? caught.message : 'تست اتصال ناموفق بود.',
      }));
    } finally {
      setBusy(null);
    }
  }

  function header(item: Integration, provider: string) {
    const status = STATUS[item.status] ?? STATUS.NOT_CONFIGURED;
    return (
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft">
          <PlugZap className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold">{item.label}</p>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{provider}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {payment && (
        <MembershipCard>
          {header(payment, 'زرین‌پال · پرداخت آنلاین عضویت')}
          <div className="mt-5 grid gap-4">
            <Input
              label="شناسه درگاه زرین‌پال"
              type="password"
              dir="ltr"
              placeholder={
                payment.settings?.merchantIdHint
                  ? `ثبت شده: ${payment.settings.merchantIdHint}`
                  : 'Merchant ID'
              }
              value={paymentForm.merchantId}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, merchantId: event.target.value.trim() })
              }
            />
            <Input
              label="آدرس بازگشت پرداخت"
              type="url"
              dir="ltr"
              value={paymentForm.callbackUrl}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, callbackUrl: event.target.value })
              }
            />
            <label className="flex items-center justify-between rounded-xl border border-border/10 bg-surface-raised p-3 text-sm">
              <span>حالت آزمایشی زرین‌پال</span>
              <input
                type="checkbox"
                checked={paymentForm.sandbox}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, sandbox: event.target.checked })
                }
                className="size-4 accent-accent"
              />
            </label>
            <SecureHint />
            <Feedback message={messages.PAYMENT_GATEWAY} error={errors.PAYMENT_GATEWAY} />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => save('PAYMENT_GATEWAY')}
                disabled={busy !== null}
              >
                {busy === 'PAYMENT_GATEWAY:save' && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                ذخیره امن
              </Button>
              <Button
                variant="secondary"
                onClick={() => test('PAYMENT_GATEWAY')}
                disabled={busy !== null || payment.status === 'NOT_CONFIGURED'}
              >
                <TestTube2 className="size-4" />
                تست اتصال
              </Button>
            </div>
          </div>
        </MembershipCard>
      )}

      {sms && (
        <MembershipCard>
          {header(sms, 'کاوه‌نگار · پیامک تراکنشی')}
          <div className="mt-5 grid gap-4">
            <Input
              label="کلید API کاوه‌نگار"
              type="password"
              dir="ltr"
              placeholder={
                sms.settings?.apiKeyHint
                  ? `ثبت شده: ${sms.settings.apiKeyHint}`
                  : 'API Key'
              }
              value={smsForm.apiKey}
              onChange={(event) =>
                setSmsForm({ ...smsForm, apiKey: event.target.value.trim() })
              }
            />
            <Input
              label="شماره فرستنده (اختیاری)"
              dir="ltr"
              placeholder="در صورت خالی‌بودن، خط پیش‌فرض حساب"
              value={smsForm.sender}
              onChange={(event) => setSmsForm({ ...smsForm, sender: event.target.value })}
            />
            <Input
              label="نام قالب کد تأیید کاوه‌نگار (اختیاری)"
              dir="ltr"
              placeholder="مثلاً gordyarverify"
              value={smsForm.otpTemplate}
              onChange={(event) =>
                setSmsForm({
                  ...smsForm,
                  otpTemplate: event.target.value.trim(),
                })
              }
            />
            <p className="-mt-2 text-xs leading-5 text-muted">
              اگر قالب ثبت شود، کدهای ورود و ثبت‌نام با سرویس VerifyLookup
              ارسال می‌شوند؛ در غیر این صورت ارسال عادی استفاده خواهد شد.
            </p>
            <Input
              label="شماره‌های مجاز دریافت پیامک"
              dir="ltr"
              placeholder="09123456789"
              value={smsForm.allowedRecipients}
              onChange={(event) =>
                setSmsForm({ ...smsForm, allowedRecipients: event.target.value })
              }
            />
            <label className="flex items-center justify-between rounded-xl border border-border/10 bg-surface-raised p-3 text-sm">
              <span>فقط شبیه‌سازی؛ پیام واقعی ارسال نشود</span>
              <input
                type="checkbox"
                checked={smsForm.dryRun}
                onChange={(event) =>
                  setSmsForm({ ...smsForm, dryRun: event.target.checked })
                }
                className="size-4 accent-accent"
              />
            </label>
            <SecureHint />
            <Feedback message={messages.SMS} error={errors.SMS} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save('SMS')} disabled={busy !== null}>
                {busy === 'SMS:save' && <LoaderCircle className="size-4 animate-spin" />}
                ذخیره امن
              </Button>
              <Button
                variant="secondary"
                onClick={() => test('SMS')}
                disabled={busy !== null || sms.status === 'NOT_CONFIGURED'}
              >
                <TestTube2 className="size-4" />
                تست اتصال بدون ارسال پیامک
              </Button>
            </div>
          </div>
        </MembershipCard>
      )}

      {items
        .filter((item) => !['PAYMENT_GATEWAY', 'SMS'].includes(item.key))
        .map((item) => (
          <MembershipCard key={item.id}>
            {header(item, item.provider || 'ارائه‌دهنده هنوز انتخاب نشده')}
            <div className="mt-5 rounded-xl border border-border/10 bg-surface-raised p-4 text-sm text-muted">
              فرم امن این اتصال در مرحله بعد اضافه می‌شود.
            </div>
          </MembershipCard>
        ))}
    </div>
  );
}

function SecureHint() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-xs leading-6 text-muted">
      <EyeOff className="mt-1 size-4 shrink-0 text-success" />
      <span>
        مقدار کامل کلید بعد از ذخیره نمایش داده نمی‌شود. خالی‌گذاشتن فیلد کلید،
        مقدار قبلی را حفظ می‌کند.
      </span>
    </div>
  );
}

function Feedback({ message, error }: { message?: string; error?: string }) {
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (message) {
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="size-4" />
        {message}
      </p>
    );
  }
  return null;
}
