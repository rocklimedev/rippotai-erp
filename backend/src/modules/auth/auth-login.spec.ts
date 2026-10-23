import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'),
  compare: jest.fn(),
}));

describe('Login credential verification', () => {
  beforeEach(() => jest.clearAllMocks());

  function setup(user: unknown) {
    const findOne = jest.fn().mockResolvedValue(user);
    const model = { scope: jest.fn().mockReturnValue({ findOne }) };
    const tokens = { create: jest.fn() };
    const service = new AuthService(
      model as any,
      {} as any,
      tokens as any,
      {
        assertAllowed: jest.fn(),
        recordFailure: jest.fn(),
        recordSuccess: jest.fn(),
      } as any,
    );
    return { service, tokens };
  }

  it('awaits a cost-10 bcrypt comparison before rejecting an unknown email', async () => {
    let finish!: (valid: boolean) => void;
    const comparison = new Promise<boolean>((resolve) => {
      finish = resolve;
    });
    const compare = jest
      .mocked(bcrypt.compare)
      .mockReturnValue(comparison as never);
    const { service, tokens } = setup(null);
    let settled = false;
    const attempt = service.login('missing@example.com', 'password');
    const rejected = expect(attempt).rejects.toThrow('Invalid credentials');
    void attempt.catch(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(compare).toHaveBeenCalledTimes(1);
    const hash = compare.mock.calls[0][1] as string;
    expect(bcrypt.getRounds(hash)).toBe(10);
    expect(settled).toBe(false);
    // Even a matching dummy password must never authenticate a missing user.
    finish(true);
    await rejected;
    expect(tokens.create).not.toHaveBeenCalled();
  });

  it('compares the stored hash and rejects an incorrect password identically', async () => {
    const compare = jest
      .mocked(bcrypt.compare)
      .mockResolvedValue(false as never);
    const { service, tokens } = setup({ password_hash: 'stored-hash' });
    await expect(service.login('staff@example.com', 'wrong')).rejects.toThrow(
      new UnauthorizedException('Invalid credentials'),
    );
    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare).toHaveBeenCalledWith('wrong', 'stored-hash');
    expect(tokens.create).not.toHaveBeenCalled();
  });
});
