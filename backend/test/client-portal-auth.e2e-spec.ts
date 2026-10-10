import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { HttpSecurityModule } from '../src/common/security/http-security.module';
import {
  ClientPortalController,
  PublicClientController,
} from '../src/modules/client-portal/client-portal.controller';
import { ClientPortalService } from '../src/modules/client-portal/client-portal.service';

jest.mock('archiver', () => jest.fn());
jest.mock('../src/modules/cdn/cdn.service', () => ({ CdnService: class {} }));
jest.mock('../src/modules/engagement/notifications.service', () => ({
  NotificationsService: class {},
}));

describe('Global default-deny auth with public client links', () => {
  let app: any;
  const secret = 'client-portal-auth-test-secret';
  const valid = 'valid-client-link-with-enough-entropy';
  const expired = 'expired-client-link-with-enough-entropy';
  const revoked = 'revoked-client-link-with-enough-entropy';
  const wrongPurpose = 'view-only-client-link-with-enough-entropy';
  const hash = (value: string) =>
    createHash('sha256').update(value).digest('hex');
  const link = {
    id: 'link',
    project_id: 'project-a',
    purpose: 'boq_approval',
    target_id: 'boq-a',
    options_json: '{}',
    expires_at: new Date(Date.now() + 60_000),
    revoked_at: null,
  };
  const links = new Map([
    [hash(valid), link],
    [hash(expired), { ...link, expires_at: new Date(Date.now() - 60_000) }],
    [hash(revoked), { ...link, revoked_at: new Date() }],
    [hash(wrongPurpose), { ...link, purpose: 'project_view' }],
  ]);
  const service: any = Object.create(ClientPortalService.prototype);
  Object.assign(service, {
    select: jest.fn(async (sql, args = []) => {
      if (sql.includes('FROM client_links l'))
        return links.has(args[0]) ? [links.get(args[0])] : [];
      if (sql.includes('FROM boqs b'))
        return args[0] === 'boq-a' && args[1] === 'project-a'
          ? [
              {
                id: 'boq-a',
                title: 'Client BOQ',
                status: 'awaiting_approval',
                total_value: 100,
              },
            ]
          : [];
      if (sql.includes('FROM projects p'))
        return [{ id: 'project-a', name: 'Client project' }];
      return [];
    }),
    exec: jest.fn(),
    notifyStaff: jest.fn(),
    listLinks: jest.fn().mockResolvedValue([]),
    createLink: jest.fn(),
    revokeLink: jest.fn(),
  });

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
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true }),
        HttpSecurityModule,
      ],
      controllers: [ClientPortalController, PublicClientController],
      providers: [{ provide: ClientPortalService, useValue: service }],
    }).compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
  });

  it.each([
    ['get', '/client-links'],
    ['post', '/client-links'],
    ['post', '/client-links/link/revoke'],
    ['get', '/client-home'],
    ['get', '/projects/project-a/client-responses'],
    ['get', '/projects/project-a/handover-package-status'],
    ['post', '/projects/project-a/handover/prepare-package'],
    ['post', '/projects/project-a/handover/deliver'],
  ])('denies anonymous staff route %s %s', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
    expect(service.select).not.toHaveBeenCalled();
    expect(service.exec).not.toHaveBeenCalled();
  });

  it('accepts a staff JWT for staff routes', async () => {
    await request(app.getHttpServer())
      .get('/client-links')
      .set(
        'Authorization',
        `Bearer ${sign({ id: 'staff', roleName: 'STAFF', permissions: ['client-portal:read'] }, secret)}`,
      )
      .expect(200, []);
    expect(service.listLinks).toHaveBeenCalled();
  });

  it('serves a valid client landing and BOQ without a session JWT', async () => {
    await request(app.getHttpServer())
      .get(`/public/client/${valid}`)
      .expect(200);
    const response = await request(app.getHttpServer())
      .get(`/public/client/${valid}/boq/boq-a`)
      .expect(200);
    expect(response.body).toMatchObject({ id: 'boq-a', total_amount: 100 });
    expect(service.select).toHaveBeenCalledWith(
      expect.stringContaining('l.token_hash = ?'),
      [hash(valid)],
    );
  });

  it('allows a client approval using its valid link without a session JWT', async () => {
    await request(app.getHttpServer())
      .post(`/public/client/${valid}/boq/boq-a/approve`)
      .send({ signatory_name: 'Client', approved: true })
      .expect(201);
    expect(service.exec).toHaveBeenCalledWith(
      expect.stringContaining("status = 'approved'"),
      ['boq-a'],
    );
  });

  it.each([
    ['get', ''],
    ['get', '/boq/boq-a'],
    ['post', '/boq/boq-a/approve'],
    ['get', '/quotations/compare/comparison'],
    ['post', '/quotations/select'],
    ['get', '/handover'],
    ['post', '/handover/accept'],
    ['post', '/handover/snag'],
  ])(
    'preserves independent token validation on %s %s',
    async (method, path) => {
      for (const [token, status] of [
        ['invalid-but-long-client-token', 404],
        [expired, 410],
        [revoked, 410],
      ] as const) {
        await request(app.getHttpServer())
          [method](`/public/client/${token}${path}`)
          .send({})
          .expect(status);
      }
      expect(service.exec).not.toHaveBeenCalled();
    },
  );

  it('rejects a link used for another BOQ or a wrong-purpose approval', async () => {
    await request(app.getHttpServer())
      .get(`/public/client/${valid}/boq/boq-b`)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/public/client/${wrongPurpose}/boq/boq-a/approve`)
      .send({ signatory_name: 'Client', approved: true })
      .expect(403);
    expect(service.exec).not.toHaveBeenCalled();
  });
});
