import {
  DocumentEvidenceService,
  mandatoryDocument,
} from './document-evidence.service';
import { TaskDefinition } from '../../tasks/models/task-definitions.model';
import { TaskExecution } from '../../tasks/models/task-execution.model';
import { ProjectPhase } from '../../projects/models/project-phase.model';
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
    private readonly evidence: DocumentEvidenceService,
    @InjectModel(TaskDefinition) private readonly tasks: typeof TaskDefinition,
    @InjectModel(TaskExecution)
    private readonly executions: typeof TaskExecution,
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

    const docTypes = await this.documentTypeModel.findAll({
      where: { phaseCode, isActive: true },
    });
    const docTypeIds = docTypes.map((d) => d.id);

    if (docTypeIds.length === 0) {
      return this.result(
        condition,
        false,
        `No document types configured for phase "${phaseCode}" — configure the catalogue before clearing.`,
      );
    }

    const requirements = await this.requirementModel.findAll({
      where: { projectId, documentTypeId: docTypeIds },
    });

    const byType = new Map(requirements.map((r) => [r.documentTypeId, r]));
    const required = docTypes.filter((d) =>
      mandatoryDocument(d, byType.get(d.id)),
    );
    const total = required.length;
    const evidence = await Promise.all(
      required.map((d) => this.evidence.resolve(projectId, d)),
    );
    const completed = evidence.filter((e) => e.satisfied).length;
    const tasks = await this.tasks.findAll({
      where: { module: 'DOCUMENTS', mandatory: true },
      include: [
        {
          model: ProjectPhase,
          where: { phase_code: phaseCode, module: 'DOCUMENTS' },
          required: true,
        },
      ],
    });
    const executions = tasks.length
      ? await this.executions.findAll({
          where: {
            project_id: projectId,
            task_definition_id: tasks.map((t) => t.id),
          },
        })
      : [];
    const tasksPassed = tasks.every((t) =>
      executions.some(
        (e) => e.task_definition_id === t.id && e.status === 'DONE',
      ),
    );
    const passed = total > 0 && completed === total && tasksPassed;

    return {
      ...this.result(
        condition,
        passed,
        total === 0
          ? `No enabled document requirements found for phase "${phaseCode}" on this project.`
          : `${completed}/${total} documents in "${phaseCode}" completed; mandatory task/QC checks ${tasksPassed ? 'passed' : 'incomplete'}.`,
      ),
      meta: {
        evidence: required.map((d, i) => ({
          code: d.code,
          name: d.name,
          ...evidence[i],
        })),
      },
    };
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
