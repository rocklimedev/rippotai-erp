jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));

import { DocumentsService } from './document.service';
import { belongsToDocumentPhase } from './document-phase';

describe('project upload reflection', () => {
  it.each([true, false])(
    'applies the review policy (requiresApproval=%s)',
    async (requiresApproval) => {
      const model = { create: jest.fn(async (record) => record) };
      const service = new DocumentsService(
        model as any,
        {} as any,
        {} as any,
        {
          uploadFile: async () => ({ filename: 'stored', url: '/file' }),
        } as any,
        { findByPk: async () => ({ requiresApproval }) } as any,
      );
      const document = await service.create(
        { title: 'Evidence', documentTypeId: 'type' },
        {
          originalname: 'evidence.pdf',
          mimetype: 'application/pdf',
          size: 10,
        } as any,
      );
      expect(document.status).toBe(requiresApproval ? 'submitted' : 'approved');
      expect(document.filename).toBe('evidence.pdf');
    },
  );

  it('preserves an explicitly requested draft', async () => {
    const model = { create: jest.fn(async (record) => record) };
    const service = new DocumentsService(
      model as any,
      {} as any,
      {} as any,
      { uploadFile: async () => ({ filename: 'stored', url: '/file' }) } as any,
      {} as any,
    );
    expect(
      (await service.create({ title: 'Draft', status: 'draft' }, {} as any))
        .status,
    ).toBe('draft');
  });

  it('uses the phase relationship ahead of stale legacy codes', () => {
    const phase = { id: 'phase', phase_code: 'BRIEF' };
    expect(
      belongsToDocumentPhase(
        { projectPhaseId: 'phase', phaseCode: 'OLD' },
        phase,
      ),
    ).toBe(true);
    expect(
      belongsToDocumentPhase(
        { projectPhaseId: 'other', phaseCode: 'BRIEF' },
        phase,
      ),
    ).toBe(false);
    expect(belongsToDocumentPhase({ phaseCode: 'BRIEF' }, phase)).toBe(true);
  });
});
