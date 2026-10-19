import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createApp } from '../app.factory';
import { APP_CONFIG, type AppConfig } from '../config/env';
import { buildOpenApiDocument } from '../openapi';

/** Xuất OpenAPI ra docs/api/openapi.json (không cần DB/Redis đang chạy). */
async function main(): Promise<void> {
  const app = await createApp();
  const doc = buildOpenApiDocument(app, app.get<AppConfig>(APP_CONFIG).APP_VERSION);
  const out = resolve(__dirname, '../../../../docs/api/openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  await app.close();
  console.warn(`Đã ghi ${out}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
