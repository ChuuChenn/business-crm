import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

export function buildOpenApiDocument(app: INestApplication, version: string): OpenAPIObject {
  const config = new DocumentBuilder()
    .setOpenAPIVersion('3.1.0')
    .setTitle('Business CRM API')
    .setDescription('REST API của Business CRM. Quy ước: docs/api/API_CONVENTIONS.md')
    .setVersion(version)
    .addServer('/')
    .build();
  return SwaggerModule.createDocument(app, config);
}
