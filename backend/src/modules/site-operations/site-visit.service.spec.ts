import { SiteVisitService } from './site-visit.service';
import {
  VisitorType,
  VisitStatus,
} from '../../common/enums/site-operations.enums';

describe('visit event allocations', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  function setup() {
    const assignment: any = {
      id: 1,
      projectId: 'project',
      visitorType: VisitorType.ARCHITECT,
      stageId: 'stage',
      scheduledDate: '2026-10-10',
      externalPartyName: 'Architect',
      teamId: null,
      isActive: true,
      purpose: 'Locked purpose',
      update: jest.fn(),
    };
    const allocations: any = {
      create: jest.fn((v) => v),
      findByPk: jest.fn().mockResolvedValue(assignment),
      findAll: jest.fn(),
      sequelize: { transaction: jest.fn((cb) => cb(transaction)) },
    };
    const logs: any = {
      create: jest.fn((v) => v),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      findByPk: jest.fn(),
    };
    const stages: any = {
      findByPk: jest.fn().mockResolvedValue({
        id: 'stage',
        visit_no: 6,
        is_active: true,
        stage: 'Custom stage',
        checks_purpose: 'Custom checks',
        visit_type: 'Mandatory',
      }),
    };
    const project: any = {
      findByPk: jest.fn().mockResolvedValue({ id: 'project' }),
    };
    const team: any = { findByPk: jest.fn().mockResolvedValue({ id: 1 }) };
    return {
      service: new SiteVisitService(allocations, logs, stages, project, team),
      allocations,
      logs,
      stages,
      assignment,
    };
  }
  const dto = {
    projectId: 'project',
    visitorType: VisitorType.ARCHITECT,
    stageId: 'stage',
    scheduledDate: '2026-10-10',
    externalPartyName: 'Architect',
  };
  const log = {
    projectId: 'project',
    visitAssignmentId: 1,
    visitorType: VisitorType.ARCHITECT,
    visitorName: 'Architect',
    scheduledDate: '2026-10-10',
    loggedBy: 'Admin',
  };
  it('snapshots saved master values for future allocations', async () => {
    const { service, allocations } = setup();
    await service.createAssignment(dto);
    expect(allocations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stageName: 'Custom stage',
        checksPurpose: 'Custom checks',
        frequency: null,
        scheduleDays: null,
      }),
    );
  });
  it('requires date, allocated visitor and architect stage', async () => {
    const { service } = setup();
    await expect(
      service.createAssignment({ ...dto, scheduledDate: '' }),
    ).rejects.toThrow('scheduled date');
    await expect(
      service.createAssignment({ ...dto, externalPartyName: ' ' }),
    ).rejects.toThrow('Allocate either');
    await expect(
      service.createAssignment({ ...dto, stageId: undefined }),
    ).rejects.toThrow('architect visit stage');
    await expect(
      service.createAssignment({ ...dto, teamId: 1 }),
    ).rejects.toThrow('Allocate either');
  });
  it('accepts custom active stages and rejects deleted or missing stages', async () => {
    const { service, stages } = setup();
    stages.findByPk.mockResolvedValue({ id: 'stage', visit_no: 99, is_active: true, stage: 'Custom', checks_purpose: 'Checks', visit_type: 'Mandatory' });
    await expect(service.createAssignment(dto)).resolves.toBeDefined();
    for (const stage of [null, { id: 'stage', is_active: false }]) {
      stages.findByPk.mockResolvedValue(stage);
      await expect(service.createAssignment(dto)).rejects.toThrow('active architect visit stage');
    }
  });
  it('locks allocation stage and project', async () => {
    const { service } = setup();
    await expect(
      service.updateAssignment(1, { stageId: 'other' }),
    ).rejects.toThrow('locked');
    await expect(
      service.updateAssignment(1, { projectId: 'other' }),
    ).rejects.toThrow('locked');
  });
  it('updates the original event and refuses edits after logging', async () => {
    const { service, assignment, allocations, logs } = setup();
    await service.updateAssignment(1, { scheduledDate: '2026-10-11' });
    expect(assignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledDate: '2026-10-11' }),
      { transaction },
    );
    expect(allocations.create).not.toHaveBeenCalled();
    logs.count.mockResolvedValue(1);
    await expect(
      service.updateAssignment(1, { scheduledDate: '2026-10-12' }),
    ).rejects.toThrow('visit logs');
  });
  it('rejects cross-project/type/date links, inactive events and duplicate logs', async () => {
    const { service, logs, assignment } = setup();
    for (const changed of [
      { projectId: 'other' },
      { visitorType: VisitorType.CLIENT },
      { scheduledDate: '2026-10-12' },
    ]) {
      await expect(service.logVisit({ ...log, ...changed })).rejects.toThrow(
        'must match',
      );
    }
    assignment.isActive = false;
    await expect(service.logVisit(log)).rejects.toThrow('inactive');
    assignment.isActive = true;
    logs.count.mockResolvedValue(1);
    await expect(service.logVisit(log)).rejects.toThrow('already has');
  });
  it('copies the allocated purpose into the log and requires architect allocation', async () => {
    const { service, logs } = setup();
    await service.logVisit({ ...log, purpose: 'Different purpose' });
    expect(logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'Locked purpose',
        status: VisitStatus.SCHEDULED,
      }),
      { transaction },
    );
    await expect(
      service.logVisit({ ...log, visitAssignmentId: undefined }),
    ).rejects.toThrow('event allocation');
  });
  it('cancels scheduled logs with the allocation, but preserves completed events', async () => {
    const { service, logs, assignment } = setup();
    await service.deactivateAssignment(1);
    expect(logs.update).toHaveBeenCalledWith(
      { status: VisitStatus.CANCELLED },
      expect.objectContaining({ transaction }),
    );
    expect(assignment.update).toHaveBeenCalledWith(
      { isActive: false },
      { transaction },
    );
    logs.count.mockResolvedValue(1);
    await expect(service.deactivateAssignment(1)).rejects.toThrow(
      'Completed visit',
    );
  });
  it('does not reopen cancelled allocations through check-in or status edits', async () => {
    const { service, logs, assignment } = setup();
    assignment.isActive = false;
    logs.findByPk.mockResolvedValue({
      id: 2,
      visitAssignmentId: 1,
      status: VisitStatus.CANCELLED,
    });
    await expect(service.checkIn(2)).rejects.toThrow('Cancelled allocations');
    await expect(
      service.updateVisit(2, { status: VisitStatus.COMPLETED }),
    ).rejects.toThrow('Cancelled allocations');
  });
  it('records completion time and keeps repeated check-ins idempotent', async () => {
    const { service, logs } = setup();
    const visit: any = {
      id: 2,
      visitAssignmentId: 1,
      status: VisitStatus.SCHEDULED,
      update: jest.fn().mockImplementation((v) => Object.assign(visit, v)),
    };
    logs.findByPk.mockResolvedValue(visit);
    await service.checkIn(2);
    const arrival = visit.actualVisitAt;
    await service.checkIn(2);
    expect(visit.update).toHaveBeenCalledTimes(1);
    expect(arrival).toBeInstanceOf(Date);
  });
});
