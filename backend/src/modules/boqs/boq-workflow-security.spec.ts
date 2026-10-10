import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { BoqController } from './boq.controller';
import { BoqService } from './boq.service';
import { BoqExportService } from './boq-export.service';
import { BoqDashboardService } from './boq-dashboard.service';
import { BoqStatus } from '../../common/enums/boq-enums';

jest.mock('./boq-export.service', () => ({ BoqExportService: class {} }));

describe('BOQ workflow authorization', () => {
  let app: any;
  const secret = 'boq-workflow-test-secret';
  const boq = { title: 'Test', status: BoqStatus.DRAFT, update: jest.fn() };
  const service: any = Object.create(BoqService.prototype);
  Object.assign(service, {
    getOrThrow: jest.fn().mockResolvedValue(boq),
    findOne: jest.fn().mockResolvedValue({ id: 'boq' }),
    activity: { log: jest.fn() },
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
      controllers: [BoqController],
      providers: [
        { provide: BoqService, useValue: service },
        { provide: BoqExportService, useValue: {} },
        { provide: BoqDashboardService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
  });

  it.each([
    ['submit-for-approval', 'boq:submit', BoqStatus.DRAFT],
    ['approve', 'boq:approve', BoqStatus.AWAITING_APPROVAL],
  ])(
    'protects %s and records its authenticated actor',
    async (route, permission, status) => {
      boq.status = status;
      const post = (user?: object) => {
        const req = request(app.getHttpServer())
          .post(`/boqs/boq/${route}`)
          .send({});
        return user
          ? req.set('Authorization', `Bearer ${sign(user, secret)}`)
          : req;
      };
      await post().expect(401);
      await post({ id: 'actor', permissions: [] }).expect(403);
      await post({ id: 'actor', permissions: ['boq:read'] }).expect(403);
      await post({
        id: 'actor',
        permissions: [
          permission === 'boq:submit' ? 'boq:approve' : 'boq:submit',
        ],
      }).expect(403);
      await post({ id: null, permissions: [permission] }).expect(401);
      expect(service.getOrThrow).not.toHaveBeenCalled();
      expect(boq.update).not.toHaveBeenCalled();
      expect(service.activity.log).not.toHaveBeenCalled();
      await post({ id: 'actor', permissions: [permission] }).expect(201);
      expect(boq.update).toHaveBeenCalledWith(
        expect.objectContaining(
          route === 'approve'
            ? {
                approved_by: 'actor',
                status: BoqStatus.APPROVED,
                locked: true,
                approved_at: expect.any(Date),
              }
            : { updated_by: 'actor', status: BoqStatus.AWAITING_APPROVAL },
        ),
      );
      expect(service.activity.log).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'actor' }),
      );
    },
  );

  it.each([undefined, null, '', '   '])(
    'rejects missing service actors (%s) before reading or mutating',
    async (actor) => {
      await expect(service.submitForApproval('boq', {}, actor)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.approve('boq', {}, actor)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.getOrThrow).not.toHaveBeenCalled();
      expect(boq.update).not.toHaveBeenCalled();
    },
  );
});
