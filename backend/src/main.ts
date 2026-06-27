import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Improved CORS configuration
  app.enableCors({
    origin: [
      'https://vendors-quote.rippotaiarchitecture.com',
      'http://localhost:5173',
      // Add more as needed (e.g. for development),
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-other-frontend.rippotaiarchitecture.com',
    ],
    credentials: true, // Important if you're using cookies / Authorization headers
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'], // optional
    maxAge: 3600, // Cache preflight for 1 hour (optional but recommended)
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  console.log(`Rippotai ERP API running on http://localhost:${port}/api/v1`);
}
bootstrap();
