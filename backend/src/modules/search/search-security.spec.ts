import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { SearchController } from './search.controller';
import { GlobalSearchService } from './global-search.service';
import { AutocompleteService } from './autocomplete.service';
import { SearchService } from './search.service';

describe('Search authentication and global visibility', () => {
  let app: any;
  let global: GlobalSearchService;
  let autocomplete: AutocompleteService;
  const secret = 'search-security-test-secret';
  const user = { id: 'user-a', roleName: 'DEVELOPER' };
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
  const engine = {
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
              ].includes(type),
          )
          .map((type) => ({
            provide: type,
            useValue: { reindexAll: reindex },
          })),
        GlobalSearchService,
        AutocompleteService,
        { provide: SearchService, useValue: engine },
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
    expect(engine.search).not.toHaveBeenCalled();
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

  it('returns global results, counts, facets, suggestions and entity hits for a developer', async () => {
    const ids = ['a', 'b', 'unscoped'];
    const response = await call('get', '?q=visible', user).expect(200);
    expect(response.body.results.map((hit) => hit.id)).toEqual(ids);
    expect(response.body.total).toBe(3);
    expect(response.body.facets.entity_type.boq).toBe(3);
    const suggestions = await call('get', '/suggest?q=visible', user).expect(200);
    expect(suggestions.body.suggestions.map((hit) => hit.id)).toEqual(ids);
    const entity = await call('get', '/boqs?q=visible', user).expect(200);
    expect(entity.body.map((hit) => hit.id)).toEqual(ids);
  });

  it('allows developers to filter global results by project', async () => {
    const response = await call('get', '?q=visible&projectId=project-b', user).expect(200);
    expect(response.body.results.map((hit) => hit.id)).toEqual(['b']);
  });

  it('requires a principal in the search services', async () => {
    await expect(global.search({}, null as any)).rejects.toThrow(UnauthorizedException);
    await expect(autocomplete.suggest({ q: '' }, null as any)).rejects.toThrow(UnauthorizedException);
    expect(engine.search).not.toHaveBeenCalled();
  });

  it('rejects arbitrary index selection', async () => {
    await call('get', '?types=*', user).expect(400);
    await call('get', '?types=.security', {
      id: 'admin',
      roleName: 'ADMIN',
    }).expect(400);
    expect(engine.search).not.toHaveBeenCalled();
  });

  it('administrators can search across projects, while deleted records require explicit opt-in', async () => {
    const actor = { id: 'admin', roleName: 'SUPERADMIN' };
    const result = await call('get', '?q=visible', actor).expect(200);
    expect(result.body.results.map((hit) => hit.id)).toEqual([
      'a',
      'b',
      'unscoped',
    ]);
    const all = await global.search(
      { includeDeleted: true },
      { id: 'admin', role: 'SUPERADMIN' },
    );
    expect(all.results).toHaveLength(4);
  });
});
