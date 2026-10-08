import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';

// Execute the endpoint module against a real RTK store, without Vite's app config.
const source = readFileSync(new URL('./business-proposals.api.js', import.meta.url), 'utf8')
  .replace(/^import .*;\s*/m, '').replaceAll('export const ', 'const ');

test('proposal queries and mutations use v1 and refresh saved list/detail caches', async () => {
  const calls = [];
  let title = 'Original proposal';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    calls.push({ path: url.pathname, query: url.searchParams, method: request.method });
    if (request.method !== 'GET') {
      const body = await request.json();
      assert.equal(body.project_id, 'project');
      title = body.title;
      return new Response(JSON.stringify({ id: 'saved', ...body }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(url.pathname.endsWith('/saved')
      ? { id: 'saved', title, snapshot: { docs: {} } }
      : [{ id: 'saved', title }]), { headers: { 'Content-Type': 'application/json' } });
  };
  const baseApi = createApi({ reducerPath: 'proposalTest', baseQuery: fetchBaseQuery({ baseUrl: 'https://example.test/api/v1' }), endpoints: () => ({}) });
  const api = new Function('baseApi', source + '\nreturn businessProposalsApi;')(baseApi);
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (getDefault) => getDefault().concat(api.middleware) });
  const list = store.dispatch(api.endpoints.getBusinessProposals.initiate({ projectId: 'project', search: 'proposal' }));
  const detail = store.dispatch(api.endpoints.getBusinessProposal.initiate('saved'));
  try {
    await Promise.all([list.unwrap(), detail.unwrap()]);
    assert.equal(calls[0].path, '/api/v1/business-proposals');
    assert.equal(calls[0].query.get('project_id'), 'project');
    assert.equal(calls[0].query.get('search'), 'proposal');
    await store.dispatch(api.endpoints.createBusinessProposal.initiate({ project_id: 'project', title: 'Created', snapshot: { docs: {} } })).unwrap();
    await store.dispatch(api.endpoints.updateBusinessProposal.initiate({ id: 'saved', body: { project_id: 'project', title: 'Updated', snapshot: { docs: {} } } })).unwrap();
    for (let i = 0; i < 100; i++) {
      const state = store.getState();
      if (api.endpoints.getBusinessProposal.select('saved')(state).data?.title === 'Updated' && api.endpoints.getBusinessProposals.select({ projectId: 'project', search: 'proposal' })(state).data?.[0]?.title === 'Updated') break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(api.endpoints.getBusinessProposal.select('saved')(store.getState()).data.title, 'Updated');
    assert.equal(api.endpoints.getBusinessProposals.select({ projectId: 'project', search: 'proposal' })(store.getState()).data[0].title, 'Updated');
    assert.ok(calls.some(({ path, method }) => path === '/api/v1/business-proposals' && method === 'POST'));
    assert.ok(calls.some(({ path, method }) => path === '/api/v1/business-proposals/saved' && method === 'PUT'));
  } finally {
    list.unsubscribe(); detail.unsubscribe(); store.dispatch(api.util.resetApiState()); globalThis.fetch = originalFetch;
  }
});
