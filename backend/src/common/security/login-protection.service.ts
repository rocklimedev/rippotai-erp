import { HttpException, Injectable } from '@nestjs/common';
import { SecurityRedisService } from './security-redis.service';
import { trackerHash } from './auth-throttle.decorator';

export const LOGIN_FAILURE_SCRIPT = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
local blocked = tonumber(redis.call('HGET', KEYS[1], 'blocked')) or 0
if blocked > now then return blocked-now end
if ARGV[1] == 'check' then return 0 end
if ARGV[1] == 'success' then redis.call('DEL', KEYS[1]); return 0 end
local failures = redis.call('HINCRBY', KEYS[1], 'failures', 1)
local delay = 0
if failures >= 5 then delay = math.min(900000, 30000 * 2 ^ math.min(5, failures-5)) end
redis.call('HSET', KEYS[1], 'blocked', now+delay)
redis.call('PEXPIRE', KEYS[1], 900000)
return delay
`;

export class LoginLockoutException extends HttpException {
  constructor(readonly retryAfter: number) {
    super(
      {
        statusCode: 429,
        message: 'Too many sign-in attempts. Try again later.',
        retryAfter,
      },
      429,
    );
  }
}

@Injectable()
export class LoginProtectionService {
  constructor(private readonly redis: SecurityRedisService) {}
  private async run(email: string, operation: string) {
    const delay = Number(
      await this.redis.run(
        LOGIN_FAILURE_SCRIPT,
        [
          `security:login:v1:${trackerHash('login-account', email.trim().toLowerCase())}`,
        ],
        [operation],
      ),
    );
    if (delay > 0) throw new LoginLockoutException(Math.ceil(delay / 1000));
  }
  assertAllowed(email: string) {
    return this.run(email, 'check');
  }
  recordFailure(email: string) {
    return this.run(email, 'failure');
  }
  recordSuccess(email: string) {
    return this.run(email, 'success');
  }
}
