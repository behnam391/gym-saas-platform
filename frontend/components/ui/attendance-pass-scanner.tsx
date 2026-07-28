'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  LoaderCircle,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';
import { MembershipCard } from './membership-card';

type ScannerControls = { stop: () => void };
type ScannerState = 'idle' | 'requesting' | 'active' | 'processing';

interface RedeemResult {
  action: 'CHECK_IN' | 'CHECK_OUT';
  athleteName: string;
  attendance: {
    id: string;
    checkInAt: string;
    checkOutAt?: string | null;
  };
}

interface ScanFeedback {
  tone: 'success' | 'danger';
  title: string;
  description: string;
  action?: RedeemResult['action'];
}

function normalizePassToken(value: string) {
  const raw = value.trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    return parsed.searchParams.get('token')?.trim() || raw;
  } catch {
    const deepLinkMatch = raw.match(/^gordyar:\/\/pass\?(.+)$/i);
    if (deepLinkMatch) {
      return new URLSearchParams(deepLinkMatch[1]).get('token')?.trim() || raw;
    }
    return raw;
  }
}

function cameraErrorMessage(cause: unknown) {
  if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
    return 'اجازه دسترسی به دوربین داده نشد. از تنظیمات مرورگر، دسترسی دوربین را برای گُردیار فعال کنید.';
  }
  if (cause instanceof DOMException && cause.name === 'NotFoundError') {
    return 'دوربینی روی این دستگاه پیدا نشد. می‌توانید کد Pass را به‌صورت دستی وارد کنید.';
  }
  if (!window.isSecureContext) {
    return 'دوربین فقط روی اتصال امن HTTPS یا محیط محلی فعال می‌شود.';
  }
  return 'دوربین راه‌اندازی نشد. اتصال دوربین و مجوز مرورگر را بررسی کنید.';
}

export function AttendancePassScanner({
  onAttendanceChanged,
}: {
  onAttendanceChanged: () => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const processingRef = useRef(false);
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [manualToken, setManualToken] = useState('');
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerState((current) => (current === 'processing' ? current : 'idle'));
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const redeem = useCallback(
    async (value: string) => {
      const token = normalizePassToken(value);
      if (processingRef.current) return;
      if (token.length < 32) {
        setFeedback({
          tone: 'danger',
          title: 'کد Pass معتبر نیست',
          description: 'کد نمایش‌داده‌شده در اپ ورزشکار را دوباره اسکن یا کامل وارد کنید.',
        });
        return;
      }

      processingRef.current = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setScannerState('processing');
      setFeedback(null);
      setCameraError('');

      try {
        const result = await api.post<RedeemResult>('/attendance/pass/redeem', { token });
        const isCheckIn = result.action === 'CHECK_IN';
        setFeedback({
          tone: 'success',
          action: result.action,
          title: isCheckIn ? `ورود ${result.athleteName} ثبت شد` : `خروج ${result.athleteName} ثبت شد`,
          description: isCheckIn
            ? 'عضویت تأیید شد و حضور ورزشکار با موفقیت آغاز شد.'
            : 'خروج ورزشکار ثبت و حضور باز او بسته شد.',
        });
        setManualToken('');
        await onAttendanceChanged();
      } catch (cause) {
        setFeedback({
          tone: 'danger',
          title: 'Pass تأیید نشد',
          description:
            cause instanceof ApiError
              ? cause.message
              : 'ارتباط با سامانه حضور و غیاب برقرار نشد. دوباره تلاش کنید.',
        });
      } finally {
        processingRef.current = false;
        setScannerState('idle');
      }
    },
    [onAttendanceChanged],
  );

  async function startCamera() {
    if (!videoRef.current || scannerState !== 'idle') return;
    setCameraError('');
    setFeedback(null);
    setScannerState('requesting');

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 800,
      });
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result, _error, scanControls) => {
          if (result && !processingRef.current) {
            scanControls.stop();
            void redeem(result.getText());
          }
        },
      );
      controlsRef.current = controls;
      setScannerState('active');
    } catch (cause) {
      stopCamera();
      setCameraError(cameraErrorMessage(cause));
    }
  }

  function submitManualToken(event: FormEvent) {
    event.preventDefault();
    void redeem(manualToken);
  }

  const isBusy = scannerState === 'requesting' || scannerState === 'processing';

  return (
    <MembershipCard className="overflow-hidden p-0">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <QrCode className="size-5 text-accent-soft" />
              اسکن گُردیار Pass
            </h2>
            <p className="mt-1 text-sm text-muted">
              کد پویای ورزشکار را مقابل دوربین بگیرید؛ ورود یا خروج به‌صورت خودکار تشخیص داده می‌شود.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            <ShieldCheck className="size-4" />
            کد یک‌بارمصرف ۳۰ ثانیه‌ای
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline />

          {scannerState !== 'active' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,rgb(var(--color-accent)/0.08),transparent_65%)] p-6 text-center">
              {scannerState === 'processing' ? (
                <>
                  <LoaderCircle className="size-12 animate-spin text-accent-soft" />
                  <div><p className="font-bold">در حال اعتبارسنجی Pass</p><p className="mt-1 text-sm text-muted">چند لحظه صبر کنید…</p></div>
                </>
              ) : (
                <>
                  <div className="grid size-20 place-items-center rounded-3xl border border-accent/30 bg-accent/10"><Camera className="size-10 text-accent-soft" /></div>
                  <div>
                    <p className="font-bold">دوربین آماده اسکن است</p>
                    <p className="mt-1 max-w-sm text-sm text-muted">برای شروع، دسترسی دوربین را فعال کنید. تصویر ذخیره یا ارسال نمی‌شود.</p>
                  </div>
                  <Button onClick={startCamera} disabled={isBusy}>
                    {scannerState === 'requesting' ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    فعال‌کردن دوربین
                  </Button>
                </>
              )}
            </div>
          )}

          {scannerState === 'active' && (
            <>
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/10">
                <div className="relative aspect-square w-[min(62%,240px)] rounded-3xl border-2 border-accent shadow-[0_0_0_999px_rgb(0_0_0/0.38),0_0_28px_rgb(var(--color-accent)/0.45)]">
                  <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-accent-soft shadow-[0_0_12px_rgb(var(--color-accent-soft))]" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                <p className="text-sm font-semibold text-white">QR را داخل کادر نگه دارید</p>
                <Button size="sm" variant="secondary" onClick={stopCamera}><CameraOff className="size-4" />توقف</Button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {feedback ? (
            <div role="status" className={`rounded-2xl border p-5 ${feedback.tone === 'success' ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'}`}>
              <div className="flex items-start gap-3">
                {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-7 shrink-0 text-danger" />}
                <div>
                  <p className="font-extrabold">{feedback.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{feedback.description}</p>
                  {feedback.action && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-base/40 px-3 py-1.5 text-xs font-bold">
                      {feedback.action === 'CHECK_IN' ? <LogIn className="size-4 text-success" /> : <LogOut className="size-4 text-accent-soft" />}
                      {feedback.action === 'CHECK_IN' ? 'ورود ثبت شد' : 'خروج ثبت شد'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-surface/60 p-5">
              <p className="font-bold">راهنمای سریع</p>
              <ol className="mt-3 grid gap-3 text-sm text-muted">
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent-soft">۱</span>ورزشکار از اپ، بخش «ورود» را باز می‌کند.</li>
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent-soft">۲</span>QR پویا مقابل دوربین پذیرش قرار می‌گیرد.</li>
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent-soft">۳</span>نتیجه ورود یا خروج همان لحظه نمایش داده می‌شود.</li>
              </ol>
            </div>
          )}

          {cameraError && <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">{cameraError}</div>}

          <form onSubmit={submitManualToken} className="mt-auto rounded-2xl border border-white/10 bg-surface/60 p-4">
            <label className="grid gap-2 text-sm">
              <span className="flex items-center gap-2 font-semibold"><Keyboard className="size-4 text-accent-soft" />ورود دستی کد Pass</span>
              <span className="text-xs leading-5 text-muted">اگر دوربین در دسترس نیست، کد را از دستگاه ورزشکار اینجا وارد کنید.</span>
              <input
                dir="ltr"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="کد یک‌بارمصرف"
                autoComplete="off"
                className="h-11 rounded-xl border border-white/10 bg-base/50 px-3 text-left font-mono text-sm outline-none transition focus:border-accent/60"
              />
            </label>
            <Button className="mt-3 w-full" type="submit" variant="secondary" disabled={isBusy || manualToken.trim().length < 32}>
              {scannerState === 'processing' ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              بررسی و ثبت
            </Button>
          </form>
        </div>
      </div>
    </MembershipCard>
  );
}
