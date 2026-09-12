import {
  NativeEvidenceService,
  NATIVE_EVIDENCE,
  EvidenceResult,
} from './native-evidence.service';
import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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
