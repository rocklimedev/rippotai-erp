import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { buildQualityWorkbook } from '../src/pages/site-ops/qualityChecklistExcel.js';

const source = JSON.parse(fs.readFileSync(new URL('../../backend/src/modules/site-operations/constants/quality-checklist-template.source.json', import.meta.url)));
const fixture = () => ({ project: { id: 'project', name: 'Template QA Project' },
  work_heads: source.map(template => ({ template_serial_number: template.serial_number, name: template.label, status: 'Pending' })),
  checklists: source.filter(template => template.checkpoints.length).map(template => ({
    checklist: { name: template.label, title: template.title, sheet_name: template.sheet_name },
    items: template.checkpoints.map(item => ({ ...item, status: 'NOT_STARTED', is_accepted: null })),
  })),
});
test('exports the source master and all detailed phase groups and text from JSON', async () => {
  const workbook = buildQualityWorkbook(fixture());
  const reloaded = new ExcelJS.Workbook(); await reloaded.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.equal(reloaded.worksheets.length, 13);
  assert.equal(reloaded.getWorksheet('QC -Work heads').getCell('B19').value, 'Doors & Fixed furniture');
  for (const template of source.filter(template => template.checkpoints.length)) {
    const sheet = reloaded.getWorksheet(template.sheet_name);
    assert.equal(sheet.getCell('A2').value, 'Project: Template QA Project');
    const checkpoints = [];
    sheet.eachRow(row => { if (typeof row.getCell(1).value === 'number') checkpoints.push({ serial_number: row.getCell(1).value, checkpoint_name: row.getCell(2).value }); });
    assert.deepEqual(checkpoints, template.checkpoints.map(({ serial_number, checkpoint_name }) => ({ serial_number, checkpoint_name })));
    assert.equal(sheet.getCell('B5').alignment.wrapText, true);
    assert.equal(sheet.views[0].ySplit, 3);
  }
});
test('preserves Yes, No, pending, status and literal remarks without treating input as formulas', async () => {
  const data = fixture().checklists[0];
  data.project = { name: 'Project' };
  Object.assign(data.items[0], { is_accepted: false, status: 'REJECTED', remarks: '=SUM(A1:A2)' });
  Object.assign(data.items[1], { is_accepted: true, status: 'ACCEPTED' });
  const workbook = buildQualityWorkbook(data); const sheet = workbook.worksheets[0];
  assert.equal(sheet.getCell('C5').value, 'No'); assert.equal(sheet.getCell('D5').value, 'Rejected');
  assert.equal(sheet.getCell('E5').value, '=SUM(A1:A2)'); assert.equal(sheet.getCell('E5').type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell('C6').value, 'Yes'); assert.equal(sheet.getCell('C7').value, null);
});
test('gives repeated project checklists unique Excel sheet names', () => {
  const data = fixture(); data.checklists.push(data.checklists[0]);
  const names = buildQualityWorkbook(data).worksheets.map(sheet => sheet.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.every(name => name.length <= 31));
});

// Optional visual-QA output uses the exact application exporter, not a parallel builder.
if (process.env.QUALITY_QA_OUTPUT) await buildQualityWorkbook(fixture()).xlsx.writeFile(process.env.QUALITY_QA_OUTPUT);
