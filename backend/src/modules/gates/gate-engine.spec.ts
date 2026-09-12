import { GateEngineService } from './gate-engine.service';
import { GateStatus } from '@/common/enums/gates.enum';

describe('gate transition rules', () => {
  function engine(readiness: Record<string, unknown>) {
    const definitions = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'gate', code: 'GATE', allowsOverride: true }),
    };
    const project = { findByPk: jest.fn().mockResolvedValue({}) };
    const sequelize = {
      transaction: async (callback: any) =>
        callback({ LOCK: { UPDATE: 'UPDATE' } }),
    };
    const service = new GateEngineService(
      definitions as any,
      {} as any,
      {} as any,
      {} as any,
      project as any,
      sequelize as any,
      {} as any,
      {} as any,
    );
    jest.spyOn(service, 'ensureInitialized').mockResolvedValue();
    jest
      .spyOn(service, 'checkReadiness')
      .mockResolvedValue({
        status: GateStatus.PENDING,
        unlockedByPreviousGate: true,
        conditions: [],
        ...readiness,
      } as any);
    return service;
  }
  const user = {
    id: 'user',
    email: 'user@example.com',
    permissions: ['gates:clear', 'gates:override'],
  } as any;
  it('denies an authenticated user without clearing permission', async () => {
    await expect(
      engine({}).clearGate('p', 'GATE', { ...user, permissions: [] }),
    ).rejects.toThrow('gates:clear');
  });
  it('never overrides the predecessor lock', async () => {
    await expect(
      engine({ unlockedByPreviousGate: false }).clearGate('p', 'GATE', user, {
        override: true,
        remarks: 'reason',
      }),
    ).rejects.toThrow();
  });
  it('requires an override reason', async () => {
    await expect(
      engine({}).clearGate('p', 'GATE', user, { override: true, remarks: ' ' }),
    ).rejects.toThrow('reason');
  });
  it('rejects repeated clearance', async () => {
    await expect(
      engine({ status: GateStatus.CLEARED }).clearGate('p', 'GATE', user),
    ).rejects.toThrow();
  });
  it('blocks incomplete evidence without an override', async () => {
    await expect(
      engine({ isReady: false }).clearGate('p', 'GATE', user),
    ).rejects.toThrow();
  });
});
