import {
  NativeEvidenceService,
  NATIVE_EVIDENCE,
} from './native-evidence.service';
import { DocumentEvidenceService } from './document-evidence.service';

describe('native evidence routing', () => {
  function setup(rows: any[] = []) {
    const query = jest.fn().mockResolvedValue(rows);
    return { query, service: new NativeEvidenceService({ query } as any) };
  }
  it('routes an approved scope to its project-scoped source without uploading', async () => {
    const { service, query } = setup([{ id: 'scope', status: 'ACCEPTED' }]);
    const result = await service.resolve(
      'project',
      'BRIEF_SCOPE_OF_WORK',
      true,
    );
    expect(result).toMatchObject({
      satisfied: true,
      source: 'DATABASE',
      recordId: 'scope',
    });
    expect(query.mock.calls[0][0]).toContain(
      'FROM scope_of_work WHERE project_id = :projectId AND deleted_at IS NULL',
    );
    expect(query.mock.calls[0][1].replacements).toEqual({
      projectId: 'project',
    });
  });
  it.each(['DRAFT', 'REJECTED', 'CANCELLED'])(
    'blocks %s estimate even when an older approval exists',
    async (status) => {
      const { service, query } = setup([{ id: 'latest', status }]);
      expect(
        (await service.resolve('p', 'VENDOR_ESTIMATE', true))?.satisfied,
      ).toBe(false);
      expect(query.mock.calls[0][0]).toContain(
        'ORDER BY version DESC, created_at DESC, id DESC LIMIT 1',
      );
      expect(query.mock.calls[0][0]).not.toContain("status = 'approved'");
    },
  );
  it('does not fall back to an uploaded document for a missing native record', async () => {
    const { service } = setup();
    const documents = { findOne: jest.fn() };
    const evidence = new DocumentEvidenceService(
      documents as any,
      {} as any,
      service,
    );
    expect(
      await evidence.satisfied('p', { code: 'BRIEF_CLIENT_BRIEF' } as any),
    ).toBe(false);
    expect(documents.findOne).not.toHaveBeenCalled();
  });
  it('keeps unknown catalogue items on the upload path', async () => {
    const { service, query } = setup();
    expect(await service.resolve('p', 'PLAN_SIGNED_CONTRACT', true)).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
  it('requires client acceptance of the payment schedule', async () => {
    const { service } = setup([
      { id: 's', status: 'ACTIVE', accepted_by_client: 0 },
    ]);
    expect(
      (await service.resolve('p', 'PLAN_PAYMENT_SCHEDULE', true))?.satisfied,
    ).toBe(false);
  });
  it('does not treat a recorded recce as signed approval', async () => {
    const { service } = setup([{ id: 'r', status: 'RECORDED' }]);
    expect(
      (await service.resolve('p', 'RECCE_SITE_RECCE', false))?.satisfied,
    ).toBe(true);
    expect(
      (await service.resolve('p', 'RECCE_SITE_RECCE', true))?.satisfied,
    ).toBe(false);
  });
  it('requires content for site analysis', async () => {
    const { service } = setup([
      { id: 'r', status: 'RECORDED', existing_condition: ' ' },
    ]);
    expect(
      (await service.resolve('p', 'RECCE_SITE_ANALYSIS', false))?.satisfied,
    ).toBe(false);
  });
  it('does not accept an empty drawings planner', async () => {
    const { service } = setup([
      { id: 'plan', status: 'PLANNED', is_active: 1, item_count: 0 },
    ]);
    expect(
      (await service.resolve('p', 'PLAN_DRAWINGS_PLAN', false))?.satisfied,
    ).toBe(false);
  });
  it('scopes token receipts through an active project payment schedule', async () => {
    const { service, query } = setup([{ id: 'paid', status: 'PAID' }]);
    expect(
      (await service.resolve('p', 'PLAN_PAYMENT_RECEIPT', false))?.satisfied,
    ).toBe(true);
    expect(query.mock.calls[0][0]).toContain(
      "status IN ('ACTIVE','COMPLETED')",
    );
    expect(query.mock.calls[0][0]).toContain("milestone_code = 'TOKEN'");
  });
  it('only uses reviewed source table identifiers', () => {
    for (const config of Object.values(NATIVE_EVIDENCE))
      expect(config.table).toMatch(/^[a-z_]+$/);
  });
});
