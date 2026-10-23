import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { createAuthenticatedFetch, withSessionExpiry } from './authenticated-fetch.js';
import { subscribeSessionNavigation } from './session-navigation.js';

const apiBase = 'https://erp.test/api';
function setup(network = async () => Response.json({ ok: true })) {
  let token = 'old-token';
  let clears = 0;
  const events = new EventTarget();
  const navigations = [];
  const unsubscribe = subscribeSessionNavigation((...args) => navigations.push(args), events);
  const session = { getToken: () => token, clearSession: () => {
    token = null; clears++;
    events.dispatchEvent(new Event('bc:session-ended'));
  } };
  const requests = [];
  const fetch = createAuthenticatedFetch({ apiBase, ...session, fetchImpl: async request => {
    requests.push(request); return network(request);
  } });
  return { fetch, session, requests, navigations, unsubscribe,
    setToken: value => { token = value; }, get clears() { return clears; } };
}
const queryApi = () => ({ signal: new AbortController().signal, dispatch() {}, getState: () => ({}) });

test('RTK 401 clears auth once and navigates with router replacement', async () => {
  const env = setup(async () => Response.json({ message: 'Unauthorized' }, { status: 401 }));
  const query = withSessionExpiry(fetchBaseQuery({ baseUrl: `${apiBase}/v1`, fetchFn: env.fetch }), env.session);
  const results = await Promise.all(Array.from({ length: 5 }, () => query('/users', queryApi(), {})));
  assert.ok(results.every(result => result.error.status === 401));
  assert.equal(env.clears, 1);
  assert.deepEqual(env.navigations, [['/login', { replace: true }]]);
  assert.ok(env.requests.every(request => request.credentials === 'omit'));
  env.unsubscribe();
});

test('axios facade uses the same fetch transport, bearer header and 401 behavior', async () => {
  const env = setup(async () => Response.json({ message: 'Unauthorized' }, { status: 401 }));
  const client = axios.create({ baseURL: apiBase, adapter: 'fetch', env: { fetch: env.fetch }, withCredentials: false });
  await assert.rejects(client.get('/v1/users'), error => error.response.status === 401);
  assert.equal(env.requests[0].headers.get('Authorization'), 'Bearer old-token');
  assert.equal(env.requests[0].credentials, 'omit');
  assert.equal(env.clears, 1);
  assert.deepEqual(env.navigations, [['/login', { replace: true }]]);
  env.unsubscribe();
});

test('late 401 from an earlier session cannot clear a new login', async () => {
  let release;
  const env = setup(() => new Promise(resolve => { release = resolve; }));
  const query = withSessionExpiry(fetchBaseQuery({ baseUrl: `${apiBase}/v1`, fetchFn: env.fetch }), env.session);
  const pending = query('/users', queryApi(), {});
  while (!release) await new Promise(resolve => setImmediate(resolve));
  env.setToken('new-token');
  release(Response.json({}, { status: 401 }));
  await pending;
  assert.equal(env.clears, 0);
  assert.equal(env.session.getToken(), 'new-token');
  env.unsubscribe();
});

test('login credential errors without a session remain ordinary errors', async () => {
  const env = setup(async () => Response.json({}, { status: 401 }));
  env.setToken(null);
  await env.fetch(`${apiBase}/v1/auth/login`, { method: 'POST' });
  assert.equal(env.clears, 0);
  assert.equal(env.navigations.length, 0);
  env.unsubscribe();
});

test('RTK explicit old-token requests cannot expire the current session', async () => {
  const env = setup(async () => Response.json({}, { status: 401 }));
  env.setToken('new-token');
  const query = withSessionExpiry(fetchBaseQuery({ baseUrl: `${apiBase}/v1`, fetchFn: env.fetch }), env.session);
  await query({ url: '/auth/logout', method: 'POST', headers: { Authorization: 'Bearer old-token' } }, queryApi(), {});
  assert.equal(env.session.getToken(), 'new-token');
  assert.equal(env.clears, 0);
  env.unsubscribe();
});

test('403 responses do not end an authenticated session', async () => {
  const env = setup(async () => Response.json({}, { status: 403 }));
  await env.fetch(`${apiBase}/v1/users`);
  assert.equal(env.clears, 0);
  env.unsubscribe();
});

test('does not attach staff tokens or log out for unrelated URLs', async () => {
  const env = setup(async () => Response.json({}, { status: 401 }));
  await env.fetch('https://files.test/private-file');
  await env.fetch('https://erp.test/api-other/resource');
  assert.ok(env.requests.every(request => !request.headers.has('Authorization')));
  assert.equal(env.clears, 0);
  env.unsubscribe();
});

test('preserves explicit tokens and abort signals while overriding cookie credentials', async () => {
  const env = setup();
  const controller = new AbortController();
  await env.fetch(`${apiBase}/v1/auth/logout`, { headers: { Authorization: 'Bearer explicit-token' }, signal: controller.signal, credentials: 'include' });
  assert.equal(env.requests[0].headers.get('Authorization'), 'Bearer explicit-token');
  assert.equal(env.requests[0].credentials, 'omit');
  controller.abort();
  assert.equal(env.requests[0].signal.aborted, true);
  env.unsubscribe();
});

test('axios compatibility preserves FormData uploads and blob responses', async () => {
  const env = setup(async request => {
    const form = await request.formData();
    assert.equal(await form.get('file').text(), 'file content');
    return new Response('download content', { headers: { 'Content-Type': 'application/pdf' } });
  });
  const client = axios.create({ baseURL: apiBase, adapter: 'fetch', env: { fetch: env.fetch } });
  const form = new FormData();
  form.append('file', new Blob(['file content']), 'document.txt');
  // Node's axios platform does not perform the browser's automatic FormData
  // content-type clearing. Unset it explicitly to exercise the same request.
  const response = await client.post('/v1/documents', form, { responseType: 'blob', headers: { 'Content-Type': null } });
  assert.equal(await response.data.text(), 'download content');
  env.unsubscribe();
});

test('base query wrapper handles a non-JSON 401 parser error', async () => {
  const env = setup();
  const query = withSessionExpiry(async () => ({ error: { status: 'PARSING_ERROR', originalStatus: 401 } }), env.session);
  await query();
  assert.equal(env.clears, 1);
  env.unsubscribe();
});

test('router event subscription is removed when its component unmounts', () => {
  const env = setup();
  env.unsubscribe();
  env.session.clearSession();
  assert.deepEqual(env.navigations, []);
});
