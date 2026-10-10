import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth-guard';

function positiveInteger(config: ConfigService, key: string, fallback: number) {
  const value = Number(config.get(key) ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return value;
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: positiveInteger(config, 'RATE_LIMIT_TTL_MS', 60_000),
          limit: positiveInteger(config, 'RATE_LIMIT_MAX', 120),
        },
      ],
    }),
  ],
  providers: [
    // Rate limit before authenticating, including failed JWT requests.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class HttpSecurityModule {}
