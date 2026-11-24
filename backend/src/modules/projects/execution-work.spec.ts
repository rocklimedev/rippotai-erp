import { summariseExecution } from './execution-work';

const row = (o: Record<string, unknown>) => ({
  project_id: 'p', phase: 'CIVIL WORK', phase_order: 2, work_name: 'X', details: null,
  status: 'NOT_STARTED', s: null, e: null, sort_order: 0, ...o,
}) as never;

describe('summariseExecution', () => {
  it('shows the active phase and its work', () => {
    const w = summariseExecution([
      row({ phase: 'SITE PREPARATION', phase_order: 1, work_name: 'DEMOLITION', status: 'COMPLETED' }),
      row({ work_name: 'FOUNDATION', status: 'IN_PROGRESS', e: '2026-01-01', sort_order: 1 }),
      row({ work_name: 'WALLING', s: '2026-01-01', sort_order: 2 }),
      row({ work_name: 'PLUMBING', s: '2026-01-01', sort_order: 3 }),
      row({ phase: 'FIT OUTS', phase_order: 3, work_name: 'PAINT', s: '2099-01-01' }),
    ], '2026-06-01')!;
    expect(w.label).toBe('Civil Work · Foundation, Walling +1');
    expect(w.late).toBe(1);
  });
  it('shows the next phase when nothing has started', () => {
    const w = summariseExecution([row({ work_name: 'FOUNDATION', s: '2099-01-01' })], '2026-06-01')!;
    expect(w.label).toBe('Next: Civil Work · Foundation');
    expect(w.upcoming).toBe(true);
  });
});
