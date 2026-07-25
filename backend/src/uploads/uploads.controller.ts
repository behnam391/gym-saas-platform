import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
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

  @Post('local')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const destination = join(process.cwd(), '.local', 'uploads');
          mkdirSync(destination, { recursive: true });
          callback(null, destination);
        },
        filename: (_request, file, callback) => {
          const safeExtension = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
          callback(null, `${randomUUID()}${safeExtension}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadLocal(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('purpose') purpose: string,
  ) {
    return this.uploadsService.completeLocalUpload(user.userId, purpose, file);
  }
}
