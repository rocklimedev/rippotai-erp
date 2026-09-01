import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { Document } from '@/modules/documents/models/document.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';

@Injectable()
export class DocumentApprovedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.DOCUMENT_APPROVED;

  constructor(
    @InjectModel(Document) private readonly document: typeof Document,
    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const documentTypeCode: string = condition.params?.documentTypeCode;
    const docType = await this.documentTypeModel.findOne({
      where: { code: documentTypeCode },
    });

    if (!docType) {
      return this.result(
        condition,
        false,
        `Document type "${documentTypeCode}" is not configured.`,
      );
    }

    const doc = await this.document.findOne({
      where: { projectId, documentTypeId: docType.id, status: 'approved' },
      order: [['updatedAt', 'DESC']],
    });

    return this.result(
      condition,
      !!doc,
      doc
        ? `"${docType.name}" is approved (v${doc.get('version')}).`
        : `"${docType.name}" has not been approved yet.`,
    );
  }

  private result(
    condition: GateCondition,
    passed: boolean,
    detail: string,
  ): GateConditionResult {
    return {
      conditionId: condition.id,
      type: this.type,
      label: condition.label,
      optional: condition.optional,
      passed,
      detail,
    };
  }
}
