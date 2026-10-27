jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));

import { DocumentsService } from './document.service';
import { DrawingsService } from './drawing.service';
import { DocumentsController } from './document.controller';
import { DrawingsController } from './drawing.controller';
import { PERMISSION_KEY } from '@/common/decorator/require-permission.decorator';

describe('Uploaded evidence approval', () => {
  function documentSetup() {
    const document: any = {
      id: 'document', projectId: 'project', documentTypeId: 'type',
      requirementId: 'requirement', storageFilename: 'stored.pdf',
      status: 'submitted', isLocked: false,
      update: jest.fn(async (fields) => Object.assign(document, fields)),
    };
    const requirement = { update: jest.fn() };
    const service: any = Object.create(DocumentsService.prototype);
    Object.assign(service, {
      findOne: jest.fn(async () => document),
      documentModel: { findOne: jest.fn(async () => document) },
      requirementModel: { findByPk: jest.fn(async () => requirement) },
      documentTypeModel: { findByPk: jest.fn(async () => ({ requiresApproval: true })) },
      gateEngine: { invalidateReadinessCache: jest.fn() },
      cdnService: { uploadFile: jest.fn(async () => ({ filename: 'new.pdf', url: '/new.pdf' })), deleteFile: jest.fn() },
    });
    return { service, document, requirement };
  }

  it('requires the existing approval permission on both routes', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, DocumentsController.prototype.approve)).toBe('documents:approve');
    expect(Reflect.getMetadata(PERMISSION_KEY, DrawingsController.prototype.approve)).toBe('documents:approve');
  });

  it('approves the latest file, completes its requirement and invalidates final checks', async () => {
    const { service, document, requirement } = documentSetup();
    await service.approveUploaded('document');
    expect(document.status).toBe('approved');
    expect(requirement.update).toHaveBeenCalledWith({ isCompleted: true, completedAt: expect.any(Date) });
    expect(service.gateEngine.invalidateReadinessCache).toHaveBeenCalledWith('project');
  });

  it.each(['missing-file', 'archived', 'old-version', 'locked'])('rejects %s document approval', async (reason) => {
    const { service, document, requirement } = documentSetup();
    if (reason === 'missing-file') document.storageFilename = null;
    if (reason === 'archived') document.status = 'archived';
    if (reason === 'old-version') service.documentModel.findOne.mockResolvedValue({ id: 'newer' });
    if (reason === 'locked') document.isLocked = true;
    await expect(service.approveUploaded('document')).rejects.toThrow();
    expect(document.update).not.toHaveBeenCalled();
    expect(requirement.update).not.toHaveBeenCalled();
  });

  it('requires another review after replacing an approved document file', async () => {
    const { service, document, requirement } = documentSetup();
    document.status = 'approved';
    await service.replaceFile('document', { originalname: 'new.pdf', mimetype: 'application/pdf', size: 10 });
    expect(document.status).toBe('submitted');
    expect(requirement.update).toHaveBeenCalledWith({ isCompleted: false, completedAt: null });
    expect(service.gateEngine.invalidateReadinessCache).toHaveBeenCalledWith('project');
  });

  function drawingSetup() {
    const drawing: any = {
      id: 'drawing', projectId: 'project', documentTypeId: 'type', requirementId: 'requirement',
      status: 'For Review', revisions: [],
      update: jest.fn(async (fields) => Object.assign(drawing, fields)),
    };
    const revision = { storageFilename: 'drawing.pdf', update: jest.fn() };
    const requirement = { update: jest.fn() };
    const service: any = Object.create(DrawingsService.prototype);
    Object.assign(service, {
      findOne: jest.fn(async () => drawing),
      drawingModel: { findAll: jest.fn(async () => [drawing, { status: 'Superseded' }]) },
      revisionModel: { findOne: jest.fn(async () => revision), create: jest.fn(async (record) => record) },
      requirementModel: { findByPk: jest.fn(async () => requirement) },
      gateEngine: { invalidateReadinessCache: jest.fn() },
      cdnService: { uploadFile: jest.fn(async () => ({ filename: 'new.pdf', url: '/new.pdf' })) },
    });
    return { service, drawing, revision, requirement };
  }

  it('approves the latest drawing revision and records the reviewer', async () => {
    const { service, drawing, revision, requirement } = drawingSetup();
    await service.approveUploaded('drawing', 'reviewer');
    expect(revision.update).toHaveBeenCalledWith({ status: 'Approved' });
    expect(drawing).toMatchObject({ status: 'Approved', approvedBy: 'reviewer' });
    expect(requirement.update).toHaveBeenCalledWith({ isCompleted: true, completedAt: expect.any(Date) });
    expect(service.gateEngine.invalidateReadinessCache).toHaveBeenCalledWith('project');
  });

  it('keeps the checklist pending until every current drawing is approved', async () => {
    const { service, requirement } = drawingSetup();
    service.drawingModel.findAll.mockResolvedValue([{ status: 'Approved' }, { status: 'For Review' }]);
    await service.approveUploaded('drawing', 'reviewer');
    expect(requirement.update).toHaveBeenCalledWith({ isCompleted: false, completedAt: null });
  });

  it('cannot approve a drawing without an uploaded revision', async () => {
    const { service, drawing } = drawingSetup();
    service.revisionModel.findOne.mockResolvedValue(null);
    await expect(service.approveUploaded('drawing', 'reviewer')).rejects.toThrow('Upload a revision file');
    expect(drawing.update).not.toHaveBeenCalled();
  });

  it('clears an old approval when a new drawing revision is uploaded', async () => {
    const { service, drawing, requirement } = drawingSetup();
    drawing.status = 'Approved';
    drawing.approvedBy = 'old-reviewer';
    await service.addRevision('drawing', {}, { originalname: 'new.pdf', mimetype: 'application/pdf', size: 10 });
    expect(drawing).toMatchObject({ status: 'Draft', approvedBy: null });
    expect(requirement.update).toHaveBeenCalledWith({ isCompleted: false, completedAt: null });
    expect(service.gateEngine.invalidateReadinessCache).toHaveBeenCalledWith('project');
  });
});
