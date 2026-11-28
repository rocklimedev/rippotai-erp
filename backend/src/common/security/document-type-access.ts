import { ForbiddenException } from '@nestjs/common';
import { Op } from 'sequelize';

export const DOCUMENT_TYPE_LEVELS = ['none', 'view', 'edit', 'create', 'inherit'] as const;
type DocumentTypeLevel = typeof DOCUMENT_TYPE_LEVELS[number];
export type DocumentTypeLimits = Record<string, Exclude<DocumentTypeLevel, 'inherit'>>;
export interface DocumentTypeActor {
  document_type_access?: DocumentTypeLimits;
}

const actionRank: Record<string, number> = {
  read: 1,
  update: 2,
  create: 3,
};

export function assertDocumentTypeAccess(
  actor: DocumentTypeActor | undefined,
  typeId: string | null | undefined,
  action: string,
) {
  const level = typeId && actor?.document_type_access?.[typeId.toLowerCase()];
  if (level && DOCUMENT_TYPE_LEVELS.indexOf(level) < (actionRank[action] ?? 4)) {
    throw new ForbiddenException('This role has limited access to this document type');
  }
}

export function hiddenDocumentTypes(actor?: DocumentTypeActor): string[] {
  return Object.entries(actor?.document_type_access ?? {})
    .filter(([, level]) => level === 'none')
    .map(([id]) => id);
}

export function visibleDocumentTypeWhere(hiddenTypes: string[]): Record<PropertyKey, unknown> {
  return hiddenTypes.length
    ? { [Op.or]: [{ documentTypeId: null }, { documentTypeId: { [Op.notIn]: hiddenTypes } }] }
    : {};
}
