import { type INestApplication, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_CONFIG, type AppConfig } from './config/env';
import { buildOpenApiDocument } from './openapi';

export const API_PREFIX = 'api';

/** Tạo ứng dụng đã cấu hình đầy đủ; dùng chung cho main.ts và kiểm thử tích hợp. */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: true,
  });
  const config = app.get<AppConfig>(APP_CONFIG);

  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  if (config.TRUST_PROXY_HOPS > 0) app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.useBodyParser('json', { limit: '1mb' });

  app.use(helmet());
  app.enableCors({
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'idempotency-key', 'if-match', 'x-request-id', 'x-csrf-token'],
    exposedHeaders: ['x-request-id', 'etag'],
  });

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const openApiEnabled = config.OPENAPI_ENABLED ?? config.NODE_ENV !== 'production';
  if (openApiEnabled) {
    const document = buildOpenApiDocument(app, config.APP_VERSION);
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
      jsonDocumentUrl: `${API_PREFIX}/openapi.json`,
    });
  }

  return app;
}
