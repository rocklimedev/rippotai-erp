import { Test } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { SearchController } from './search.controller';
import { GlobalSearchService } from './global-search.service';
import { AutocompleteService } from './autocomplete.service';
import { SearchScopeService } from './search-scope.service';
import { SearchService } from './search.service';
import { searchScopeFilter } from './search-access';
import { Project } from '../projects/models/projects.model';
import { TeamMember } from '../users/models/team-member.model';
import { Op } from 'sequelize';

describe('Search authentication and project visibility', () => {
  let app: any;
  let global: GlobalSearchService;
  let autocomplete: AutocompleteService;
  const secret = 'search-security-test-secret';
  const user = { id: 'user-a', roleName: 'USER' };
  const fixtures = [
    {
      id: 'a',
      project_id: 'project-a',
      entity_type: 'boq',
      title: 'Visible',
      is_deleted: false,
    },
    {
      id: 'b',
      project_id: 'project-b',
      entity_type: 'boq',
      title: 'Hidden',
      is_deleted: false,
    },
    {
      id: 'unscoped',
      entity_type: 'boq',
      title: 'Missing project',
      is_deleted: false,
    },
    {
      id: 'deleted',
      project_id: 'project-a',
      entity_type: 'boq',
      title: 'Deleted',
      is_deleted: true,
    },
  ];
  const matches = (doc: any, clause: any): boolean => {
    if (clause.match_none) return false;
    if (clause.terms)
      return Object.entries(clause.terms).every(([key, values]: any) =>
        values.includes(doc[key]),
      );
    if (clause.term)
      return Object.entries(clause.term).every(
        ([key, value]) => doc[key] === value,
      );
    return true;
  };
  const es = {
    search: jest.fn(async (_indices, body) => {
      const docs = fixtures.filter(
        (doc) =>
          body.query.bool.filter.every((clause) => matches(doc, clause)) &&
          !(body.query.bool.must_not ?? []).some((clause) =>
            matches(doc, clause),
          ),
      );
      return {
        hits: {
          hits: docs.map((doc) => ({ _id: doc.id, _source: doc })),
          total: { value: docs.length },
        },
        aggregations: {
          entity_type: { buckets: [{ key: 'boq', doc_count: docs.length }] },
        },
      };
    }),
  };
  const members = {
    findAll: jest.fn().mockResolvedValue([{ owner_id: 'project-a' }]),
  };
  const projects = {
    findAll: jest.fn().mockResolvedValue([{ id: 'project-a' }]),
  };
  const reindex = jest.fn().mockResolvedValue({ indexed: 1 });

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
    const dependencies: any[] = Reflect.getMetadata(
      'design:paramtypes',
      SearchController,
    );
    const module = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        ...dependencies
          .filter(
            (type) =>
              ![
                GlobalSearchService,
                AutocompleteService,
                SearchScopeService,
              ].includes(type),
          )
          .map((type) => ({
            provide: type,
            useValue: { reindexAll: reindex },
          })),
        GlobalSearchService,
        AutocompleteService,
        SearchScopeService,
        { provide: SearchService, useValue: es },
        { provide: getModelToken(Project), useValue: projects },
        { provide: getModelToken(TeamMember), useValue: members },
      ],
    }).compile();
    global = module.get(GlobalSearchService);
    autocomplete = module.get(AutocompleteService);
    app = module.createNestApplication({ logger: false });
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
    passport.unuse('jwt');
  });

  function call(method: string, path: string, actor?: object) {
    const req = request(app.getHttpServer())[method](`/search${path}`);
    return actor
      ? req.set('Authorization', `Bearer ${sign(actor, secret)}`)
      : req;
  }

  it.each([
    '',
    '/suggest',
    '/projects',
    '/clients',
    '/users',
    '/leads',
    '/vendors',
    '/boqs',
    '/briefs',
    '/quotations',
    '/site-recces',
    '/tasks',
    '/calendar',
    '/documents',
    '/drawings',
    '/work-orders',
    '/delivery-challans',
    '/budget-estimates',
    '/health',
  ])('denies anonymous GET %s', async (path) => {
    await call('get', `${path}?q=visible`).expect(401);
    expect(es.search).not.toHaveBeenCalled();
  });

  it.each(['/reindex/all', '/reindex/projects'])(
    'requires an authenticated administrator for %s',
    async (path) => {
      await call('post', path).expect(401);
      await call('post', path, user).expect(403);
      await call('post', path, {
        ...user,
        isAdmin: true,
        role: 'ADMIN',
      }).expect(403);
      expect(reindex).not.toHaveBeenCalled();
      await call('post', path, { id: 'admin', roleName: 'ADMIN' }).expect(201);
      expect(reindex).toHaveBeenCalled();
    },
  );

  it('applies scope to results, counts, facets, autocomplete and entity routes', async () => {
    const response = await call('get', '?q=visible', user).expect(200);
    expect(response.body.results.map((hit) => hit.id)).toEqual(['a']);
    expect(response.body.total).toBe(1);
    expect(response.body.facets.entity_type.boq).toBe(1);
    const suggestions = await call('get', '/suggest?q=visible', user).expect(
      200,
    );
    expect(suggestions.body.suggestions.map((hit) => hit.id)).toEqual(['a']);
    const entity = await call('get', '/boqs?q=visible', user).expect(200);
    expect(entity.body.map((hit) => hit.id)).toEqual(['a']);
    expect(projects.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          [Op.or]: [
            { created_by: 'user-a' },
            { id: { [Op.in]: ['project-a'] } },
          ],
        }),
      }),
    );
  });

  it('does not trust supplied project IDs or permit cross-project filters', async () => {
    const actor = {
      ...user,
      projectIds: ['project-b'],
      allowedProjectIds: ['project-b'],
    };
    const response = await call(
      'get',
      '?q=visible&projectId=project-b',
      actor,
    ).expect(200);
    expect(response.body.results).toEqual([]);
    expect(es.search.mock.calls.at(-1)![1].query.bool.filter).toContainEqual({
      terms: { project_id: ['project-a'] },
    });
  });

  it('fails closed for absent principal or scope; an explicit empty scope matches nothing', async () => {
    expect(() => searchScopeFilter(null as any)).toThrow(UnauthorizedException);
    expect(() => searchScopeFilter({ id: 'user' })).toThrow(ForbiddenException);
    expect(() =>
      searchScopeFilter({ id: 'user', projectIds: [null] as any }),
    ).toThrow(ForbiddenException);
    expect(searchScopeFilter({ id: 'user', projectIds: [] })).toEqual({
      match_none: {},
    });
    await expect(global.search({}, { id: 'user' })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(autocomplete.suggest({ q: '' }, null as any)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(es.search).not.toHaveBeenCalled();
  });

  it('rejects arbitrary index selection', async () => {
    await call('get', '?types=*', user).expect(400);
    await call('get', '?types=.security', {
      id: 'admin',
      roleName: 'ADMIN',
    }).expect(400);
    expect(es.search).not.toHaveBeenCalled();
  });

  it('returns no data for users with no projects, and does not search if scope lookup fails', async () => {
    projects.findAll.mockResolvedValueOnce([]);
    const response = await call('get', '?q=visible', user).expect(200);
    expect(response.body.results).toEqual([]);
    projects.findAll.mockRejectedValueOnce(new Error('Scope database unavailable'));
    es.search.mockClear();
    await call('get', '/suggest?q=visible', user).expect(500);
    expect(es.search).not.toHaveBeenCalled();
  });

  it('administrators can search across projects, while deleted records require explicit opt-in', async () => {
    const actor = { id: 'admin', roleName: 'SUPERADMIN' };
    const result = await call('get', '?q=visible', actor).expect(200);
    expect(result.body.results.map((hit) => hit.id)).toEqual([
      'a',
      'b',
      'unscoped',
    ]);
    expect(projects.findAll).not.toHaveBeenCalled();
    expect(members.findAll).not.toHaveBeenCalled();
    const all = await global.search(
      { includeDeleted: true },
      { id: 'admin', role: 'SUPERADMIN' },
    );
    expect(all.results).toHaveLength(4);
  });
});
