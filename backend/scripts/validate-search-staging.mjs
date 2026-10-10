// Read-only validation: no indexing or successful reindex calls are performed.
import assert from 'node:assert/strict';

const required = [
  'SEARCH_STAGING_API_URL', 'SEARCH_STAGING_ES_URL', 'SEARCH_STAGING_ES_API_KEY',
  'SEARCH_STAGING_USER_A_TOKEN', 'SEARCH_STAGING_USER_B_TOKEN',
  'SEARCH_STAGING_PROJECT_A', 'SEARCH_STAGING_PROJECT_B',
  'SEARCH_STAGING_BOQ_A', 'SEARCH_STAGING_BOQ_B', 'SEARCH_STAGING_FIXTURE_QUERY',
];
for (const key of required) assert.ok(process.env[key], `Missing ${key}`);
const env = process.env;
assert.notEqual(env.SEARCH_STAGING_PROJECT_A, env.SEARCH_STAGING_PROJECT_B);
const api = env.SEARCH_STAGING_API_URL.replace(/\/$/, ''); // Includes /api/v1.
const es = env.SEARCH_STAGING_ES_URL.replace(/\/$/, '');
async function apiCall(path, token, method = 'GET') {
  const response = await fetch(`${api}/search${path}`, {
    method, headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, body: await response.json() };
}
for (const path of ['', '/suggest?q=test', '/boqs?q=test']) {
  assert.equal((await apiCall(path)).status, 401);
}
// Calls are intentionally unauthorized, and therefore must never start a job.
for (const path of ['/reindex/all', '/reindex/projects']) {
  assert.equal((await apiCall(path, undefined, 'POST')).status, 401);
  assert.equal((await apiCall(path, env.SEARCH_STAGING_USER_A_TOKEN, 'POST')).status, 403);
}

const marker = encodeURIComponent(env.SEARCH_STAGING_FIXTURE_QUERY);
for (const [token, ownProject, otherProject, ownBoq, otherBoq] of [
  [env.SEARCH_STAGING_USER_A_TOKEN, env.SEARCH_STAGING_PROJECT_A, env.SEARCH_STAGING_PROJECT_B, env.SEARCH_STAGING_BOQ_A, env.SEARCH_STAGING_BOQ_B],
  [env.SEARCH_STAGING_USER_B_TOKEN, env.SEARCH_STAGING_PROJECT_B, env.SEARCH_STAGING_PROJECT_A, env.SEARCH_STAGING_BOQ_B, env.SEARCH_STAGING_BOQ_A],
]) {
  const own = await apiCall(`?types=boq&q=${marker}&projectId=${encodeURIComponent(ownProject)}`, token);
  assert.equal(own.status, 200);
  assert.ok(own.body.results.some((hit) => hit.id === ownBoq), 'Expected visible fixture missing');
  assert.ok(own.body.results.every((hit) => hit.meta.project_id === ownProject));
  const other = await apiCall(`?types=boq&q=${marker}&projectId=${encodeURIComponent(otherProject)}`, token);
  assert.equal(other.status, 200);
  assert.equal(other.body.total, 0);
  assert.deepEqual(other.body.results, []);
  assert.ok(Object.values(other.body.facets.entity_type ?? {}).every((count) => count === 0));
  const entity = await apiCall(`/boqs?q=${marker}`, token);
  assert.equal(entity.status, 200);
  assert.ok(entity.body.some((hit) => hit.id === ownBoq));
  assert.ok(!entity.body.some((hit) => hit.id === otherBoq));
  const suggest = await apiCall(`/suggest?q=${marker}`, token);
  assert.equal(suggest.status, 200);
  assert.ok(suggest.body.suggestions.some((hit) => hit.id === ownBoq));
  assert.ok(!suggest.body.suggestions.some((hit) => hit.id === otherBoq));
}

const indices = ['projects', 'clients', 'users', 'leads', 'vendors', 'boqs', 'project_briefs',
  'quotations', 'site_recces', 'tasks', 'calendar_events', 'documents', 'drawings',
  'work_orders', 'material_requirements', 'delivery_challans', 'budget_estimates', 'activity_logs'];
const projectIndices = new Set(indices.filter((index) => !['clients', 'users', 'leads', 'vendors'].includes(index)));
const audit = [];
async function esCall(path, body) {
  const response = await fetch(`${es}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `ApiKey ${env.SEARCH_STAGING_ES_API_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) return null;
  assert.ok(response.ok, `Elasticsearch request failed with status ${response.status}`);
  return response.json();
}
for (const index of indices) {
  const mapping = await esCall(`${index}/_mapping`);
  if (!mapping) { audit.push({ index, exists: false }); continue; }
  const properties = Object.values(mapping)[0].mappings.properties ?? {};
  assert.equal(properties.project_id?.type, 'keyword', `Invalid project_id mapping: ${index}`);
  const names = [];
  function fields(props, prefix = '') {
    for (const [name, value] of Object.entries(props)) {
      names.push(`${prefix}${name}`);
      if (value.properties) fields(value.properties, `${prefix}${name}.`);
    }
  }
  fields(properties);
  const sensitive = names.filter((name) => /password|token_hash|secret|api_key|access_token|refresh_token/i.test(name));
  assert.deepEqual(sensitive, [], `Sensitive credential fields indexed in ${index}`);
  const data = await esCall(`${index}/_search`, {
    size: 0, track_total_hits: true,
    aggs: {
      missingProject: { filter: { bool: { must_not: { exists: { field: 'project_id' } } } } },
      visibility: { terms: { field: 'visibility', size: 20 } },
    },
  });
  audit.push({ index, exists: true, total: data.hits.total.value,
    missingProject: data.aggregations.missingProject.doc_count,
    projectScoped: projectIndices.has(index), fields: names,
    visibility: data.aggregations.visibility.buckets.map(({ key, doc_count }) => ({ key, count: doc_count })),
  });
}
// Counts and schema only; credentials, indexed text and personal records are never printed.
console.log(JSON.stringify({ permissionChecks: 'passed', indexAudit: audit }, null, 2));
