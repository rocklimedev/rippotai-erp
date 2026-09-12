import {
  DocumentEvidenceService,
  mandatoryDocument,
} from './document-evidence.service';
import { DocumentTypeAllApprovedEvaluator } from './document-type-all-approved.evaluator';
import { ManualApprovalEvaluator } from './manual-approval.evaluator';

describe('gate evidence', () => {
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
      {} as any,
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
