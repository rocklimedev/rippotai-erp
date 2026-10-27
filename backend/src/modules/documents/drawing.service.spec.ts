jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));

import { DrawingsService } from './drawing.service';

describe('Connected drawing uploads', () => {
  function setup(targetType = 'DRAWING') {
    const drawings = { create: jest.fn(async (dto) => dto) };
    const requirements = { findOrCreate: jest.fn(async () => [{ id: 'requirement' }, false]) };
    const service = new DrawingsService(
      drawings as any, {} as any, {} as any,
      { findByPk: jest.fn(async () => ({ targetType, requirementType: 'REQUIRED' })) } as any,
      requirements as any,
      { invalidateReadinessCache: jest.fn() } as any,
    );
    return { service, drawings, requirements };
  }
  const dto = { projectId: 'project', documentTypeId: 'type', title: 'Floor plan', drawingNumber: 'PRJ-001' };

  it('links the drawing to the project checklist without granting approval', async () => {
    const { service, requirements } = setup();
    const drawing = await service.create(dto);
    expect(drawing).toMatchObject({ ...dto, requirementId: 'requirement' });
    expect(drawing.status).toBeUndefined();
    expect(requirements.findOrCreate).toHaveBeenCalledWith({
      where: { projectId: 'project', documentTypeId: 'type' },
      defaults: { projectId: 'project', documentTypeId: 'type', requirementType: 'REQUIRED' },
    });
  });

  it('rejects a document-only checklist type', async () => {
    const { service, drawings, requirements } = setup('DOCUMENT');
    await expect(service.create(dto)).rejects.toThrow('Select a drawing checklist type');
    expect(drawings.create).not.toHaveBeenCalled();
    expect(requirements.findOrCreate).not.toHaveBeenCalled();
  });

  it('rejects a requirement from a different project or type', async () => {
    const { service, drawings } = setup();
    await expect(service.create({ ...dto, requirementId: 'other-project' })).rejects.toThrow('Requirement does not match');
    expect(drawings.create).not.toHaveBeenCalled();
  });

  it('still allows standalone drawings without a checklist type', async () => {
    const { service, requirements } = setup();
    const { documentTypeId, ...standalone } = dto;
    await expect(service.create(standalone)).resolves.toMatchObject(standalone);
    expect(requirements.findOrCreate).not.toHaveBeenCalled();
  });
});
