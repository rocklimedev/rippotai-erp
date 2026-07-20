import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Redis-backed Socket.IO adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // CORS
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
