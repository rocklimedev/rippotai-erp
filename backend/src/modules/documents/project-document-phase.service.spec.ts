import { ProjectDocumentPhaseService } from './project-document-phase.service';

describe('project document checklist evidence', () => {
  it.each([true, false])('uses source evidence in both trees (satisfied=%s)', async (satisfied) => {
    const type = { id: 'brief', code: 'BRIEF_CLIENT_BRIEF', projectPhaseId: 'phase', requirementType: 'REQUIRED' };
    const evidence = { satisfied, source: 'DATABASE', recordId: 'record', actionUrl: '/crm/brief/record' };
    const resolver = { resolve: jest.fn().mockResolvedValue(evidence) };
    const documents = {
      findAll: jest.fn().mockResolvedValue([]),
      getTableName: () => 'documents',
      rawAttributes: {},
    };
    const service = new ProjectDocumentPhaseService(
      { findAll: async () => [{ id: 'project', name: 'Project' }] } as any,
      { findAll: async () => [{ id: 'phase', title: 'Brief' }] } as any,
      { findAll: async () => [type] } as any,
      documents as any,
      resolver as any,
    );
    const single = await service.getProjectDocumentPhaseList('project');
    const all = await service.getAllProjectsDocumentPhaseTree();
    for (const tree of [single, all.projects[0]]) {
      expect(tree.phases[0].documents[0]).toMatchObject({ evidence, isUploaded: satisfied, uploadCount: 0 });
      expect(tree.summary.uploadedRequiredDocuments).toBe(satisfied ? 1 : 0);
      expect(tree.phases[0].isComplete).toBe(satisfied);
    }
    expect(resolver.resolve).toHaveBeenCalledWith('project', type);
  });
});
