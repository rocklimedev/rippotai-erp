import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { SecurityRedisService } from './security-redis.service';

// One hash / one atomic script: counter expiry and a longer blocking period
// cannot race across replicas. All times come from Redis, not container clocks.
export const RATE_LIMIT_SCRIPT = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
local values = redis.call('HMGET', KEYS[1], 'hits', 'expires', 'blocked')
local hits = tonumber(values[1]) or 0
local expires = tonumber(values[2]) or 0
local blocked = tonumber(values[3]) or 0
if blocked > now then return {hits, math.max(0, expires-now), 1, blocked-now} end
if blocked > 0 or expires <= now then hits = 0; expires = now + tonumber(ARGV[1]) end
hits = hits + 1
blocked = 0
if hits > tonumber(ARGV[2]) then blocked = now + tonumber(ARGV[3]) end
redis.call('HSET', KEYS[1], 'hits', hits, 'expires', expires, 'blocked', blocked)
redis.call('PEXPIRE', KEYS[1], math.max(expires, blocked)-now)
return {hits, expires-now, blocked > now and 1 or 0, math.max(0, blocked-now)}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: SecurityRedisService) {}
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _name: string,
  ) {
    const [totalHits, expires, blocked, blockExpires] = (await this.redis.run(
      RATE_LIMIT_SCRIPT,
      [`security:throttle:v1:${key}`],
      [ttl, limit, blockDuration],
    )) as number[];
    return {
      totalHits,
      timeToExpire: Math.ceil(expires / 1000),
      isBlocked: blocked === 1,
      timeToBlockExpire: Math.ceil(blockExpires / 1000),
    };
  }
}
