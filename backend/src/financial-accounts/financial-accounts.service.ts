import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateFinancialAccountDto } from './dto/financial-account.dto';

const ROLE_SCOPES: Record<string, string[]> = {
  GYM_OWNER: ['PERSONAL', 'GYM'],
  BUFFET_STAFF: ['PERSONAL', 'BUFFET'],
  TRAINER: ['PERSONAL', 'TRAINER'],
  NUTRITIONIST: ['PERSONAL', 'ADVISOR'],
  RECEPTION: ['PERSONAL'],
  ATHLETE: ['PERSONAL'],
};

@Injectable()
export class FinancialAccountsService {
  constructor(private readonly prisma: PrismaService, private readonly tenantContext: TenantContext) {}

  listMine(userId: string) {
    return this.prisma.forTenant((tx) => tx.financialAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }));
  }

  async create(user: AuthenticatedUser, dto: CreateFinancialAccountDto) {
    if (!(ROLE_SCOPES[user.role] ?? []).includes(dto.scope)) {
      throw new BadRequestException('این نوع حساب برای نقش شما قابل ثبت نیست.');
    }
    if (!dto.iban && !dto.accountNumber && !dto.cardNumber) {
      throw new BadRequestException('حداقل شماره شبا، حساب یا کارت را وارد کنید.');
    }

    const { cardNumber, ...safe } = dto;
    return this.prisma.forTenant(async (tx) => {
      if (dto.isDefault) {
        await tx.financialAccount.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
      }
      return tx.financialAccount.create({
        data: {
          ...safe,
          tenantId: this.tenantContext.requireTenantId(),
          userId: user.userId,
          cardLast4: cardNumber?.slice(-4),
        },
      });
    });
  }

  async remove(userId: string, accountId: string) {
    return this.prisma.forTenant(async (tx) => {
      const account = await tx.financialAccount.findFirst({ where: { id: accountId, userId } });
      if (!account) throw new NotFoundException('حساب مالی یافت نشد.');
      await tx.financialAccount.delete({ where: { id: accountId } });
      return { message: 'حساب مالی حذف شد.' };
    });
  }
}
