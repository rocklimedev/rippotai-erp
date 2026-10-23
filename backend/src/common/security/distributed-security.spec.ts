import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { SecurityRedisService } from './security-redis.service';
import {
  LoginProtectionService,
  LoginLockoutException,
} from './login-protection.service';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';

describe('Distributed security failure behavior', () => {
  it('fails closed promptly when Redis is unavailable', async () => {
    const service = new SecurityRedisService(new ConfigService());
    (service as any).client.disconnect();
    await expect(service.run('return 1', [], [])).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    service.onModuleDestroy();
  });

  it('rejects a locked login before reading users or issuing sessions', async () => {
    const users = { scope: jest.fn() };
    const protection = {
      assertAllowed: jest.fn().mockRejectedValue(new LoginLockoutException(30)),
    };
    const service = new AuthService(
      users as any,
      {} as any,
      {} as any,
      protection as any,
    );
    await expect(
      service.login('user@example.test', 'password'),
    ).rejects.toBeInstanceOf(LoginLockoutException);
    expect(users.scope).not.toHaveBeenCalled();
  });

  it('passes the cooldown back through Retry-After without exposing the account', async () => {
    const controller = new AuthController(
      {
        login: jest.fn().mockRejectedValue(new LoginLockoutException(60)),
      } as any,
      {} as any,
      {} as any,
    );
    const response = { setHeader: jest.fn() };
    await expect(
      controller.login(
        { email: 'user@example.test', password: 'password' },
        response as any,
      ),
    ).rejects.toBeInstanceOf(LoginLockoutException);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', 60);
  });

  it('uses the same normalized account key for failed and successful logins', async () => {
    const previous = process.env.AUTH_TRACKER_SECRET;
    process.env.AUTH_TRACKER_SECRET = 'test-only-key';
    try {
      const redis = { run: jest.fn().mockResolvedValue(0) };
      const protection = new LoginProtectionService(redis as any);
      await protection.recordFailure(' User@example.test ');
      await protection.recordSuccess('user@example.test');
      expect(redis.run.mock.calls[0][1]).toEqual(redis.run.mock.calls[1][1]);
      expect(JSON.stringify(redis.run.mock.calls)).not.toContain(
        'user@example.test',
      );
    } finally {
      if (previous === undefined) delete process.env.AUTH_TRACKER_SECRET;
      else process.env.AUTH_TRACKER_SECRET = previous;
    }
  });
});
