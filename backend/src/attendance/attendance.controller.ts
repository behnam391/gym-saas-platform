import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles('RECEPTION', 'GYM_OWNER')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user.userId, dto);
  }

  @Post('check-out/:attendanceId')
  @Roles('RECEPTION', 'GYM_OWNER')
  checkOut(@Param('attendanceId') attendanceId: string) {
    return this.attendanceService.checkOut(attendanceId);
  }

  @Get('crowd-status')
  // Any authenticated tenant member may view live occupancy — no @Roles()
  // restriction needed, RolesGuard allows all authenticated roles by default.
  getCrowdStatus() {
    return this.attendanceService.getCrowdStatus();
  }

  @Get('recent')
  @Roles('RECEPTION', 'GYM_OWNER')
  listRecent() {
    return this.attendanceService.listRecent();
  }
}
