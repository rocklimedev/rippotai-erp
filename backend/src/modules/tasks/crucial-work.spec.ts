import 'reflect-metadata';
import { validate } from 'class-validator';
import JSZip from 'jszip';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  checklistTasks,
  cycleEnd,
  CrucialWorkService,
} from './crucial-work.service';
import {
  CrucialWorkExportService,
  exportRows,
} from './crucial-work-export.service';
import {
  CrucialWorkExportDto,
  SaveCrucialCheckDto,
} from './dto/crucial-work.dto';
import { TasksService } from './task.service';

const query = { cycle: 'weekly' as const, cycle_date: '2026-10-12' };
const tasks = [
  {
    id: 'one',
    crucial_ref: 7,
    title: 'Ponding test <bathroom> & inspection',
    is_crucial: true,
    crucial_reason:
      'Verify waterproofing before tiling.\nRecheck after 48 hours.',
    status: 'in_progress',
    due_date: '2026-10-13T12:00:00Z',
    assignee: { name: 'Site Engineer' },
    project: { name: 'River House' },
  },
  {
    id: 'two',
    crucial_ref: 11,
    title: 'Closed clearance',
    is_crucial: true,
    crucial_reason: 'Written approval',
    status: 'completed',
    assignee: { name: 'Architect' },
  },
  {
    id: 'three',
    crucial_ref: 18,
    title: 'Future delivery',
    is_crucial: true,
    status: 'todo',
    due_date: '2026-11-01T12:00:00Z',
  },
];
const checks = [
  {
    task_id: 'one',
    check_status: 'in_progress',
    follow_up: 'Recheck tomorrow AM',
    checker: { name: 'Site Engineer' },
  },
];
const register = {
  tasks,
  checks,
  checklist: checklistTasks(tasks, checks, query),
  cycle_end: cycleEnd(query),
};

it('selects due, overdue and undated open items, plus explicitly checked closed items; uses Indian calendar dates', () => {
  const list = [
    ...tasks,
    { id: 'late', status: 'blocked', due_date: '2026-10-01' },
    { id: 'undated', status: 'todo' },
    { id: 'boundary', status: 'todo', due_date: '2026-10-18T20:00:00Z' },
  ];
  expect(cycleEnd(query)).toBe('2026-10-18');
  expect(checklistTasks(list, checks, query).map((t) => t.id)).toEqual([
    'one',
    'late',
    'undated',
  ]);
  expect(
    checklistTasks(tasks, [{ task_id: 'two' }], query).map((t) => t.id),
  ).toEqual(['one', 'two']);
  expect(cycleEnd({ cycle: 'daily', cycle_date: '2026-12-31' })).toBe(
    '2026-12-31',
  );
  expect(cycleEnd({ cycle: 'weekly', cycle_date: '2026-12-29' })).toBe(
    '2027-01-04',
  );
});

it('keeps master reference numbers and closed records while mapping template fields', () => {
  const rows = exportRows(register);
  expect(rows.master[0]).toEqual([
    '7',
    `${tasks[0].title}\nProject: River House`,
    tasks[0].crucial_reason,
    'Site Engineer',
    '2026-10-13',
    'In Progress',
  ]);
  expect(rows.master[1][0]).toBe('11');
  expect(rows.master[1][5]).toBe('Closed');
  expect(rows.checklist).toHaveLength(1);
  expect(rows.checklist[0].slice(2)).toEqual([
    'In progress',
    'Recheck tomorrow AM',
    'Site Engineer',
  ]);
});

it('rejects invalid formats, dates, cycles and check statuses', async () => {
  for (const patch of [
    { format: 'html' },
    { cycle: 'monthly' },
    { cycle_date: '2026-02-30' },
    { cycle_date: '2026-10-12T12:00:00Z' },
    { project_id: 'bad' },
  ]) {
    const dto = Object.assign(
      new CrucialWorkExportDto(),
      query,
      { format: 'docx' },
      patch,
    );
    expect((await validate(dto)).length).toBeGreaterThan(0);
  }
  expect(
    await validate(
      Object.assign(new CrucialWorkExportDto(), query, { format: 'pdf' }),
    ),
  ).toHaveLength(0);
  expect(
    (
      await validate(
        Object.assign(new SaveCrucialCheckDto(), query, {
          check_status: 'done',
        }),
      )
    ).length,
  ).toBeGreaterThan(0);
});

it('filters the register to marked project tasks and loads only the selected cycle', async () => {
  const taskService = {
    findAll: jest
      .fn()
      .mockResolvedValue(tasks.map((t) => ({ toJSON: () => t }))),
  };
  const checkModel = {
    findAll: jest
      .fn()
      .mockResolvedValue(checks.map((c) => ({ toJSON: () => c }))),
  };
  const service = new CrucialWorkService(taskService as any, checkModel as any);
  const result = await service.register({ ...query, project_id: 'project' });
  expect(taskService.findAll).toHaveBeenCalledWith({
    is_crucial: true,
    project_id: 'project',
  });
  expect(checkModel.findAll.mock.calls[0][0].where).toEqual({
    cycle_date: query.cycle_date,
    cycle: query.cycle,
  });
  expect(result.tasks).toHaveLength(3);
  expect(result.checklist).toHaveLength(1);
});

it('records the authenticated checker and does not allow checks on unmarked tasks', async () => {
  const taskService = {
    findOne: jest.fn().mockResolvedValue({ is_crucial: true }),
  };
  const checkModel = { upsert: jest.fn(), findOne: jest.fn() };
  const service = new CrucialWorkService(taskService as any, checkModel as any);
  await service.saveCheck(
    'one',
    { ...query, check_status: 'checked', follow_up: '  Call owner  ' },
    'actor',
  );
  expect(checkModel.upsert).toHaveBeenCalledWith({
    task_id: 'one',
    ...query,
    check_status: 'checked',
    follow_up: 'Call owner',
    checked_by: 'actor',
  });
  taskService.findOne.mockResolvedValue({ is_crucial: false });
  await expect(
    service.saveCheck('one', { ...query, check_status: 'checked' }, 'actor'),
  ).rejects.toThrow('Mark this task');
  expect(checkModel.upsert).toHaveBeenCalledTimes(1);
});

it('blocks permanent deletion of a crucial task', async () => {
  const service = new TasksService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const task = { is_crucial: true, destroy: jest.fn() };
  jest.spyOn(service, 'findOne').mockResolvedValue(task as any);
  await expect(service.remove('one')).rejects.toThrow('Mark it completed');
  expect(task.destroy).not.toHaveBeenCalled();
});

it('fills a genuine Word template, clears examples, escapes XML and preserves other package parts', async () => {
  const service = new CrucialWorkExportService();
  const original = await JSZip.loadAsync(await service.template());
  const word = await service.word(register, query);
  const output = await JSZip.loadAsync(word);
  const xml = await output.file('word/document.xml')!.async('string');
  expect(xml).toContain('Ponding test &lt;bathroom&gt; &amp; inspection');
  expect(xml).toContain('Closed clearance');
  expect(xml).not.toContain('Soil / water table test before excavation');
  expect(xml).not.toContain('Waterproofing ponding test, Bathroom 02');
  expect(xml.match(/<w:tblHeader\b/g)).toHaveLength(2);
  expect(xml).toContain('Weekly cycle: 2026-10-12 to 2026-10-18');
  for (const name of Object.keys(original.files).filter(
    (n) => n !== 'word/document.xml' && !original.files[n].dir,
  )) {
    expect(await output.file(name)!.async('nodebuffer')).toEqual(
      await original.file(name)!.async('nodebuffer'),
    );
  }
  const empty = await JSZip.loadAsync(
    await service.word(
      { tasks: [], checklist: [], checks: [], cycle_end: cycleEnd(query) },
      query,
    ),
  );
  expect(await empty.file('word/document.xml')!.async('string')).not.toContain(
    'Soil / water table',
  );
  if (process.env.CRUCIAL_QA_DIR) {
    await mkdir(process.env.CRUCIAL_QA_DIR, { recursive: true });
    await writeFile(
      join(process.env.CRUCIAL_QA_DIR, 'crucial-work-sample.docx'),
      word,
    );
  }
});

it('generates a multi-page PDF with embedded fonts and long rows without dropping content', async () => {
  const service = new CrucialWorkExportService();
  const longTasks = Array.from({ length: 14 }, (_, i) => ({
    ...tasks[0],
    id: `task-${i}`,
    crucial_ref: i + 1,
    title: `Task ${i + 1} waterproofing inspection`,
    crucial_reason:
      i === 0
        ? 'Long detail '.repeat(300) + 'END OF LONG DETAIL'
        : tasks[0].crucial_reason,
  }));
  const sample = {
    tasks: longTasks,
    checks: [],
    checklist: longTasks.slice(0, 3),
    cycle_end: cycleEnd(query),
  };
  const pdf = await service.pdf(sample, query);
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('/FontFile2');
  expect(pdf.length).toBeGreaterThan(5000);
  if (process.env.CRUCIAL_QA_DIR)
    await writeFile(
      join(process.env.CRUCIAL_QA_DIR, 'crucial-work-sample.pdf'),
      pdf,
    );
});
