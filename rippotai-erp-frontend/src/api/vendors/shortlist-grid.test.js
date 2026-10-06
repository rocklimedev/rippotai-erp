import test from 'node:test';
import assert from 'node:assert/strict';
import { applySavedShortlistEntry, createShortlistSaveQueue } from './shortlist-grid.js';

function skeleton() {
  return { grid: [{ trade: 'Plumber', rows: [{ working_type: 'Contractor', entry_id: null,
    name_of_vendor: null, vendor_id: null, material_id: null, estimate_value: null,
    quotation_value: null, is_selected: false }] }] };
}

test('confirmed vendor and amount edits appear in the initially empty grid row', () => {
  const grid = skeleton();
  applySavedShortlistEntry(grid, { id: 'entry', trade: 'Plumber', working_type: 'Contractor',
    vendor_id: 'vendor', name_of_vendor: 'Vendor A', estimate_value: '12500.00', quotation_value: '12000.00' });
  const row = grid.grid[0].rows[0];
  assert.equal(row.entry_id, 'entry');
  assert.equal(row.name_of_vendor, 'Vendor A');
  assert.equal(row.estimate_value, '12500.00');
  assert.equal(row.quotation_value, '12000.00');
});

test('material saves use the associated material name and preserve zero amounts', () => {
  const grid = skeleton();
  applySavedShortlistEntry(grid, { id: 'entry', trade: 'Plumber', working_type: 'Contractor',
    material_id: 'material', material: { name: 'Copper pipe' }, estimate_value: 0 });
  assert.equal(grid.grid[0].rows[0].name_of_vendor, 'Copper pipe');
  assert.equal(grid.grid[0].rows[0].estimate_value, 0);
});

test('rapid edits to one row save in order instead of overwriting newer input', async () => {
  const queue = createShortlistSaveQueue();
  const grid = skeleton();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const calls = [];
  const first = queue('row', async () => {
    calls.push('first'); await gate;
    applySavedShortlistEntry(grid, { id: 'entry', trade: 'Plumber', working_type: 'Contractor', estimate_value: 100 });
  });
  const second = queue('row', async () => {
    calls.push('second');
    applySavedShortlistEntry(grid, { id: 'entry', trade: 'Plumber', working_type: 'Contractor', estimate_value: 200 });
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['first']);
  release(); await Promise.all([first, second]);
  assert.deepEqual(calls, ['first', 'second']);
  assert.equal(grid.grid[0].rows[0].estimate_value, 200);
});

test('a failed row save does not block the next edit or another row', async () => {
  const queue = createShortlistSaveQueue();
  const failed = queue('row', async () => { throw new Error('Save failed'); });
  const next = queue('row', async () => 'saved');
  const other = queue('other', async () => 'other saved');
  await assert.rejects(failed, /Save failed/);
  assert.equal(await next, 'saved');
  assert.equal(await other, 'other saved');
});
