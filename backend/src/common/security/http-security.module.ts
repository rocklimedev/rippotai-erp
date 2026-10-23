import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth-guard';
import { PortalAccessGuard } from '../guards/portal-access.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AUTH_THROTTLE_KIND, trackerHash } from './auth-throttle.decorator';
import { DistributedSecurityModule } from './distributed-security.module';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { SecurityThrottlerGuard } from './security-throttler.guard';
import { HttpSecurityTelemetryService } from './http-security-telemetry.service';

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
      imports: [ConfigModule, DistributedSecurityModule],
      inject: [ConfigService, Reflector, RedisThrottlerStorage],
      useFactory: (
        config: ConfigService,
        reflector: Reflector,
        storage: RedisThrottlerStorage,
      ) => {
        trackerHash('startup', 'validate-configuration');
        // Validate route overrides at startup as well as when resolved by the guard.
        positiveInteger(config, 'AUTH_RATE_LIMIT_MAX', 10);
        positiveInteger(config, 'TOKEN_RATE_LIMIT_MAX', 120);
        return {
          storage,
          throttlers: [
            {
              name: 'default',
              ttl: positiveInteger(config, 'RATE_LIMIT_TTL_MS', 60_000),
              limit: positiveInteger(config, 'RATE_LIMIT_MAX', 120),
            },
            {
              name: 'auth-ip',
              ttl: positiveInteger(config, 'AUTH_RATE_LIMIT_TTL_MS', 60_000),
              limit: positiveInteger(config, 'AUTH_IP_RATE_LIMIT_MAX', 20),
              generateKey: (_context, tracker) =>
                trackerHash('auth-ip', tracker),
              skipIf: (context) =>
                reflector.getAllAndOverride<string>(AUTH_THROTTLE_KIND, [
                  context.getHandler(),
                  context.getClass(),
                ]) !== 'entry',
            },
          ],
        };
      },
    }),
  ],
  providers: [
    HttpSecurityTelemetryService,
    // Rate limit before authenticating, including failed JWT requests.
    { provide: APP_GUARD, useClass: SecurityThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PortalAccessGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [HttpSecurityTelemetryService],
})
export class HttpSecurityModule {}
