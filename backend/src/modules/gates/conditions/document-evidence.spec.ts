import {
  DocumentEvidenceService,
  mandatoryDocument,
} from './document-evidence.service';
import { DocumentTypeAllApprovedEvaluator } from './document-type-all-approved.evaluator';
import { ManualApprovalEvaluator } from './manual-approval.evaluator';

describe('gate evidence', () => {
  it('batches a large catalogue into two metadata queries and preserves evidence rules', async () => {
    const types = Array.from({ length: 50 }, (_, index) => ({
      id: `type-${index}`, code: `UPLOAD_${index}`, targetType: 'DOCUMENT', requiresApproval: true,
    }));
    const drawingType = { id: 'drawing', code: 'DRAWING_TEST', targetType: 'DRAWING', requiresApproval: true };
    const documents = { findAll: jest.fn().mockResolvedValue([
      { id: 'new', documentTypeId: 'type-0', status: 'submitted' },
      { id: 'old', documentTypeId: 'type-0', status: 'approved' },
      { id: 'approved', documentTypeId: 'type-1', status: 'approved' },
    ]) };
    const drawings = { findAll: jest.fn().mockResolvedValue([
      { documentTypeId: 'drawing', status: 'Approved' },
      { documentTypeId: 'drawing', status: 'Superseded' },
      { documentTypeId: 'drawing', status: 'For Review' },
    ]) };
    const service = new DocumentEvidenceService(documents as any, drawings as any);
    const result = await service.resolveMany('project', [...types, drawingType] as any);
    expect(documents.findAll).toHaveBeenCalledTimes(1);
    expect(drawings.findAll).toHaveBeenCalledTimes(1);
    expect(documents.findAll.mock.calls[0][0]).toMatchObject({
      where: { projectId: 'project' }, attributes: ['id', 'documentTypeId', 'status'],
      order: [['created_at', 'DESC'], ['id', 'DESC']], raw: true,
    });
    expect(result.size).toBe(51);
    expect(result.get('type-0')).toMatchObject({ satisfied: false, recordId: 'new' });
    expect(result.get('type-1')?.satisfied).toBe(true);
    expect(result.get('type-49')?.status).toBe('MISSING');
    expect(result.get('drawing')?.satisfied).toBe(false);
    drawings.findAll.mockResolvedValue([{ documentTypeId: 'drawing', status: 'Approved' }, { documentTypeId: 'drawing', status: 'Superseded' }]);
    expect((await service.resolveMany('project', [drawingType] as any)).get('drawing')?.satisfied).toBe(true);
  });

  it('keeps native records authoritative without querying upload tables', async () => {
    const native = { resolve: jest.fn(async () => ({ satisfied: false, source: 'DATABASE', status: 'DRAFT' })) };
    const documents = { findAll: jest.fn() };
    const drawings = { findAll: jest.fn() };
    const service = new DocumentEvidenceService(documents as any, drawings as any, native as any);
    const result = await service.resolveMany('project', [{ id: 'brief', code: 'BRIEF_CLIENT_BRIEF', requiresApproval: true }] as any);
    expect(result.get('brief')).toMatchObject({ satisfied: false, source: 'DATABASE' });
    expect(native.resolve).toHaveBeenCalledWith('project', 'BRIEF_CLIENT_BRIEF', true);
    expect(documents.findAll).not.toHaveBeenCalled();
    expect(drawings.findAll).not.toHaveBeenCalled();
  });

  const type = {
    id: 'type',
    targetType: 'DOCUMENT',
    requiresApproval: true,
    requirementType: 'REQUIRED',
  } as any;
  it('does not waive required evidence because a requirement is disabled', () => {
    expect(mandatoryDocument(type, { isEnabled: false } as any)).toBe(true);
    expect(mandatoryDocument({ ...type, requirementType: 'CONDITIONAL' })).toBe(
      false,
    );
    expect(
      mandatoryDocument({ ...type, requirementType: 'CONDITIONAL' }, {
        isEnabled: true,
      } as any),
    ).toBe(true);
  });
  it.each(['submitted', 'rejected', 'archived', 'draft'])(
    'blocks latest %s document',
    async (status) => {
      const documents = { findOne: jest.fn().mockResolvedValue({ status }) };
      const service = new DocumentEvidenceService(documents as any, {} as any);
      expect(await service.satisfied('project', type)).toBe(false);
      expect(documents.findOne.mock.calls[0][0].where).toEqual({
        projectId: 'project',
        documentTypeId: 'type',
      });
    },
  );
  it('accepts submission when catalogue does not require review', async () => {
    const service = new DocumentEvidenceService(
      { findOne: async () => ({ status: 'submitted' }) } as any,
      {} as any,
    );
    expect(
      await service.satisfied('project', { ...type, requiresApproval: false }),
    ).toBe(true);
  });
  it('requires every current drawing sheet to pass', async () => {
    const drawings = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ status: 'Approved' }, { status: 'For Review' }]),
    };
    const service = new DocumentEvidenceService({} as any, drawings as any);
    expect(
      await service.satisfied('project', { ...type, targetType: 'DRAWING' }),
    ).toBe(false);
    drawings.findAll.mockResolvedValue([
      { status: 'Approved' },
      { status: 'Superseded' },
    ]);
    expect(
      await service.satisfied('project', { ...type, targetType: 'DRAWING' }),
    ).toBe(true);
  });
  it('blocks a phase with no configured catalogue', async () => {
    const evaluator = new DocumentTypeAllApprovedEvaluator(
      {} as any,
      { findAll: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      {} as any,
      { findAll: async () => [] } as any,
    );
    expect(
      (
        await evaluator.evaluate('project', {
          params: { phaseCode: 'missing' },
        } as any)
      ).passed,
    ).toBe(false);
  });
  it('queries manual confirmations by project AND condition', async () => {
    const logs = { findOne: jest.fn().mockResolvedValue(null) };
    const evaluator = new ManualApprovalEvaluator(logs as any);
    await evaluator.evaluate('project', {
      id: 'condition',
      gateDefinitionId: 'gate',
    } as any);
    expect(logs.findOne.mock.calls[0][0].where).toMatchObject({
      projectId: 'project',
      gateDefinitionId: 'gate',
      'snapshot.conditionId': 'condition',
    });
  });
});
