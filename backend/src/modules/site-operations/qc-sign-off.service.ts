import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QcSignOff } from './models/qc-sign-off.model';
import { QcSignOffItemResult } from './models/qc-sign-off-item-result.model';
import { ChecklistTemplate } from './models/checklist-template.model';
import { RecordQcSignOffDto } from './dto/qc.dto';
import { QcResult } from '../../common/enums/site-operations.enums';

@Injectable()
export class QcSignOffService {
  constructor(
    @InjectModel(QcSignOff) private signOffModel: typeof QcSignOff,
    @InjectModel(QcSignOffItemResult)
    private itemResultModel: typeof QcSignOffItemResult,
    @InjectModel(ChecklistTemplate)
    private templateModel: typeof ChecklistTemplate,
  ) {}

  /**
   * Records a pass/fail/rework QC result for a project + phase/step + trade,
   * with the checking user and timestamp, plus optional itemised results
   * against the checklist template. Attempt number auto-increments so rework
   * re-checks are tracked as a history, not overwrites.
   */
  async recordSignOff(dto: RecordQcSignOffDto): Promise<QcSignOff> {
    const template = await this.templateModel.findByPk(dto.checklistTemplateId);
    if (!template)
      throw new NotFoundException(
        `Checklist template ${dto.checklistTemplateId} not found`,
      );

    const previousAttempts = await this.signOffModel.count({
      where: {
        projectId: dto.projectId,
        stepId: dto.stepId,
        tradeTeamId: dto.tradeTeamId,
      },
    });

    const signOff = await this.signOffModel.create({
      projectId: dto.projectId,
      stepId: dto.stepId,
      tradeTeamId: dto.tradeTeamId,
      checklistTemplateId: dto.checklistTemplateId,
      result: dto.result,
      attemptNumber: previousAttempts + 1,
      checkedBy: dto.checkedBy,
      checkedAt: dto.checkedAt ? new Date(dto.checkedAt) : new Date(),
      notes: dto.notes ?? null,
    } as any);

    if (dto.itemResults?.length) {
      for (const item of dto.itemResults) {
        await this.itemResultModel.create({
          qcSignOffId: signOff.id,
          templateItemId: item.templateItemId,
          result: item.result,
          remark: item.remark ?? null,
        } as any);
      }
    }

    return this.getSignOffOrThrow(signOff.id);
  }

  async getSignOffOrThrow(id: number): Promise<QcSignOff> {
    const signOff = await this.signOffModel.findByPk(id, {
      include: [{ model: this.itemResultModel }],
    });
    if (!signOff) throw new NotFoundException(`QC sign-off ${id} not found`);
    return signOff;
  }

  /** Full QC history for a project, most recent first. */
  async getProjectHistory(projectId: number): Promise<QcSignOff[]> {
    return this.signOffModel.findAll({
      where: { projectId },
      order: [['checkedAt', 'DESC']],
      include: [{ model: this.itemResultModel }],
    });
  }

  /**
   * The latest QC result per phase/step + trade for a project — i.e. whether
   * handoff to the next trade is currently clear (latest result === PASS).
   */
  async getHandoffStatus(projectId: number) {
    const all = await this.signOffModel.findAll({
      where: { projectId },
      order: [['checkedAt', 'DESC']],
    });

    const latestByKey = new Map<string, QcSignOff>();
    for (const s of all) {
      const key = `${s.stepId}:${s.tradeTeamId}`;
      if (!latestByKey.has(key)) latestByKey.set(key, s);
    }

    return Array.from(latestByKey.values()).map((s) => ({
      stepId: s.stepId,
      tradeTeamId: s.tradeTeamId,
      result: s.result,
      attemptNumber: s.attemptNumber,
      checkedBy: s.checkedBy,
      checkedAt: s.checkedAt,
      clearedForHandoff: s.result === QcResult.PASS,
    }));
  }
}
