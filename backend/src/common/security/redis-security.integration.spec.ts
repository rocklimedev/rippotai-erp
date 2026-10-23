import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { SecurityRedisService } from './security-redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import {
  LoginProtectionService,
  LoginLockoutException,
} from './login-protection.service';
import { trackerHash, authTracker } from './auth-throttle.decorator';

// Opt in explicitly; this only writes random, expiring test keys. Never FLUSHDB.
const integration =
  process.env.RUN_REDIS_SECURITY_TESTS === '1' ? describe : describe.skip;
integration('Shared Redis security counters', () => {
  let first: SecurityRedisService;
  let second: SecurityRedisService;
  const keys = new Set<string>();
  const secret = process.env.AUTH_TRACKER_SECRET;
  beforeAll(() => {
    process.env.AUTH_TRACKER_SECRET = 'integration-test-shared-tracker-secret';
    first = new SecurityRedisService(new ConfigService());
    second = new SecurityRedisService(new ConfigService());
  });
  afterAll(async () => {
    for (const key of keys) await (first as any).client.del(key);
    first.onModuleDestroy();
    second.onModuleDestroy();
    if (secret === undefined) delete process.env.AUTH_TRACKER_SECRET;
    else process.env.AUTH_TRACKER_SECRET = secret;
  });

  it('enforces one atomic budget across two replicas under concurrent requests', async () => {
    const key = randomUUID();
    keys.add(`security:throttle:v1:${key}`);
    const replicas = [
      new RedisThrottlerStorage(first),
      new RedisThrottlerStorage(second),
    ];
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        replicas[index % 2].increment(key, 10000, 20, 10000, 'auth-ip'),
      ),
    );
    expect(results.filter((result) => !result.isBlocked)).toHaveLength(20);
    expect(results.filter((result) => result.isBlocked)).toHaveLength(10);
    expect(results.at(-1)!.timeToBlockExpire).toBeGreaterThan(0);
    expect(
      await (first as any).client.pttl(`security:throttle:v1:${key}`),
    ).toBeGreaterThan(0);
  });

  it('expires exhausted counters and admits new requests after the block', async () => {
    const key = randomUUID();
    keys.add(`security:throttle:v1:${key}`);
    const storage = new RedisThrottlerStorage(first);
    expect((await storage.increment(key, 50, 1, 50, 'test')).isBlocked).toBe(
      false,
    );
    expect((await storage.increment(key, 50, 1, 50, 'test')).isBlocked).toBe(
      true,
    );
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(
      (
        await new RedisThrottlerStorage(second).increment(
          key,
          50,
          1,
          50,
          'test',
        )
      ).isBlocked,
    ).toBe(false);
  });

  it('shares progressive account cooldowns independently of client IP', async () => {
    const email = `${randomUUID()}@example.test`;
    const key = `security:login:v1:${trackerHash('login-account', email)}`;
    keys.add(key);
    const protection = new LoginProtectionService(first);
    const replica = new LoginProtectionService(second);
    for (let index = 0; index < 4; index++)
      await protection.recordFailure(email);
    await expect(
      replica.recordFailure(` ${email.toUpperCase()} `),
    ).rejects.toMatchObject({ retryAfter: 30 });
    await expect(protection.assertAllowed(email)).rejects.toBeInstanceOf(
      LoginLockoutException,
    );
    // Simulate completion of each cooldown without waiting minutes in tests.
    await (first as any).client.hset(key, 'blocked', 0);
    await expect(protection.recordFailure(email)).rejects.toMatchObject({
      retryAfter: 60,
    });
    await (first as any).client.hset(key, 'blocked', 0);
    await expect(replica.recordFailure(email)).rejects.toMatchObject({
      retryAfter: 120,
    });
    for (let index = 0; index < 8; index++) {
      await (first as any).client.hset(key, 'blocked', 0);
      await replica
        .recordFailure(email)
        .catch((error) => expect(error.retryAfter).toBeLessThanOrEqual(900));
    }
    expect(key).not.toContain(email);
    expect(await (first as any).client.pttl(key)).toBeLessThanOrEqual(900000);
  });

  it('clears prior failures after successful authentication, but never clears an active lock', async () => {
    const email = `${randomUUID()}@example.test`;
    const key = `security:login:v1:${trackerHash('login-account', email)}`;
    keys.add(key);
    const protection = new LoginProtectionService(first);
    for (let index = 0; index < 4; index++)
      await protection.recordFailure(email);
    await protection.recordSuccess(email);
    expect(await (first as any).client.exists(key)).toBe(0);
    for (let index = 0; index < 5; index++)
      await protection.recordFailure(email).catch(() => {});
    await expect(protection.recordSuccess(email)).rejects.toBeInstanceOf(
      LoginLockoutException,
    );
  });

  it('uses deterministic private tracker keys across service/module reloads', () => {
    const request = { ip: '192.0.2.1', body: { email: 'user@example.test' } };
    const firstKey = authTracker(request);
    jest.isolateModules(() => {
      expect(require('./auth-throttle.decorator').authTracker(request)).toBe(
        firstKey,
      );
    });
    expect(firstKey).not.toContain('user@example.test');
  });
});
