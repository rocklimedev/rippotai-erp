import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathForEntity } from './search-routes.js';

// Read the registered route trees so invented/legacy result paths fail this check.
const folder = new URL('../../router/routes/', import.meta.url);
const registered = fs.readdirSync(folder).filter((name) => name.endsWith('.jsx')).flatMap((name) => {
  const source = fs.readFileSync(new URL(name, folder), 'utf8');
  return source.split(/(?=^    path: ["']\/)/m).flatMap((block) => {
    const paths = [...block.matchAll(/path:\s*["']([^"']+)["']/g)].map((match) => match[1]);
    const base = paths.find((route) => route.startsWith('/')) || '';
    return paths.map((route) => route.startsWith('/') ? route : `${base}/${route}`);
  });
});

const entities = ['project', 'client', 'user', 'lead', 'vendor', 'boq', 'project_brief', 'quotation', 'site_recce', 'task', 'calendar_event', 'document', 'drawing', 'work_order', 'delivery_challan', 'budget_estimate', 'material_requirement', 'scope_of_work', 'activity_log'];
for (const entity_type of entities) {
  test(`${entity_type} opens a registered application route`, () => {
    const result = pathForEntity({ entity_type, id: 'record', meta: { project_id: 'project' } });
    const pathname = result.split('?')[0];
    assert.ok(registered.some((route) => {
      const pattern = route.split('/').map((part) => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');
      return new RegExp(`^${pattern}$`).test(pathname);
    }), `${pathname} is not in the router`);
  });
}

test('uses the record route rather than constructing project-nested paths', () => {
  assert.equal(pathForEntity({ entity_type: 'drawing', id: 'sheet', meta: { project_id: 'project' } }), '/design-studio/sheet');
  assert.equal(pathForEntity({ entity_type: 'project_brief', id: 'brief' }), '/crm/brief/brief');
});
test('preserves the selected lead, user and calendar date in deep links', () => {
  assert.equal(pathForEntity({ entity_type: 'lead', id: 'deal' }), '/crm/pipeline?deal=deal');
  assert.equal(pathForEntity({ entity_type: 'user', id: 'staff' }), '/console/users?userId=staff');
  assert.equal(pathForEntity({ entity_type: 'calendar_event', id: 'event', meta: { starts_at: '2026-10-27T10:00:00Z' } }), '/calendar?eventId=event&date=2026-10-27');
});
test('encodes identifiers and excludes unknown or incomplete results', () => {
  assert.equal(pathForEntity({ entity_type: 'project', id: 'a/b' }), '/projects/a%2Fb');
  assert.equal(pathForEntity({ entity_type: 'unknown', id: 'record' }), null);
  assert.equal(pathForEntity({ entity_type: 'project' }), null);
});
