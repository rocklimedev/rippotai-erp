import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { AuthTokensController } from './auth-tokens.controller';
import { AuthTokensService } from './auth-tokens.service';
import { AuthToken } from './models/auth-token.model';

describe('Session token administration', () => {
  let app: any;
  let service: AuthTokensService;
  const secret = 'session-administration-test-secret';
  const owner = { id: 'owner', roleName: 'USER' };
  const other = { id: 'other', roleName: 'USER' };
  const admin = { id: 'admin', roleName: 'ADMIN' };
  const data: any = {
    id: 'session',
    user_id: 'owner',
    token_hash: 'secret-hash',
    user: { password_hash: 'secret-password' },
    revoked_at: null,
  };
  const row = {
    user_id: 'owner',
    update: jest.fn(async (patch) => Object.assign(data, patch)),
    destroy: jest.fn(),
    get: (field: string) => data[field],
  };
  const model = {
    findAll: jest.fn().mockResolvedValue([{ id: 'session', user_id: 'owner' }]),
    findByPk: jest.fn().mockResolvedValue(row),
    update: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(async () => {
    passport.use(
      'jwt',
      new Strategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: secret,
        },
        (payload, done) => done(null, payload),
      ),
    );
    const module = await Test.createTestingModule({
      controllers: [AuthTokensController],
      providers: [
        AuthTokensService,
        { provide: getModelToken(AuthToken), useValue: model },
      ],
    }).compile();
    service = module.get(AuthTokensService);
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    data.revoked_at = null;
  });
  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
  });

  function call(method: string, path: string, actor?: object) {
    const req = request(app.getHttpServer())[method](`/auth/tokens/${path}`);
    return actor
      ? req.set('Authorization', `Bearer ${sign(actor, secret)}`)
      : req;
  }

  it.each([
    ['get', 'user/owner'],
    ['patch', 'session/revoke'],
    ['patch', 'user/owner/revoke-all'],
    ['delete', 'session'],
  ])('requires authentication for %s %s', async (method, path) => {
    await call(method, path).expect(401);
    expect(model.findAll).not.toHaveBeenCalled();
    expect(model.findByPk).not.toHaveBeenCalled();
    expect(model.update).not.toHaveBeenCalled();
  });

  it('allows own session lookup but rejects cross-user lookups before reading', async () => {
    await call('get', 'user/owner', other).expect(403);
    expect(model.findAll).not.toHaveBeenCalled();
    await call('get', 'user/owner', owner).expect(200);
    expect(model.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'owner' },
        raw: true,
        attributes: expect.not.arrayContaining(['token_hash']),
      }),
    );
    expect(model.findAll.mock.calls[0][0]).not.toHaveProperty('include');
  });

  it('rejects revoking another user session without mutation', async () => {
    await call('patch', 'session/revoke', other).expect(403);
    expect(row.update).not.toHaveBeenCalled();
    await call('patch', 'user/owner/revoke-all', other).expect(403);
    expect(model.update).not.toHaveBeenCalled();
  });

  it('revokes own sessions and returns only session metadata', async () => {
    const response = await call('patch', 'session/revoke', owner).expect(200);
    expect(row.update).toHaveBeenCalledWith({ revoked_at: expect.any(Date) });
    expect(response.body).toMatchObject({ id: 'session', user_id: 'owner' });
    expect(response.body).not.toHaveProperty('token_hash');
    expect(response.body).not.toHaveProperty('user');
    await call('patch', 'user/owner/revoke-all', owner).expect(200);
    expect(model.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: expect.objectContaining({ user_id: 'owner' }),
      }),
    );
  });

  it('only permits administrators to delete sessions', async () => {
    await call('delete', 'session', owner).expect(403);
    await call('delete', 'session', { ...owner, isAdmin: true }).expect(403);
    expect(model.findByPk).not.toHaveBeenCalled();
    expect(row.destroy).not.toHaveBeenCalled();
    await call('delete', 'session', admin).expect(204);
    expect(row.destroy).toHaveBeenCalledTimes(1);
  });

  it.each(['ADMIN', 'SUPERADMIN'])(
    'allows %s to manage another user sessions',
    async (roleName) => {
      const actor = { id: 'admin', roleName };
      await call('get', 'user/owner', actor).expect(200);
      await call('patch', 'session/revoke', actor).expect(200);
      await call('patch', 'user/owner/revoke-all', actor).expect(200);
    },
  );

  it('rejects null actors even with an administrator role', async () => {
    await call('get', 'user/owner', { id: null, roleName: 'ADMIN' }).expect(
      401,
    );
    await expect(service.deleteSession('session', null as any)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(model.findAll).not.toHaveBeenCalled();
    expect(row.destroy).not.toHaveBeenCalled();
  });

  it('removes direct token creation from the HTTP controller', async () => {
    await call('post', '', admin)
      .send({ user_id: 'other', token_hash: 'chosen' })
      .expect(404);
    expect(model.create).not.toHaveBeenCalled();
  });
});
