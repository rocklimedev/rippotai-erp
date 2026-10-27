import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectBriefsService } from './brief.service';
import { ProjectBriefStatus as Status } from '@/common/types/project-brief.types';

describe('client brief soft deletion', () => {
  function setup(status = Status.READY_FOR_DESIGN) {
    const brief = { status, destroy: jest.fn().mockResolvedValue(undefined) };
    const service = Object.create(ProjectBriefsService.prototype);
    service.projectBriefModel = { findByPk: jest.fn().mockResolvedValue(brief) };
    return { service, brief };
  }

  it.each([Status.DRAFT, Status.READY_FOR_DESIGN])('soft deletes a %s brief', async (status) => {
    const { service, brief } = setup(status);
    await expect(service.remove('brief')).resolves.toMatchObject({ success: true });
    expect(brief.destroy).toHaveBeenCalledWith({ force: false });
  });

  it.each([Status.SIGNED_OFF, Status.ARCHIVED])('preserves %s briefs', async (status) => {
    const { service, brief } = setup(status);
    await expect(service.remove('brief')).rejects.toBeInstanceOf(BadRequestException);
    expect(brief.destroy).not.toHaveBeenCalled();
  });

  it('returns not found for a deleted or missing brief', async () => {
    const { service } = setup();
    service.projectBriefModel.findByPk.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
