import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceEntries, canApproveEvidence } from './evidence-drawer-data.js';

const permissions = ['documents:approve'];
test('a new submission supersedes an old approval and checklist scoping excludes unrelated files', () => {
  const entries = evidenceEntries('DOCUMENT', [
    { id: 'old', documentTypeId: 'plan', status: 'approved', createdAt: '2026-10-01', storageFilename: 'old.pdf' },
    { id: 'new', documentTypeId: 'plan', status: 'submitted', createdAt: '2026-10-02', storageFilename: 'new.pdf' },
    { id: 'other', documentTypeId: 'other-type', status: 'submitted', createdAt: '2026-10-03' },
  ], 'plan');
  assert.deepEqual(entries.map((entry) => entry.record.id), ['new', 'old']);
  assert.equal(canApproveEvidence(entries[0], permissions), true);
  assert.equal(canApproveEvidence(entries[1], permissions), false);
  assert.equal(entries[1].path, '/documents/old/download');
});

test('each drawing sheet exposes only its latest revision for approval while retaining history', () => {
  const entries = evidenceEntries('DRAWING', [{
    id: 'sheet', documentTypeId: 'plan', status: 'For Review', revisions: [
      { id: 'a', revision: 'A', createdAt: '2026-10-01', status: 'Approved', url: '/a' },
      { id: 'b', revision: 'B', createdAt: '2026-10-02', status: 'Draft', url: '/b' },
    ],
  }, {
    id: 'sheet2', documentTypeId: 'plan', status: 'Draft', revisions: [
      { id: 'c', revision: 'A', createdAt: '2026-10-01', url: '/c' },
    ],
  }], 'plan');
  assert.deepEqual(entries.map((entry) => entry.file.id), ['b', 'a', 'c']);
  assert.deepEqual(entries.map((entry) => canApproveEvidence(entry, permissions)), [true, false, true]);
  assert.equal(entries[0].path, '/drawings/sheet/revisions/b/download');
});

test('approval remains unavailable without permission, an attached file, or an editable current record', () => {
  const [entry] = evidenceEntries('DOCUMENT', [{ id: 'doc', status: 'submitted', storageFilename: 'doc.pdf' }]);
  assert.equal(canApproveEvidence(entry, []), false);
  assert.equal(canApproveEvidence({ ...entry, file: {} }, permissions), false);
  assert.equal(canApproveEvidence({ ...entry, record: { isLocked: true } }, permissions), false);
  assert.equal(canApproveEvidence({ ...entry, status: 'archived' }, permissions), false);
  assert.equal(canApproveEvidence(undefined, permissions), false);
});

test('replacing a file changes its preview identity so the previous file cannot stay displayed', () => {
  const record = { id: 'doc', documentTypeId: 'type', storageFilename: 'old.pdf' };
  const [before] = evidenceEntries('DOCUMENT', [record]);
  const [after] = evidenceEntries('DOCUMENT', [{ ...record, storageFilename: 'replacement.pdf' }]);
  assert.notEqual(before.key, after.key);
});
