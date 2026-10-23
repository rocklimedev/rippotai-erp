import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityRedisService } from './security-redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { LoginProtectionService } from './login-protection.service';

@Module({
  imports: [ConfigModule],
  providers: [
    SecurityRedisService,
    RedisThrottlerStorage,
    LoginProtectionService,
  ],
  exports: [RedisThrottlerStorage, LoginProtectionService],
})
export class DistributedSecurityModule {}
