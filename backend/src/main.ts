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

  app.enableCors({
    origin: true, // or specify your frontend URL like 'http://localhost:5173'
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Rippotai ERP API running on http://localhost:${port}/api/v1`);
}

bootstrap();
