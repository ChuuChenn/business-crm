import 'reflect-metadata';
import { createApp } from './app.factory';
import { APP_CONFIG, type AppConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.PORT, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
