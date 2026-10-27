import {
  NativeEvidenceService,
  NATIVE_EVIDENCE,
  EvidenceResult,
} from './native-evidence.service';
import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Document } from '@/modules/documents/models/document.model';
import { Drawing } from '@/modules/documents/models/drawing.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { DocumentRequirement } from '@/modules/documents/models/document-requirement.model';

export function mandatoryDocument(
  type: DocumentType,
  requirement?: DocumentRequirement,
): boolean {
  const rule = requirement?.requirementType ?? type.requirementType;
  return (
    rule === 'REQUIRED' ||
    (rule === 'CONDITIONAL' && requirement?.isEnabled === true)
  );
}

@Injectable()
export class DocumentEvidenceService {
  constructor(
    @InjectModel(Document) private readonly documents: typeof Document,
    @InjectModel(Drawing) private readonly drawings: typeof Drawing,
    @Optional() private readonly native?: NativeEvidenceService,
  ) {}

  isNative(type: DocumentType): boolean {
    return !!NATIVE_EVIDENCE[type.code];
  }

  /** Read only evidence metadata, once per source, rather than once per type. */
  async resolveMany(projectId: string, types: DocumentType[]): Promise<Map<string, EvidenceResult>> {
    const uploads = types.filter((type) => !this.isNative(type) && type.targetType !== 'DRAWING');
    const drawingTypes = types.filter((type) => !this.isNative(type) && type.targetType === 'DRAWING');
    const [documents, drawings] = await Promise.all([
      uploads.length ? this.documents.findAll({
        where: { projectId, documentTypeId: { [Op.in]: uploads.map((type) => type.id) } },
        attributes: ['id', 'documentTypeId', 'status'],
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        raw: true,
      }) : [],
      drawingTypes.length ? this.drawings.findAll({
        where: { projectId, documentTypeId: { [Op.in]: drawingTypes.map((type) => type.id) } },
        attributes: ['documentTypeId', 'status'],
        raw: true,
      }) : [],
    ]);
    const latestByType = new Map<string, Document>();
    for (const document of documents) {
      if (!document.documentTypeId) continue;
      if (!latestByType.has(document.documentTypeId)) latestByType.set(document.documentTypeId, document);
    }
    const drawingsByType = new Map<string, Drawing[]>();
    for (const drawing of drawings) {
      if (!drawing.documentTypeId) continue;
      const group = drawingsByType.get(drawing.documentTypeId) ?? [];
      group.push(drawing);
      drawingsByType.set(drawing.documentTypeId, group);
    }
    // Reuse the authoritative single-type rules against the preloaded metadata.
    const snapshot = new DocumentEvidenceService(
      { findOne: async ({ where }) => latestByType.get(where.documentTypeId) ?? null } as any,
      { findAll: async ({ where }) => drawingsByType.get(where.documentTypeId) ?? [] } as any,
      this.native,
    );
    const results = new Map<string, EvidenceResult>();
    let next = 0;
    // Bound native-source SQL concurrency so large catalogues do not flood the pool.
    await Promise.all(Array.from({ length: Math.min(4, types.length) }, async () => {
      while (next < types.length) {
        const type = types[next++];
        results.set(type.id, await snapshot.resolve(projectId, type));
      }
    }));
    return results;
  }

  async resolve(
    projectId: string,
    type: DocumentType,
    requireApproval = type.requiresApproval,
  ): Promise<EvidenceResult> {
    if (this.isNative(type)) {
      if (!this.native)
        throw new Error('Native evidence provider is not registered');
      return (await this.native.resolve(
        projectId,
        type.code,
        requireApproval,
      ))!;
    }
    if (type.targetType !== 'DRAWING') {
      const latest = await this.documents.findOne({
        where: { projectId, documentTypeId: type.id },
        order: [
          ['created_at', 'DESC'],
          ['id', 'DESC'],
        ],
      });
      const satisfied =
        !!latest &&
        (requireApproval
          ? latest.status === 'approved'
          : ['submitted', 'under_review', 'approved'].includes(
              latest.status ?? '',
            ));
      return {
        satisfied,
        source: 'UPLOAD',
        sourceTable: 'documents',
        sourceLabel: 'Uploaded document',
        recordId: latest?.id ?? null,
        status: latest?.status ?? 'MISSING',
        detail: satisfied
          ? 'Uploaded evidence meets the requirement.'
          : latest
            ? `Document uploaded; status: ${latest.status}.`
            : 'Upload the required evidence.',
      };
    }
    const satisfied = await this.uploadSatisfied(
      projectId,
      type,
      requireApproval,
    );
    return {
      satisfied,
      source: type.targetType === 'DRAWING' ? 'DRAWING' : 'UPLOAD',
      sourceTable: type.targetType === 'DRAWING' ? 'drawings' : 'documents',
      sourceLabel:
        type.targetType === 'DRAWING' ? 'Drawing' : 'Uploaded document',
      recordId: null,
      status: satisfied ? 'SATISFIED' : 'MISSING_OR_PENDING',
      detail: satisfied
        ? 'Uploaded evidence meets the requirement.'
        : 'Upload or review the required evidence.',
    };
  }

  async satisfied(
    projectId: string,
    type: DocumentType,
    requireApproval = type.requiresApproval,
  ): Promise<boolean> {
    return (await this.resolve(projectId, type, requireApproval)).satisfied;
  }

  private async uploadSatisfied(
    projectId: string,
    type: DocumentType,
    requireApproval = type.requiresApproval,
  ): Promise<boolean> {
    if (type.targetType === 'DRAWING') {
      const rows = await this.drawings.findAll({
        where: { projectId, documentTypeId: type.id },
      });
      const current = rows.filter((row) => row.status !== 'Superseded');
      return (
        current.length > 0 &&
        current.every((row) =>
          requireApproval
            ? row.status === 'Approved'
            : ['For Review', 'Approved'].includes(row.status ?? ''),
        )
      );
    }
    // New submissions supersede older approvals for the same catalogue type.
    const latest = await this.documents.findOne({
      where: { projectId, documentTypeId: type.id },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
    });
    return (
      !!latest &&
      (requireApproval
        ? latest.status === 'approved'
        : ['submitted', 'under_review', 'approved'].includes(
            latest.status ?? '',
          ))
    );
  }
}
