// Read-only validation: no indexing or successful reindex calls are performed.
import assert from 'node:assert/strict';

const required = [
  'SEARCH_STAGING_API_URL',
  'SEARCH_STAGING_USER_A_TOKEN',
  'SEARCH_STAGING_USER_B_TOKEN',
  'SEARCH_STAGING_PROJECT_A',
  'SEARCH_STAGING_PROJECT_B',
  'SEARCH_STAGING_BOQ_A',
  'SEARCH_STAGING_BOQ_B',
  'SEARCH_STAGING_FIXTURE_QUERY',
];
for (const key of required) assert.ok(process.env[key], `Missing ${key}`);
const env = process.env;
assert.notEqual(env.SEARCH_STAGING_PROJECT_A, env.SEARCH_STAGING_PROJECT_B);
const api = env.SEARCH_STAGING_API_URL.replace(/\/$/, ''); // Includes /api/v1.
async function apiCall(path, token, method = 'GET') {
  const response = await fetch(`${api}/search${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  assert.equal(
    (await apiCall(path, env.SEARCH_STAGING_USER_A_TOKEN, 'POST')).status,
    403,
  );
}

const marker = encodeURIComponent(env.SEARCH_STAGING_FIXTURE_QUERY);
for (const [token, ownProject, otherProject, ownBoq, otherBoq] of [
  [
    env.SEARCH_STAGING_USER_A_TOKEN,
    env.SEARCH_STAGING_PROJECT_A,
    env.SEARCH_STAGING_PROJECT_B,
    env.SEARCH_STAGING_BOQ_A,
    env.SEARCH_STAGING_BOQ_B,
  ],
  [
    env.SEARCH_STAGING_USER_B_TOKEN,
    env.SEARCH_STAGING_PROJECT_B,
    env.SEARCH_STAGING_PROJECT_A,
    env.SEARCH_STAGING_BOQ_B,
    env.SEARCH_STAGING_BOQ_A,
  ],
]) {
  const own = await apiCall(
    `?types=boq&q=${marker}&projectId=${encodeURIComponent(ownProject)}`,
    token,
  );
  assert.equal(own.status, 200);
  assert.ok(
    own.body.results.some((hit) => hit.id === ownBoq),
    'Expected visible fixture missing',
  );
  assert.ok(
    own.body.results.every((hit) => hit.meta.project_id === ownProject),
  );
  const other = await apiCall(
    `?types=boq&q=${marker}&projectId=${encodeURIComponent(otherProject)}`,
    token,
  );
  assert.equal(other.status, 200);
  assert.ok(other.body.results.some((hit) => hit.id === otherBoq));
  assert.ok(other.body.results.every((hit) => hit.meta.project_id === otherProject));
  const entity = await apiCall(`/boqs?q=${marker}`, token);
  assert.equal(entity.status, 200);
  assert.ok(entity.body.some((hit) => hit.id === ownBoq));
  assert.ok(entity.body.some((hit) => hit.id === otherBoq));
  const suggest = await apiCall(`/suggest?q=${marker}`, token);
  assert.equal(suggest.status, 200);
  assert.ok(suggest.body.suggestions.some((hit) => hit.id === ownBoq));
  assert.ok(suggest.body.suggestions.some((hit) => hit.id === otherBoq));
}

console.log(JSON.stringify({ permissionChecks: 'passed', engine: 'mysql' }, null, 2));
