import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Local development fallback for media uploads. Production deployments use
  // the existing presigned S3 flow and can disable this route entirely.
  app.useStaticAssets(join(process.cwd(), '.local', 'uploads'), {
    prefix: '/local-uploads/',
  });

  app.use(helmet()); // sets security headers (XSS, sniffing, etc.)
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unexpected fields — blocks mass-assignment
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('سامانه هوشمند مدیریت باشگاه‌های ورزشی')
    .setDescription('مستندات API پلتفرم چندباشگاهی، داشبوردها و مارکت‌پلیس عمومی')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const apiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, apiDocument, {
    customSiteTitle: 'مستندات API باشگاه‌یار',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
