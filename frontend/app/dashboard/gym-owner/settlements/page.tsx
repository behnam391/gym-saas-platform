import { ProfessionalSettlementManager } from '../../../../components/ui/professional-settlement-manager';

export default function ProfessionalSettlementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">قرارداد و تسویه متخصصان</h1>
        <p className="mt-1 text-muted">
          مدیریت قراردادهای مربیان و مشاوران تغذیه، محاسبه کارکرد و ثبت پرداخت
        </p>
      </header>
      <ProfessionalSettlementManager />
    </div>
  );
}
