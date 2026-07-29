import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { FinanceDashboardQueryDto, RecordManualPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  recordManualPayment(membershipId: string, dto: RecordManualPaymentDto) {
    return this.prisma.forTenant(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        include: {
          plan: true,
          user: { include: { insuranceDocs: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 } } },
        },
      });
      if (!membership) throw new NotFoundException('عضویت یافت نشد.');
      if (membership.status === 'ACTIVE') throw new BadRequestException('این عضویت قبلاً فعال شده است.');
      if (membership.status === 'CANCELLED' || membership.status === 'SUSPENDED') {
        throw new BadRequestException('برای این عضویت امکان ثبت پرداخت وجود ندارد.');
      }

      const insurance = membership.user.insuranceDocs[0];
      if (!insurance || (insurance.validUntil && insurance.validUntil < new Date())) {
        throw new BadRequestException('بیمه ورزشی معتبر و تاییدشده برای این کاربر ثبت نشده است.');
      }
      if (dto.amount < Number(membership.plan.price)) {
        throw new BadRequestException('مبلغ پرداختی از مبلغ پلن عضویت کمتر است.');
      }

      const duplicate = await tx.payment.findFirst({
        where: { membershipId, status: 'SUCCEEDED' },
      });
      if (duplicate) throw new BadRequestException('پرداخت موفق برای این عضویت قبلاً ثبت شده است.');

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + membership.plan.durationDays);

      const payment = await tx.payment.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          userId: membership.userId,
          membershipId,
          amount: dto.amount,
          method: dto.method,
          status: 'SUCCEEDED',
          gatewayRef: dto.gatewayRef,
          paidAt: now,
        },
      });
      await tx.membership.update({
        where: { id: membershipId },
        data: { status: 'ACTIVE', startDate: now, endDate },
      });
      return payment;
    });
  }

  listForTenant() {
    return this.prisma.forTenant((tx) =>
      tx.payment.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, mobile: true } },
          membership: { include: { plan: true } },
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      }),
    );
  }

  listMine(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.payment.findMany({
        where: { userId },
        include: { membership: { include: { plan: true } }, order: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  summary() {
    return this.prisma.forTenant(async (tx) => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [payments, pendingCount, activeMemberships] = await Promise.all([
        tx.payment.aggregate({
          where: { status: 'SUCCEEDED', paidAt: { gte: startOfMonth } },
          _sum: { amount: true },
          _count: true,
        }),
        tx.payment.count({ where: { status: 'PENDING' } }),
        tx.membership.count({ where: { status: 'ACTIVE' } }),
      ]);
      return {
        revenueThisMonth: Number(payments._sum.amount ?? 0),
        successfulPaymentsThisMonth: payments._count,
        pendingPayments: pendingCount,
        activeMemberships,
      };
    });
  }

  async dashboard(query: FinanceDashboardQueryDto) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : now;
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('بازه زمانی گزارش مالی معتبر نیست.');
    }
    if ((to.getTime() - from.getTime()) / 86_400_000 > 366) {
      throw new BadRequestException('حداکثر بازه گزارش مالی یک سال است.');
    }

    const search = query.search?.trim();
    return this.prisma.forTenant(async (tx) => {
      const paymentWhere = {
        createdAt: { gte: from, lt: to },
        ...(query.status ? { status: query.status } : {}),
        ...(query.method ? { method: query.method } : {}),
        ...(query.source === 'MEMBERSHIP'
          ? { membershipId: { not: null } }
          : query.source === 'CAFETERIA'
            ? { orderId: { not: null } }
            : query.source === 'OTHER'
              ? { membershipId: null, orderId: null }
              : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' as const } },
                  { lastName: { contains: search, mode: 'insensitive' as const } },
                  { mobile: { contains: search } },
                ],
              },
            }
          : {}),
      };

      const [
        transactions,
        pendingMemberships,
        unpaidDeliveredOrders,
        expiringSoon,
        successfulForTrend,
      ] = await Promise.all([
        tx.payment.findMany({
          where: paymentWhere,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
            membership: { include: { plan: true } },
            order: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
        tx.membership.findMany({
          where: { status: 'PENDING_PAYMENT' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, mobile: true } },
            plan: true,
            payments: { where: { status: 'SUCCEEDED' }, select: { amount: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 200,
        }),
        tx.order.aggregate({
          where: { status: 'DELIVERED', payment: null },
          _sum: { totalAmount: true },
          _count: true,
        }),
        tx.membership.count({
          where: {
            status: 'ACTIVE',
            endDate: { gte: now, lte: new Date(now.getTime() + 7 * 86_400_000) },
          },
        }),
        tx.payment.findMany({
          where: {
            status: 'SUCCEEDED',
            createdAt: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)),
            },
          },
          select: { amount: true, createdAt: true },
        }),
      ]);

      const debtors = pendingMemberships
        .map((membership) => {
          const paid = membership.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
          );
          const outstanding = Math.max(0, Number(membership.plan.price) - paid);
          return {
            membershipId: membership.id,
            user: membership.user,
            planTitle: membership.plan.title,
            planPrice: Number(membership.plan.price),
            paid,
            outstanding,
            requestedAt: membership.createdAt,
          };
        })
        .filter((item) => item.outstanding > 0);

      const successful = transactions.filter((payment) => payment.status === 'SUCCEEDED');
      const sum = (items: typeof transactions) =>
        items.reduce((total, payment) => total + Number(payment.amount), 0);
      const collected = sum(successful);
      const membershipRevenue = sum(
        successful.filter((payment) => payment.membershipId),
      );
      const cafeteriaRevenue = sum(successful.filter((payment) => payment.orderId));
      const refunded = sum(
        transactions.filter((payment) => payment.status === 'REFUNDED'),
      );
      const pendingAmount = sum(
        transactions.filter((payment) => payment.status === 'PENDING'),
      );

      const methodMap = new Map<string, { amount: number; count: number }>();
      for (const payment of successful) {
        const current = methodMap.get(payment.method) ?? { amount: 0, count: 0 };
        current.amount += Number(payment.amount);
        current.count += 1;
        methodMap.set(payment.method, current);
      }

      const monthMap = new Map<string, number>();
      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
        monthMap.set(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`, 0);
      }
      for (const payment of successfulForTrend) {
        const key = `${payment.createdAt.getUTCFullYear()}-${String(payment.createdAt.getUTCMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) monthMap.set(key, monthMap.get(key)! + Number(payment.amount));
      }

      return {
        transactions,
        summary: {
          collected,
          membershipRevenue,
          cafeteriaRevenue,
          otherRevenue: Math.max(0, collected - membershipRevenue - cafeteriaRevenue),
          refunded,
          pendingAmount,
          successfulCount: successful.length,
          debtorsCount: debtors.length,
          outstandingMemberships: debtors.reduce(
            (total, debtor) => total + debtor.outstanding,
            0,
          ),
          unpaidBuffetOrders: unpaidDeliveredOrders._count,
          unpaidBuffetValue: Number(unpaidDeliveredOrders._sum.totalAmount ?? 0),
          expiringSoon,
        },
        methodBreakdown: Array.from(methodMap, ([method, values]) => ({
          method,
          ...values,
        })),
        monthlyTrend: Array.from(monthMap, ([month, amount]) => ({ month, amount })),
        debtors,
        range: { from: from.toISOString(), to: to.toISOString() },
      };
    });
  }
}
