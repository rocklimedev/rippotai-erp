import { DocumentEvidenceService } from './document-evidence.service';
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
    private readonly evidence: DocumentEvidenceService,
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

    const evidence = await this.evidence.resolve(projectId, docType, true);

    return this.result(condition, evidence.satisfied, evidence.detail);
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
