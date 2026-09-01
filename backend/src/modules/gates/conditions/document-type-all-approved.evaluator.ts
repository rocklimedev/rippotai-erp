import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConditionEvaluator } from './condition-evaluator.interface';
import { GateConditionType } from '@/common/enums/gates.enum';
import { GateConditionResult } from '../../../common/interfaces/gate-condition-result.interface';
import { GateCondition } from '@/modules/gates/models/gate-condition.model';
import { DocumentRequirement } from '@/modules/documents/models/document-requirement.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';

/**
 * Used for the two gates that gate an entire drawing set at once
 * (TENDER_DRAWINGS_FINALISED, WORKING_DRAWINGS_GFC) rather than one document
 * at a time — every document_requirements row enabled for the project whose
 * document_type.phase_code matches must be is_completed = 1.
 */
@Injectable()
export class DocumentTypeAllApprovedEvaluator implements ConditionEvaluator {
  readonly type = GateConditionType.DOCUMENT_TYPE_ALL_APPROVED;

  constructor(
    @InjectModel(DocumentRequirement)
    private readonly requirementModel: typeof DocumentRequirement,
    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,
  ) {}

  async evaluate(
    projectId: string,
    condition: GateCondition,
  ): Promise<GateConditionResult> {
    const phaseCode: string = condition.params?.phaseCode;

    const docTypeIds = (
      await this.documentTypeModel.findAll({
        where: { phaseCode, isActive: true },
      })
    ).map((d) => d.id);

    if (docTypeIds.length === 0) {
      return this.result(
        condition,
        true,
        `No document types configured for phase "${phaseCode}" — nothing to block on.`,
      );
    }

    const requirements = await this.requirementModel.findAll({
      where: { projectId, documentTypeId: docTypeIds, isEnabled: true },
    });

    const total = requirements.length;
    const completed = requirements.filter((r) => r.isCompleted).length;
    const passed = total > 0 && completed === total;

    return this.result(
      condition,
      passed,
      total === 0
        ? `No enabled document requirements found for phase "${phaseCode}" on this project.`
        : `${completed}/${total} documents in "${phaseCode}" completed.`,
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
