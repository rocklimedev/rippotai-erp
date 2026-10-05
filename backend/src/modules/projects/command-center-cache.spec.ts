import { CommandCenterCacheService } from './command-center-cache.service';

describe('Command Center accumulated data cache', () => {
  let service: CommandCenterCacheService;
  let redis: any;
  let values: Map<string, string>;
  let models: any[];
  beforeEach(() => {
    values = new Map();
    models = [];
    redis = {
      status: 'ready',
      get: jest.fn(async (key) => values.get(key) ?? null),
      set: jest.fn(async (key, value) => {
        values.set(key, value);
        return 'OK';
      }),
    };
    service = new CommandCenterCacheService(redis, {
      getDatabaseName: () => 'erp-test',
      modelManager: { models },
    } as any);
  });
  afterEach(() => jest.useRealTimers());

  it('reuses the result instead of rebuilding accumulated data and revives dates', async () => {
    const loader = jest.fn(async () => ({
      projects: 25,
      lastActivity: new Date('2026-10-05T10:00:00Z'),
    }));
    const first = await service.getOrLoad('portfolio', loader);
    const cached = await service.getOrLoad('portfolio', loader);
    expect(cached).toEqual(first);
    expect(cached.lastActivity).toBeInstanceOf(Date);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('command-center:v1:erp-test:'),
      expect.any(String),
      'EX',
      120,
    );
  });
  it('shares one cold build between simultaneous requests', async () => {
    const loader = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return [1];
    });
    expect(
      await Promise.all(
        Array.from({ length: 6 }, () => service.getOrLoad('portfolio', loader)),
      ),
    ).toEqual(Array.from({ length: 6 }, () => [1]));
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it('keeps different aggregate/project keys separate', async () => {
    expect(
      await service.getOrLoad('phase:project-a', async () => ['a']),
    ).toEqual(['a']);
    expect(
      await service.getOrLoad('phase:project-b', async () => ['b']),
    ).toEqual(['b']);
  });
  it('does not cache failed builds and allows the next request to recover', async () => {
    const loader = jest
      .fn()
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockResolvedValue(['recovered']);
    await expect(service.getOrLoad('portfolio', loader)).rejects.toThrow(
      'Database unavailable',
    );
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['recovered']);
    expect(loader).toHaveBeenCalledTimes(2);
  });
  it('serves older data immediately while one background refresh runs', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await service.getOrLoad('portfolio', async () => ['old']);
    const now = jest.spyOn(Date, 'now').mockReturnValue(20000);
    let finish!: (value: string[]) => void;
    const loader = jest.fn(
      () =>
        new Promise<string[]>((resolve) => {
          finish = resolve;
        }),
    );
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['old']);
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['old']);
    expect(loader).toHaveBeenCalledTimes(1);
    finish(['new']);
    await new Promise((resolve) => setImmediate(resolve));
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['new']);
    now.mockRestore();
  });
  it('invalidates every dependent aggregate after a source write', async () => {
    const loader = jest.fn(async () => ['data']);
    await service.getOrLoad('portfolio', loader);
    await service.invalidate();
    await service.getOrLoad('portfolio', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });
  it('does not cache a build that raced with an invalidation', async () => {
    let finish!: (value: string[]) => void;
    const loader = jest.fn(
      () =>
        new Promise<string[]>((resolve) => {
          finish = resolve;
        }),
    );
    const request = service.getOrLoad('portfolio', loader);
    await new Promise((resolve) => setImmediate(resolve));
    await service.invalidate();
    finish(['old']);
    await request;
    const replacement = jest.fn(async () => ['new']);
    expect(await service.getOrLoad('portfolio', replacement)).toEqual(['new']);
    expect(replacement).toHaveBeenCalledTimes(1);
    expect([...values.values()]).not.toContain(expect.stringContaining('old'));
  });
  it('loads source data when Redis is disconnected, rejects, or contains corrupt data', async () => {
    const loader = jest.fn(async () => ['db']);
    redis.status = 'reconnecting';
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['db']);
    expect(redis.get).not.toHaveBeenCalled();
    redis.status = 'ready';
    redis.get.mockRejectedValueOnce(new Error('Offline'));
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['db']);
    redis.get.mockResolvedValueOnce(null).mockResolvedValueOnce('{invalid');
    expect(await service.getOrLoad('portfolio', loader)).toEqual(['db']);
  });
  it('bounds waiting on an unresponsive Redis connection', async () => {
    jest.useFakeTimers();
    redis.get.mockImplementation(() => new Promise(() => {}));
    const loader = jest.fn(async () => ['db']);
    const request = service.getOrLoad('portfolio', loader);
    await jest.advanceTimersByTimeAsync(151);
    expect(await request).toEqual(['db']);
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it('invalidates transaction writes only after commit, and ignores unrelated models', async () => {
    const relevant = {
      getTableName: () => 'documents',
      addHook: jest.fn(),
      removeHook: jest.fn(),
    };
    const unrelated = {
      getTableName: () => 'reminder_sync_records',
      addHook: jest.fn(),
    };
    models.push(relevant, unrelated);
    service.onApplicationBootstrap();
    expect(unrelated.addHook).not.toHaveBeenCalled();
    const afterSave = relevant.addHook.mock.calls.find(
      (call) => call[0] === 'afterSave',
    )![2];
    const transaction = { afterCommit: jest.fn() };
    await afterSave({}, { transaction });
    await afterSave({}, { transaction });
    expect(redis.set).not.toHaveBeenCalled();
    expect(transaction.afterCommit).toHaveBeenCalledTimes(1);
    await transaction.afterCommit.mock.calls[0][0]();
    expect(redis.set).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
    expect(relevant.removeHook).toHaveBeenCalledTimes(5);
  });
});
