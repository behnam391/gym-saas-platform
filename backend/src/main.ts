import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  const localUploadsEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.LOCAL_UPLOADS_ENABLED === 'true';
  if (localUploadsEnabled) {
    app.useStaticAssets(join(process.cwd(), '.local', 'uploads'), {
      prefix: '/local-uploads/',
    });
  }

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

  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('گُردیار | سامانه هوشمند ورزش ایران')
      .setDescription('مستندات API پلتفرم چندباشگاهی و مارکت‌پلیس گُردیار')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const apiDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, apiDocument, {
      customSiteTitle: 'مستندات API گُردیار',
      swaggerOptions: {
        persistAuthorization: false,
        displayRequestDuration: true,
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
