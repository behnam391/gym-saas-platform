import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Use on every protected route: @UseGuards(JwtAuthGuard) */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
