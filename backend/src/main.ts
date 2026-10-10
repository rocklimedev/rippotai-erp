import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

import * as express from 'express';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';
import { StripSecretsInterceptor } from './common/interceptors/strip-secrets.interceptor';
import { configureHttpSecurity } from './common/security/http-security';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureHttpSecurity(app);
  // Saved comparison snapshots include BOQ lines and vendor rates.
  app.useBodyParser('json', { limit: '3mb' });

  const isDev = process.env.NODE_ENV !== 'production';

  // Only use Redis Socket.IO adapter outside development
  if (!isDev) {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    console.log('✅ Redis Socket.IO Adapter Enabled');
  } else {
    console.log('⚠️ Development mode - Redis Socket.IO Adapter Disabled');
  }

  // Never serialise password hashes / tokens, whatever a query included.
  app.useGlobalInterceptors(new StripSecretsInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Local CDN fallback (no SFTP host configured): serve uploaded files from disk.
  if (!process.env.CDN_HOST) {
    const cdnDir = process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
    fs.mkdirSync(cdnDir, { recursive: true });
    // CORS on static files so PDF export (html2canvas useCORS) can draw uploaded photos.
    app.use(
      '/cdn',
      express.static(cdnDir, {
        setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
      }),
    );
  }

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://vendors-quote.rippotaiarchitecture.com',
      'https://rippotai-erp-qga2.vercel.app',
      'https://inos.rippotaiarchitecture.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-CDN-Secret',
      'x-cdn-secret',
    ],
  });

  const port = Number(process.env.PORT) || 5000;

  await app.listen(port);

  console.log(`🚀 Rippotai ERP API running on http://localhost:${port}/api/v1`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application', err);
  process.exit(1);
});
