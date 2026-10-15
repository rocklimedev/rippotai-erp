import { ScheduledJobsService } from './scheduled-jobs.service';

describe('durable schedules', () => {
  let locked: boolean;
  let due: boolean;
  let writes: string[];
  let db: any;
  let service: ScheduledJobsService;
  beforeEach(() => {
    locked = false;
    due = true;
    writes = [];
    db = {
      transaction: jest.fn(async (handler) => {
        const transaction = { owns: false };
        try {
          return await handler(transaction);
        } finally {
          if (transaction.owns) locked = false;
        }
      }),
      query: jest.fn(async (sql: string, options: any) => {
        if (sql.includes('GET_LOCK(')) {
          if (locked) return [{ acquired: 0 }];
          locked = true;
          options.transaction.owns = true;
          return [{ acquired: 1 }];
        }
        if (sql.includes('RELEASE_LOCK(')) {
          locked = false;
          options.transaction.owns = false;
          return [{ released: 1 }];
        }
        if (sql === 'SELECT 1') return [{ value: 1 }];
        if (sql.startsWith('SELECT')) {
          if (!due) return [];
          return [
            { name: 'test', execution_key: '2026-10-15T00:00:00.000000' },
          ];
        }
        writes.push(sql);
        if (sql.includes('last_success_at')) due = false;
        return [];
      }),
    };
    service = new ScheduledJobsService(db);
  });

  it('skips work owned by another replica and work already completed', async () => {
    let finish!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const handler = jest.fn(async () => {
      entered();
      await pending;
    });
    const first = service.execute('test', 60000, handler);
    await started;
    const replica = new ScheduledJobsService(db);
    await replica.execute('test', 60000, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    await replica.execute('test', 60000, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    finish();
    await first;
    await replica.execute('test', 60000, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(writes.some((sql) => sql.includes('last_success_at'))).toBe(true);
  });

  it('persists failure and allows a subsequent retry', async () => {
    const failed = jest.fn(async (_key: string) => {
      throw new Error('Zoho unavailable');
    });
    await service.execute('test', 60000, failed);
    expect(writes.some((sql) => sql.includes('failures = failures + 1'))).toBe(
      true,
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('last_failed_at'),
      expect.objectContaining({ replacements: ['Zoho unavailable', 'test'] }),
    );
    const retry = jest.fn(async () => {});
    await service.execute('test', 60000, retry);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledWith(failed.mock.calls[0][0]);
    const failureWrite = writes.find((sql) => sql.includes('last_failed_at'))!;
    expect(failureWrite).not.toContain('occurrence_id =');
    expect(writes.find((sql) => sql.includes('last_success_at'))).toContain(
      'occurrence_id = UUID()',
    );
  });

  it('rejects a concurrent manual reminder operation', async () => {
    locked = true;
    const handler = jest.fn();
    await expect(
      service.exclusive('reminder:user:tasks', handler),
    ).rejects.toThrow('already running');
    expect(handler).not.toHaveBeenCalled();
  });

  it('releases a named lock on handler failure using the acquisition connection', async () => {
    await expect(
      service.exclusive('manual', async () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
    const acquire = db.query.mock.calls.find(([sql]) =>
      sql.includes('GET_LOCK('),
    );
    const release = db.query.mock.calls.find(([sql]) =>
      sql.includes('RELEASE_LOCK('),
    );
    expect(release[1].transaction).toBe(acquire[1].transaction);
    expect(release[1].replacements).toEqual(acquire[1].replacements);
    expect(locked).toBe(false);
    expect(
      db.query.mock.calls.every(([sql]) => !sql.includes('SKIP LOCKED')),
    ).toBe(true);
  });

  it('fails closed when named lock acquisition returns NULL', async () => {
    db.query.mockResolvedValue([{ acquired: null }]);
    const handler = jest.fn();
    await expect(service.execute('test', 60000, handler)).rejects.toThrow(
      'Could not acquire',
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('fails closed when the database cannot acquire ownership', async () => {
    db.transaction.mockRejectedValue(new Error('connection lost'));
    const handler = jest.fn();
    await expect(service.execute('test', 60000, handler)).rejects.toThrow(
      'connection lost',
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps the lock connection alive during long handlers', async () => {
    jest.useFakeTimers();
    try {
      let finish!: () => void;
      let entered!: () => void;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const pending = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const work = service.execute('test', 60000, async () => {
        entered();
        await pending;
      });
      await started;
      await jest.advanceTimersByTimeAsync(6000);
      expect(
        db.query.mock.calls.filter(([sql]) => sql === 'SELECT 1'),
      ).toHaveLength(2);
      finish();
      await work;
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
