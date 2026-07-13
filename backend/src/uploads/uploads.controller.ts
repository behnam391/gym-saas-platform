import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import { RequestUploadUrlDto } from './dto/upload.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Every authenticated role can request an upload URL — the `purpose`
   * field plus the requester's own userId scope the resulting S3 key, and
   * the consuming endpoint (e.g. tenants.reviewInsurance) is what actually
   * gates what the uploaded file is allowed to do, not this endpoint.
   */
  @Post('request-url')
  requestUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestUploadUrlDto) {
    return this.uploadsService.requestUploadUrl(user.userId, dto);
  }
}
