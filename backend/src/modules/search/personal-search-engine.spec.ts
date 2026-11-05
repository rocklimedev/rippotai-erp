import {
  compileSearchFilter,
  evaluateSearch,
  highlightSearch,
} from './personal-search-engine';
import { SearchService } from './search.service';
import { GlobalSearchService } from './global-search.service';

describe('Personal search engine', () => {
  it('accepts the frontend global search request across every default index', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValue([
          {
            sequence_id: 1,
            index_name: 'leads',
            document_id: 'lead-a',
            document: {
              entity_type: 'lead',
              title: 'Katherine',
              is_deleted: false,
            },
          },
        ]),
    };
    const global = new GlobalSearchService(new SearchService(db as any));
    const result = await global.search(
      { q: 'Katherine', page: 1, pageSize: 20 },
      { id: 'admin', role: 'ADMIN' },
    );
    expect(result.total).toBe(1);
    expect(result.results[0].entity_type).toBe('lead');
    expect(db.query.mock.calls[0][1].replacements.indices).toContain('leads');
  });

  const query = (text: string, extra: any = {}) => ({
    multi_match: {
      query: text,
      fields: ['title^6', 'subtitle^3'],
      fuzziness: 'AUTO',
      ...extra,
    },
  });

  it('ranks weighted fields, folds accents and tolerates typos and transpositions', () => {
    expect(evaluateSearch({ title: 'Café plywood' }, query('cafe'))).toBe(6);
    expect(evaluateSearch({ title: 'plywood' }, query('plywodo'))).toBe(3);
    expect(evaluateSearch({ title: 'door' }, query('zz'))).toBeNull();
    expect(evaluateSearch({ subtitle: 'cafe' }, query('cafe'))).toBe(3);
  });

  it('supports multiword autocomplete prefixes', () => {
    expect(
      evaluateSearch(
        { title: 'Kitchen renovation' },
        query('kitchen ren', { type: 'bool_prefix' }),
      ),
    ).toBe(12);
    expect(
      evaluateSearch(
        { title: 'Bathroom renovation' },
        query('kitchen ren', { type: 'bool_prefix' }),
      ),
    ).toBeNull();
  });

  it('preserves field-specific address and material synonyms', () => {
    expect(
      evaluateSearch(
        { site_location: 'Park Road' },
        { multi_match: { query: 'rd', fields: ['site_location'] } },
        'projects',
      ),
    ).toBe(1);
    expect(
      evaluateSearch(
        { materials_summary: 'plywood panels' },
        { multi_match: { query: 'ply', fields: ['materials_summary'] } },
        'material_requirements',
      ),
    ).toBe(1);
    expect(
      evaluateSearch(
        { title: 'Park Road' },
        { multi_match: { query: 'rd', fields: ['title'] } },
        'projects',
      ),
    ).toBeNull();
  });

  it('applies scopes, deleted records, metadata and dates before counting', () => {
    const q = {
      bool: {
        must: [query('kitchen')],
        filter: [
          { terms: { project_id: ['a'] } },
          { term: { status: 'OPEN' } },
          { range: { updated_at: { gte: '2026-01-01' } } },
        ],
        must_not: [{ term: { is_deleted: true } }],
      },
    };
    const doc = {
      title: 'Kitchen',
      project_id: 'a',
      status: 'OPEN',
      updated_at: '2026-11-01',
      is_deleted: false,
    };
    expect(evaluateSearch(doc, q)).toBe(6);
    for (const patch of [
      { project_id: 'b' },
      { project_id: null },
      { is_deleted: true },
      { status: 'CLOSED' },
      { updated_at: '2025-01-01' },
    ])
      expect(evaluateSearch({ ...doc, ...patch }, q)).toBeNull();
    const params = {};
    const sql = compileSearchFilter(q, params);
    expect(sql).toContain('project_id IN (:filter');
    expect(sql).toContain('NOT');
    expect(sql).not.toContain('OPEN');
    expect(Object.values(params)).toContain('OPEN');
    expect(() => compileSearchFilter({ script: 'unsafe' }, {})).toThrow();
    expect(compileSearchFilter({ terms: { project_id: [] } }, {})).toBe('1=0');
  });

  it('escapes document markup while highlighting', () => {
    const result = highlightSearch(
      { title: '<script>Kitchen & bath</script>' },
      query('kitchen'),
      { fields: { title: {} } },
    );
    expect(result.title[0]).toContain('<em>Kitchen</em>');
    expect(result.title[0]).toContain('&lt;script&gt;');
    expect(result.title[0]).not.toContain('<script>');
  });

  it('counts all matches and facets across batches before paginating with bounded results', async () => {
    const docs = Array.from({ length: 625 }, (_, i) => ({
      sequence_id: i + 1,
      index_name: 'projects',
      document_id: String(i).padStart(4, '0'),
      document: {
        title: 'Kitchen',
        entity_type: 'project',
        project_id: 'a',
        updated_at: '2026-11-01',
      },
    }));
    const db = {
      query: jest.fn(async (_sql, options) =>
        docs
          .filter((r) => r.sequence_id > options.replacements.cursor)
          .slice(0, 500),
      ),
    };
    const service = new SearchService(db as any);
    const response = await service.search('projects', {
      from: 60,
      size: 20,
      query: query('kitchen'),
    });
    expect(response.hits.total.value).toBe(625);
    expect(response.hits.hits).toHaveLength(20);
    expect(response.hits.hits[0]._id).toBe('0060');
    expect(response.aggregations.entity_type.buckets).toEqual([
      { key: 'project', doc_count: 625 },
    ]);
    expect(db.query).toHaveBeenCalledTimes(2);
    await expect(service.search('*', {})).rejects.toThrow();
  });

  it('reports bulk failures without counting failed writes as indexed', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('database failure')),
    };
    const response = await new SearchService(db as any).bulk([
      { index: { _index: 'projects', _id: 'a' } },
      { title: 'A' },
      { index: { _index: 'projects', _id: 'b' } },
      { title: 'B' },
    ]);
    expect(response.errors).toBeTruthy();
    expect(response.items[1].index.error.reason).toBe('database failure');
  });
});
