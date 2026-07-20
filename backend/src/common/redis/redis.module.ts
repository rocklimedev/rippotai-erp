import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'redis'),
          port: config.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: null,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
