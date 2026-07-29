'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  FileSignature,
  HandCoins,
  LoaderCircle,
  PauseCircle,
  Plus,
  ReceiptText,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';

type ContractType = 'FIXED' | 'REVENUE_SHARE' | 'PER_CLIENT' | 'HYBRID';
type BillingCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';
type SettlementStatus = 'PENDING' | 'PAID' | 'CANCELLED';
type PaymentMethod = 'ONLINE_GATEWAY' | 'CASH' | 'POS' | 'WALLET';

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: 'TRAINER' | 'NUTRITIONIST';
  activeClientCount: number;
  trainerProfile?: { specialties: string[] } | null;
  settlementAccount?: {
    id: string;
    label: string;
    bankName?: string | null;
    iban?: string | null;
    cardLast4?: string | null;
    isDefault: boolean;
  } | null;
}

interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  baseRevenue: number | string;
  clientCount: number;
  grossAmount: number | string;
  deductions: number | string;
  netAmount: number | string;
  status: SettlementStatus;
  paymentMethod?: PaymentMethod | null;
  paymentRef?: string | null;
  paidAt?: string | null;
  notes?: string | null;
}

interface Contract {
  id: string;
  professionalId: string;
  type: ContractType;
  billingCycle: BillingCycle;
  fixedAmount?: number | string | null;
  sharePercent?: number | string | null;
  perClientAmount?: number | string | null;
  startDate: string;
  endDate?: string | null;
  status: ContractStatus;
  notes?: string | null;
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: 'TRAINER' | 'NUTRITIONIST';
  };
  settlements: Settlement[];
}

interface DashboardResponse {
  professionals: Professional[];
  contracts: Contract[];
  summary: {
    activeContracts: number;
    pendingSettlements: number;
    pendingAmount: number;
    paidThisMonthCount: number;
    paidThisMonthAmount: number;
    professionalsWithoutAccount: number;
  };
}

const CONTRACT_TYPES: Record<ContractType, string> = {
  FIXED: 'مبلغ ثابت',
  REVENUE_SHARE: 'درصد از درآمد',
  PER_CLIENT: 'به‌ازای هر شاگرد',
  HYBRID: 'ترکیبی',
};

const CYCLES: Record<BillingCycle, string> = {
  WEEKLY: 'هفتگی',
  BIWEEKLY: 'دوهفته‌ای',
  MONTHLY: 'ماهانه',
};

const METHODS: Record<PaymentMethod, string> = {
  ONLINE_GATEWAY: 'درگاه آنلاین',
  CASH: 'نقدی',
  POS: 'کارت‌خوان',
  WALLET: 'کیف پول',
};

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
};

function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fa-IR')} تومان`;
}

function roleLabel(role: string) {
  return role === 'TRAINER' ? 'مربی' : 'مشاور تغذیه';
}

function isoStart(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function isoEnd(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function contractTerms(contract: Contract) {
  const parts: string[] = [];
  if (Number(contract.fixedAmount)) parts.push(`ثابت ${money(contract.fixedAmount)}`);
  if (Number(contract.sharePercent)) parts.push(`${Number(contract.sharePercent).toLocaleString('fa-IR')}٪ از درآمد`);
  if (Number(contract.perClientAmount)) parts.push(`${money(contract.perClientAmount)} برای هر شاگرد`);
  return parts.join(' + ');
}

const EMPTY_CONTRACT = {
  professionalId: '',
  type: 'FIXED' as ContractType,
  billingCycle: 'MONTHLY' as BillingCycle,
  fixedAmount: '',
  sharePercent: '',
  perClientAmount: '',
  startDate: today(),
  endDate: '',
  notes: '',
};

export function ProfessionalSettlementManager() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState(EMPTY_CONTRACT);
  const [settlementContractId, setSettlementContractId] = useState<string | null>(null);
  const [settlementForm, setSettlementForm] = useState({
    periodStart: monthStart(),
    periodEnd: today(),
    baseRevenue: '',
    deductions: '',
    notes: '',
  });
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'POS' as PaymentMethod,
    paymentRef: '',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DashboardResponse>('/professional-finance/dashboard');
      setData(response);
      setContractForm((current) => ({
        ...current,
        professionalId: current.professionalId || response.professionals[0]?.id || '',
      }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'دریافت اطلاعات قراردادها انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const allSettlements = useMemo(
    () =>
      (data?.contracts ?? [])
        .flatMap((contract) =>
          contract.settlements.map((settlement) => ({
            ...settlement,
            contract,
          })),
        )
        .sort(
          (first, second) =>
            new Date(second.periodEnd).getTime() - new Date(first.periodEnd).getTime(),
        ),
    [data],
  );

  async function createContract(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/professional-finance/contracts', {
        professionalId: contractForm.professionalId,
        type: contractForm.type,
        billingCycle: contractForm.billingCycle,
        fixedAmount: contractForm.fixedAmount ? Number(contractForm.fixedAmount) : undefined,
        sharePercent: contractForm.sharePercent ? Number(contractForm.sharePercent) : undefined,
        perClientAmount: contractForm.perClientAmount
          ? Number(contractForm.perClientAmount)
          : undefined,
        startDate: isoStart(contractForm.startDate),
        endDate: contractForm.endDate ? isoEnd(contractForm.endDate) : undefined,
        notes: contractForm.notes || undefined,
      });
      setShowContractForm(false);
      setContractForm({
        ...EMPTY_CONTRACT,
        professionalId: data?.professionals[0]?.id ?? '',
      });
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت قرارداد انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function setContractStatus(contract: Contract, status: ContractStatus) {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/professional-finance/contracts/${contract.id}/status`, { status });
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تغییر وضعیت قرارداد انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function createSettlement(event: FormEvent) {
    event.preventDefault();
    if (!settlementContractId) return;
    setBusy(true);
    setError('');
    try {
      await api.post(
        `/professional-finance/contracts/${settlementContractId}/settlements`,
        {
          periodStart: isoStart(settlementForm.periodStart),
          periodEnd: isoEnd(settlementForm.periodEnd),
          baseRevenue: settlementForm.baseRevenue
            ? Number(settlementForm.baseRevenue)
            : undefined,
          deductions: settlementForm.deductions
            ? Number(settlementForm.deductions)
            : undefined,
          notes: settlementForm.notes || undefined,
        },
      );
      setSettlementContractId(null);
      setSettlementForm({
        periodStart: monthStart(),
        periodEnd: today(),
        baseRevenue: '',
        deductions: '',
        notes: '',
      });
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'محاسبه تسویه انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(event: FormEvent) {
    event.preventDefault();
    if (!payingId) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/professional-finance/settlements/${payingId}/pay`, {
        paymentMethod: paymentForm.paymentMethod,
        paymentRef: paymentForm.paymentRef || undefined,
      });
      setPayingId(null);
      setPaymentForm({ paymentMethod: 'POS', paymentRef: '' });
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'ثبت پرداخت انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <MembershipCard className="grid min-h-56 place-items-center text-muted">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-3 size-7 animate-spin" />
          در حال دریافت قراردادها…
        </div>
      </MembershipCard>
    );
  }

  const summary = data?.summary;
  const selectedContract = data?.contracts.find(
    (contract) => contract.id === settlementContractId,
  );

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <AlertTriangle className="size-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MembershipCard className="p-5">
          <FileSignature className="size-7 text-accent-soft" />
          <p className="mt-4 text-sm text-muted">قرارداد فعال</p>
          <p className="mt-1 text-2xl font-extrabold">
            {(summary?.activeContracts ?? 0).toLocaleString('fa-IR')}
          </p>
        </MembershipCard>
        <MembershipCard className="p-5">
          <HandCoins className="size-7 text-warning" />
          <p className="mt-4 text-sm text-muted">در انتظار پرداخت</p>
          <p className="mt-1 text-xl font-extrabold">{money(summary?.pendingAmount)}</p>
          <p className="mt-1 text-xs text-muted">
            {(summary?.pendingSettlements ?? 0).toLocaleString('fa-IR')} صورتحساب
          </p>
        </MembershipCard>
        <MembershipCard className="p-5">
          <CheckCircle2 className="size-7 text-success" />
          <p className="mt-4 text-sm text-muted">پرداخت این ماه</p>
          <p className="mt-1 text-xl font-extrabold">
            {money(summary?.paidThisMonthAmount)}
          </p>
        </MembershipCard>
        <MembershipCard className="p-5">
          <WalletCards className="size-7 text-danger" />
          <p className="mt-4 text-sm text-muted">بدون حساب تسویه</p>
          <p className="mt-1 text-2xl font-extrabold">
            {(summary?.professionalsWithoutAccount ?? 0).toLocaleString('fa-IR')}
          </p>
        </MembershipCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold">قراردادهای مربی و مشاور</h2>
          <p className="mt-1 text-sm text-muted">
            هر متخصص هم‌زمان فقط یک قرارداد فعال دارد.
          </p>
        </div>
        <Button onClick={() => setShowContractForm((value) => !value)}>
          <Plus className="size-4" />
          قرارداد جدید
        </Button>
      </div>

      {showContractForm && (
        <MembershipCard>
          <h3 className="mb-5 font-extrabold">ثبت قرارداد جدید</h3>
          <form onSubmit={createContract} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5 text-sm text-muted md:col-span-2">
              متخصص
              <select
                value={contractForm.professionalId}
                onChange={(event) =>
                  setContractForm({ ...contractForm, professionalId: event.target.value })
                }
                required
                className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"
              >
                <option value="">انتخاب کنید</option>
                {data?.professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.firstName} {professional.lastName} — {roleLabel(professional.role)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              نوع قرارداد
              <select
                value={contractForm.type}
                onChange={(event) =>
                  setContractForm({
                    ...contractForm,
                    type: event.target.value as ContractType,
                  })
                }
                className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"
              >
                {Object.entries(CONTRACT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              دوره محاسبه
              <select
                value={contractForm.billingCycle}
                onChange={(event) =>
                  setContractForm({
                    ...contractForm,
                    billingCycle: event.target.value as BillingCycle,
                  })
                }
                className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"
              >
                {Object.entries(CYCLES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {(contractForm.type === 'FIXED' || contractForm.type === 'HYBRID') && (
              <Input
                label="مبلغ ثابت هر دوره (تومان)"
                type="number"
                min={0}
                value={contractForm.fixedAmount}
                onChange={(event) =>
                  setContractForm({ ...contractForm, fixedAmount: event.target.value })
                }
              />
            )}
            {(contractForm.type === 'REVENUE_SHARE' ||
              contractForm.type === 'HYBRID') && (
              <Input
                label="درصد سهم از درآمد"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={contractForm.sharePercent}
                onChange={(event) =>
                  setContractForm({ ...contractForm, sharePercent: event.target.value })
                }
              />
            )}
            {(contractForm.type === 'PER_CLIENT' ||
              contractForm.type === 'HYBRID') && (
              <Input
                label="مبلغ هر شاگرد (تومان)"
                type="number"
                min={0}
                value={contractForm.perClientAmount}
                onChange={(event) =>
                  setContractForm({
                    ...contractForm,
                    perClientAmount: event.target.value,
                  })
                }
              />
            )}
            <Input
              label="شروع قرارداد"
              type="date"
              value={contractForm.startDate}
              onChange={(event) =>
                setContractForm({ ...contractForm, startDate: event.target.value })
              }
              required
            />
            <Input
              label="پایان قرارداد (اختیاری)"
              type="date"
              min={contractForm.startDate}
              value={contractForm.endDate}
              onChange={(event) =>
                setContractForm({ ...contractForm, endDate: event.target.value })
              }
            />
            <label className="grid gap-1.5 text-sm text-muted md:col-span-2 xl:col-span-4">
              توضیحات
              <textarea
                value={contractForm.notes}
                onChange={(event) =>
                  setContractForm({ ...contractForm, notes: event.target.value })
                }
                rows={3}
                className="rounded-xl border border-border/10 bg-surface p-4 text-ink outline-none focus:ring-2 focus:ring-accent/50"
              />
            </label>
            <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowContractForm(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={busy || !contractForm.professionalId}>
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
                ثبت قرارداد
              </Button>
            </div>
          </form>
        </MembershipCard>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {data?.contracts.map((contract) => {
          const professional = data.professionals.find(
            (item) => item.id === contract.professionalId,
          );
          return (
            <MembershipCard key={contract.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold">
                      {contract.professional.firstName} {contract.professional.lastName}
                    </h3>
                    <Badge tone="accent">{roleLabel(contract.professional.role)}</Badge>
                    <Badge
                      tone={
                        contract.status === 'ACTIVE'
                          ? 'success'
                          : contract.status === 'SUSPENDED'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {contract.status === 'ACTIVE'
                        ? 'فعال'
                        : contract.status === 'SUSPENDED'
                          ? 'متوقف'
                          : 'پایان‌یافته'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {CONTRACT_TYPES[contract.type]} · {CYCLES[contract.billingCycle]}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted">شاگرد فعال</p>
                  <p className="font-extrabold">
                    {(professional?.activeClientCount ?? 0).toLocaleString('fa-IR')}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-base/40 p-4">
                <p className="text-xs text-muted">فرمول قرارداد</p>
                <p className="mt-1 font-bold">{contractTerms(contract)}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                <span>
                  شروع: {new Date(contract.startDate).toLocaleDateString('fa-IR')}
                </span>
                {professional?.settlementAccount ? (
                  <span className="text-success">
                    حساب تسویه: {professional.settlementAccount.bankName ?? professional.settlementAccount.label}
                    {professional.settlementAccount.cardLast4
                      ? ` · ${professional.settlementAccount.cardLast4}`
                      : ''}
                  </span>
                ) : (
                  <span className="text-danger">حساب تسویه ثبت نشده</span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {contract.status === 'ACTIVE' && (
                  <>
                    <Button size="sm" onClick={() => setSettlementContractId(contract.id)}>
                      <ReceiptText className="size-4" />
                      محاسبه تسویه
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setContractStatus(contract, 'SUSPENDED')}
                    >
                      <PauseCircle className="size-4" />
                      توقف
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setContractStatus(contract, 'ENDED')}
                    >
                      پایان قرارداد
                    </Button>
                  </>
                )}
                {contract.status === 'SUSPENDED' && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => setContractStatus(contract, 'ACTIVE')}
                  >
                    فعال‌سازی مجدد
                  </Button>
                )}
              </div>
            </MembershipCard>
          );
        })}
        {!data?.contracts.length && (
          <MembershipCard className="grid min-h-48 place-items-center text-center text-muted xl:col-span-2">
            <div>
              <FileSignature className="mx-auto mb-3 size-9" />
              هنوز قراردادی ثبت نشده است.
            </div>
          </MembershipCard>
        )}
      </div>

      {selectedContract && (
        <MembershipCard className="border-accent/30">
          <div className="mb-5">
            <h3 className="font-extrabold">محاسبه صورتحساب جدید</h3>
            <p className="mt-1 text-sm text-muted">
              {selectedContract.professional.firstName} {selectedContract.professional.lastName}
              {' · '}
              {contractTerms(selectedContract)}
            </p>
          </div>
          <form onSubmit={createSettlement} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="شروع دوره"
              type="date"
              value={settlementForm.periodStart}
              onChange={(event) =>
                setSettlementForm({ ...settlementForm, periodStart: event.target.value })
              }
              required
            />
            <Input
              label="پایان دوره"
              type="date"
              min={settlementForm.periodStart}
              value={settlementForm.periodEnd}
              onChange={(event) =>
                setSettlementForm({ ...settlementForm, periodEnd: event.target.value })
              }
              required
            />
            {(selectedContract.type === 'REVENUE_SHARE' ||
              selectedContract.type === 'HYBRID') && (
              <Input
                label="درآمد مبنای درصد (تومان)"
                type="number"
                min={0}
                value={settlementForm.baseRevenue}
                required
                onChange={(event) =>
                  setSettlementForm({ ...settlementForm, baseRevenue: event.target.value })
                }
              />
            )}
            <Input
              label="کسورات (تومان)"
              type="number"
              min={0}
              value={settlementForm.deductions}
              onChange={(event) =>
                setSettlementForm({ ...settlementForm, deductions: event.target.value })
              }
            />
            <label className="grid gap-1.5 text-sm text-muted md:col-span-2 xl:col-span-4">
              توضیحات کارکرد یا کسورات
              <textarea
                value={settlementForm.notes}
                onChange={(event) =>
                  setSettlementForm({ ...settlementForm, notes: event.target.value })
                }
                rows={3}
                className="rounded-xl border border-border/10 bg-surface p-4 text-ink outline-none focus:ring-2 focus:ring-accent/50"
              />
            </label>
            <p className="flex items-center gap-2 text-xs text-muted md:col-span-2">
              <UsersRound className="size-4 text-accent-soft" />
              تعداد شاگرد فعال هنگام ثبت، مستقیماً از سامانه خوانده می‌شود.
            </p>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setSettlementContractId(null)}>
                انصراف
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <CircleDollarSign className="size-4" />}
                محاسبه و ثبت
              </Button>
            </div>
          </form>
        </MembershipCard>
      )}

      <MembershipCard className="overflow-hidden p-0">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-extrabold">صورتحساب‌ها و پرداخت‌ها</h2>
          <p className="mt-1 text-xs text-muted">
            سابقه محاسبات، کسورات و پرداخت به متخصصان
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-surface-raised text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">متخصص</th>
                <th className="px-5 py-3 font-medium">دوره</th>
                <th className="px-5 py-3 font-medium">شاگرد</th>
                <th className="px-5 py-3 font-medium">ناخالص</th>
                <th className="px-5 py-3 font-medium">کسورات</th>
                <th className="px-5 py-3 font-medium">قابل پرداخت</th>
                <th className="px-5 py-3 font-medium">وضعیت</th>
                <th className="px-5 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {allSettlements.map((settlement) => (
                <tr key={settlement.id} className="border-t border-white/10">
                  <td className="px-5 py-4">
                    <p className="font-bold">
                      {settlement.contract.professional.firstName}{' '}
                      {settlement.contract.professional.lastName}
                    </p>
                    <p className="text-xs text-muted">
                      {roleLabel(settlement.contract.professional.role)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {new Date(settlement.periodStart).toLocaleDateString('fa-IR')} تا{' '}
                    {new Date(settlement.periodEnd).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-5 py-4">
                    {settlement.clientCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-5 py-4">{money(settlement.grossAmount)}</td>
                  <td className="px-5 py-4 text-danger">
                    {money(settlement.deductions)}
                  </td>
                  <td className="px-5 py-4 font-extrabold text-success">
                    {money(settlement.netAmount)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        settlement.status === 'PAID'
                          ? 'success'
                          : settlement.status === 'PENDING'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {settlement.status === 'PAID'
                        ? 'پرداخت‌شده'
                        : settlement.status === 'PENDING'
                          ? 'در انتظار پرداخت'
                          : 'لغوشده'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {settlement.status === 'PENDING' ? (
                      <Button size="sm" onClick={() => setPayingId(settlement.id)}>
                        <Banknote className="size-4" />
                        ثبت پرداخت
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">
                        {settlement.paymentMethod
                          ? METHODS[settlement.paymentMethod]
                          : '—'}
                        {settlement.paymentRef ? ` · ${settlement.paymentRef}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!allSettlements.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">
                    <CalendarRange className="mx-auto mb-3 size-8" />
                    هنوز صورتحسابی ساخته نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MembershipCard>

      {payingId && (
        <MembershipCard className="border-success/30">
          <h3 className="font-extrabold">تأیید پرداخت صورتحساب</h3>
          <form onSubmit={markPaid} className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5 text-sm text-muted">
              روش پرداخت
              <select
                value={paymentForm.paymentMethod}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentMethod: event.target.value as PaymentMethod,
                  })
                }
                className="h-11 rounded-xl border border-border/10 bg-surface px-4 text-ink"
              >
                {Object.entries(METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="شماره پیگیری (اختیاری)"
              value={paymentForm.paymentRef}
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, paymentRef: event.target.value })
              }
            />
            <div className="flex items-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPayingId(null)}>
                انصراف
              </Button>
              <Button type="submit" disabled={busy}>
                <CheckCircle2 className="size-4" />
                تأیید پرداخت
              </Button>
            </div>
          </form>
        </MembershipCard>
      )}
    </div>
  );
}
