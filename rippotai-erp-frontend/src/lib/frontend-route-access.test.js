import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canOpenFrontendRoute,
  getFrontendRoutePatterns,
  setFrontendRouteCatalogue,
} from './frontend-route-access.js';

const supervisor = {
  role: 'site_supervisor',
  frontend_route_restrictions: [
    '/site-operations/daily-reports/:id/edit',
    '/site-operations/admin-dpr/*',
  ],
};

test('restricts individual routes while preserving sibling routes and access for other roles', () => {
  const edit = '/site-operations/daily-reports/42/edit';
  assert.equal(canOpenFrontendRoute(supervisor, edit), false);
  assert.equal(canOpenFrontendRoute(supervisor, '/site-operations/daily-reports/42'), true);
  assert.equal(canOpenFrontendRoute(supervisor, '/site-operations/daily-reports/new'), true);
  assert.equal(canOpenFrontendRoute({ role: 'admin' }, edit), true);
});

test('matches subtrees and URL variants using React Router matching', () => {
  for (const path of [
    '/site-operations/admin-dpr',
    '/site-operations/admin-dpr/workspace',
    '/SITE-OPERATIONS/%61dmin-dpr/42/?project=1#top',
  ]) {
    assert.equal(canOpenFrontendRoute(supervisor, path), false, path);
  }
  assert.equal(canOpenFrontendRoute(supervisor, '/site-operations/admin-dpr-other'), true);
});

test('catalogues protected pages and blocks only the route React Router matched', (t) => {
  const handle = { restrictable: true };
  setFrontendRouteCatalogue([
    { path: '/login' },
    {
      path: '/tasks',
      children: [
        { index: true, handle },
        { path: ':taskId', handle },
        { path: 'new', handle },
      ],
    },
  ]);
  t.after(() => setFrontendRouteCatalogue([]));

  assert.deepEqual(getFrontendRoutePatterns(), ['/tasks', '/tasks/:taskid', '/tasks/new']);
  const user = { frontend_route_restrictions: ['/tasks/:taskid'] };
  assert.equal(canOpenFrontendRoute(user, '/tasks/42'), false);
  assert.equal(canOpenFrontendRoute(user, '/tasks/new'), true);
  assert.equal(canOpenFrontendRoute(user, '/tasks'), true);
  assert.equal(canOpenFrontendRoute({ frontend_route_restrictions: ['/tasks/*'] }, '/tasks/new'), false);
});
