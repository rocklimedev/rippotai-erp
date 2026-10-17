import test from 'node:test';
import assert from 'node:assert/strict';
import { awaitExportResponse } from './export-jobs.js';
const id = '12345678-1234-1234-1234-123456789abc';
const submitted = () => new Response(JSON.stringify({ jobId: id, statusUrl: `/export-jobs/${id}` }), { status: 202 });
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('polls queued and retried exports before returning the original binary download response', async () => {
  const states = [];
  const calls = [];
  const responses = [json({ state: 'waiting', attemptsMade: 0 }), json({ state: 'delayed', attemptsMade: 1 }), json({ state: 'completed', resultUrl: `/export-jobs/${id}/result` }), new Response('binary', { headers: { 'Content-Disposition': 'attachment; filename="test.xlsx"' } })];
  const result = await awaitExportResponse(submitted(), { apiBase: 'https://api.example/api/v1', headers: { Authorization: 'Bearer current' }, pollMs: 0, onStatus: job => states.push(job.state), fetchImpl: async (url, init) => { calls.push([url, init]); return responses.shift(); } });
  assert.deepEqual(states, ['waiting', 'delayed', 'completed']);
  assert.equal(await result.text(), 'binary');
  assert.equal(result.headers.get('content-disposition'), 'attachment; filename="test.xlsx"');
  assert.ok(calls.every(([url, init]) => url.startsWith('https://api.example/api/v1/export-jobs/') && init.headers.Authorization === 'Bearer current' && init.cache === 'no-store'));
});

test('exposes terminal failure, attempt count and an explicit retry capability', async () => {
  await assert.rejects(awaitExportResponse(submitted(), { apiBase: 'https://api.example', fetchImpl: async () => json({ jobId: id, state: 'failed', attemptsMade: 3, failedReason: 'Timed out', retryAvailable: true }) }), error => error.jobId === id && error.retryAvailable && error.message.includes('3 attempt(s)'));
});

test('does not redirect authorization headers to an untrusted job URL', async () => {
  const response = new Response(JSON.stringify({ jobId: id, statusUrl: 'https://other.example/steal' }), { status: 202 });
  let called = false;
  await assert.rejects(awaitExportResponse(response, { apiBase: 'https://api.example', fetchImpl: async () => { called = true; } }), /Invalid export job URL/);
  assert.equal(called, false);
});

test('keeps existing non-export responses intact', async () => {
  const response = json({ id: 'saved-record' });
  assert.equal(await awaitExportResponse(response, {}), response);
});

test('cancelling a view stops polling without cancelling its durable export', async () => {
  const abort = new AbortController(); abort.abort();
  await assert.rejects(awaitExportResponse(submitted(), { apiBase: 'https://api.example', signal: abort.signal }), { name: 'AbortError' });
});
