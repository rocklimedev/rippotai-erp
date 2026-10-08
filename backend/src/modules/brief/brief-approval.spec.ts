import { ProjectBriefsService } from './brief.service';
import { ProjectBriefStatus as Status } from '@/common/types/project-brief.types';
import { UpdateBriefStatusDto } from './dto/update-brief-status.dto';
import { validate } from 'class-validator';

describe('client brief approval', () => {
  function setup(status = Status.READY_FOR_DESIGN, latestId = 'brief') {
    const row = { id: 'brief', projectId: 'project', status, update: jest.fn() };
    const service = Object.create(ProjectBriefsService.prototype) as any;
    service.projectBriefModel = { findByPk: jest.fn().mockResolvedValue(row), findOne: jest.fn().mockResolvedValue({ id: latestId }) };
    service.sequelize = { transaction: jest.fn(async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })) };
    service.findOne = jest.fn().mockResolvedValue(row);
    return { service, row };
  }
  it('records the approver on sign-off', async () => {
    const { service, row } = setup();
    await service.updateStatus('brief', Status.SIGNED_OFF, 'actor', ['documents:approve']);
    expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ status: Status.SIGNED_OFF, confirmedByUserId: 'actor', confirmedDate: expect.any(Date) }), expect.objectContaining({ transaction: expect.anything() }));
  });
  it('rejects sign-off without permission', async () => {
    const { service, row } = setup();
    await expect(service.updateStatus('brief', Status.SIGNED_OFF, 'actor', [])).rejects.toThrow('permission');
    expect(row.update).not.toHaveBeenCalled();
  });
  it('rejects skipping readiness', async () => {
    const { service } = setup(Status.DRAFT);
    await expect(service.updateStatus('brief', Status.SIGNED_OFF, 'actor', ['documents:approve'])).rejects.toThrow('transition');
  });
  it('rejects approval of older versions', async () => {
    const { service } = setup(Status.READY_FOR_DESIGN, 'newer');
    await expect(service.updateStatus('brief', Status.SIGNED_OFF, 'actor', ['documents:approve'])).rejects.toThrow('latest');
  });
  it('preserves signed-off records', () => {
    const { service, row } = setup(Status.SIGNED_OFF);
    expect(() => service.assertEditable(row)).toThrow('new version');
  });
  it('rejects bypassing sign-off through ordinary writes', () => {
    const { service } = setup();
    expect(() => service.validateEditablePayload({ status: Status.SIGNED_OFF }, true)).toThrow();
    expect(() => service.validateEditablePayload({ confirmedByUserId: null })).toThrow();
    expect(() => service.validateEditablePayload({ status: Status.SIGNED_OFF })).toThrow();
  });
  it('validates the status DTO', async () => {
    const dto = new UpdateBriefStatusDto();
    dto.status = 'APPROVED' as Status;
    expect(await validate(dto)).toHaveLength(1);
  });
});
