import { ForbiddenException } from '@nestjs/common';
import { assertDocumentTypeAccess, hiddenDocumentTypes } from './document-type-access';

describe('document type access limits', () => {
  const user = { document_type_access: { restricted: 'none', viewable: 'view', editable: 'edit' } } as const;

  it('inherits module access for unconfigured and untyped documents', () => {
    expect(() => assertDocumentTypeAccess(user, 'other', 'update')).not.toThrow();
    expect(() => assertDocumentTypeAccess(user, null, 'read')).not.toThrow();
  });

  it('hides restricted types and blocks direct reads', () => {
    expect(hiddenDocumentTypes(user)).toEqual(['restricted']);
    expect(() => assertDocumentTypeAccess(user, 'RESTRICTED', 'read')).toThrow(ForbiddenException);
  });

  it('enforces type limits on updates, uploads, approvals and deletions', () => {
    expect(() => assertDocumentTypeAccess(user, 'viewable', 'read')).not.toThrow();
    expect(() => assertDocumentTypeAccess(user, 'viewable', 'update')).toThrow(ForbiddenException);
    expect(() => assertDocumentTypeAccess(user, 'editable', 'update')).not.toThrow();
    for (const action of ['create', 'approve', 'delete']) {
      expect(() => assertDocumentTypeAccess(user, 'editable', action)).toThrow(ForbiddenException);
    }
  });
});
