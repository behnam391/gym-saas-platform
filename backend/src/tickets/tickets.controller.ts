import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketDto } from './dto/ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user.userId, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.listMine(user.userId);
  }

  @Get()
  @Roles('GYM_OWNER', 'RECEPTION')
  listForGym() {
    return this.ticketsService.listForGym();
  }

  @Patch(':ticketId')
  @Roles('GYM_OWNER', 'RECEPTION')
  update(@Param('ticketId') ticketId: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(ticketId, dto);
  }
}
