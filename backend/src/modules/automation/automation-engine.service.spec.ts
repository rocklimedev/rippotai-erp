import { AutomationEngineService } from './automation-engine.service';

describe('automation retry safety', () => {
  let engine: AutomationEngineService;
  let db: any;
  let committed: string[];
  const rule: any = {
    id: 'rule',
    name: 'Rule',
    trigger_type: 'test',
    conditions: [],
    trigger: {},
    actions: [{ type: 'TASK' }, { type: 'NOTIFY' }],
  };
  beforeEach(() => {
    committed = [];
    db = {
      query: jest.fn(async (sql: string, options: any) => {
        if (sql.startsWith('SELECT')) return [];
        if (!options.transaction) throw new Error('Write escaped transaction');
        options.transaction.writes.push(sql);
        return [];
      }),
      transaction: jest.fn(async (handler) => {
        const transaction = { writes: [] as string[] };
        const result = await handler(transaction);
        committed.push(...transaction.writes);
        return result;
      }),
    };
    engine = new AutomationEngineService(db, {} as any, {} as any);
    jest.spyOn(engine, 'candidates').mockResolvedValue({
      def: { entity: 'task', fields: [], params: [] } as any,
      rows: [{ entity_id: 'task-1', entity_label: 'Task' }],
    });
  });

  it('rolls back earlier actions when a later action fails and retries atomically', async () => {
    let fail = true;
    jest
      .spyOn(engine as any, 'runAction')
      .mockImplementation(async (...args: any[]) => {
        if (args[1].type === 'NOTIFY' && fail)
          throw new Error('notification insert failed');
        await (engine as any).exec('INSERT action');
        return { status: 'SUCCESS' };
      });
    await expect(
      engine.runRule(rule, { source: 'schedule', executionKey: 'slot' }),
    ).rejects.toThrow('notification insert failed');
    expect(committed).toEqual([]);
    fail = false;
    await engine.runRule(rule, { source: 'schedule', executionKey: 'slot' });
    expect(committed.filter((sql) => sql === 'INSERT action')).toHaveLength(2);
    expect(
      committed.some((sql) => sql.includes('INSERT INTO automation_runs')),
    ).toBe(true);
  });

  it('skips an already committed occurrence independently of cooldown', async () => {
    db.query.mockImplementation(async (sql: string) =>
      sql.includes('execution_key = ?') ? [{ id: 'completed' }] : [],
    );
    const action = jest.spyOn(engine as any, 'runAction');
    const result = await engine.runRule(rule, {
      source: 'schedule',
      executionKey: 'same-slot',
    });
    expect(result.cooldown).toBe(1);
    expect(action).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      expect.objectContaining({ transaction: expect.anything() }),
    );
  });

  it('surfaces rule failures to the durable scheduler', async () => {
    db.query.mockResolvedValue([
      { ...rule, conditions_json: [], actions_json: [] },
    ]);
    jest
      .spyOn(engine, 'runRule')
      .mockRejectedValue(new Error('database unavailable'));
    await expect(engine.runAll({ source: 'schedule' })).rejects.toThrow(
      'database unavailable',
    );
  });
});
