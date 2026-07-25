import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateFinancialAccountDto } from './dto/financial-account.dto';
import { FinancialAccountsService } from './financial-accounts.service';

@Controller('financial-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialAccountsController {
  constructor(private readonly service: FinancialAccountsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFinancialAccountDto) {
    return this.service.create(user, dto);
  }

  @Delete(':accountId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('accountId') accountId: string) {
    return this.service.remove(user.userId, accountId);
  }
}
