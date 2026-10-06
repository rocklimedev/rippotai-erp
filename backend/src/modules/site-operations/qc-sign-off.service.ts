import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QcSignOff } from './models/qc-sign-off.model';
import { QcSignOffItemResult } from './models/qc-sign-off-item-result.model';
import { ChecklistTemplate } from './models/checklist-template.model';
import { RecordQcSignOffDto } from './dto/qc.dto';
import { QcResult } from '../../common/enums/site-operations.enums';
import { Op } from 'sequelize';
import { automationBus } from '@/common/automation-bus';
import { Project } from '@/modules/projects/models/projects.model';
import { Step } from '../process-workflow/models/step.model';
import { Team } from '../process-workflow/models/team.model';

@Injectable()
export class QcSignOffService {
  constructor(
    @InjectModel(QcSignOff) private signOffModel: typeof QcSignOff,
    @InjectModel(QcSignOffItemResult)
    private itemResultModel: typeof QcSignOffItemResult,
    @InjectModel(ChecklistTemplate)
    private templateModel: typeof ChecklistTemplate,
    @InjectModel(Team) private teamModel: typeof Team,
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

    // Automation hook: failed / rework inspections trigger QC_FAILED rules.
    if (String(dto.result) !== 'PASS') {
      automationBus.emitEvent('QC_FAILED', {
        entityId: signOff.id,
        projectId: dto.projectId,
      });
    }

    return this.getSignOffOrThrow(signOff.id);
  }

  async getSignOffOrThrow(id: string): Promise<any> {
    const signOff = await this.signOffModel.findByPk(id, {
      include: this.listInclude(),
    });
    if (!signOff) throw new NotFoundException(`QC sign-off ${id} not found`);
    return (await this.withTeams([signOff]))[0];
  }

  // Attach teams in a batched lookup, keyed by their UUID.
  private readonly listInclude = () => [
    { model: this.itemResultModel },
    { model: Project, attributes: ['id', 'name'] },
    { model: Step, attributes: ['id', 'name', 'code'] },
    { model: ChecklistTemplate, attributes: ['id', 'name'] },
  ];

  private async withTeams(rows: QcSignOff[]): Promise<any[]> {
    const plain = rows.map((r) => r.get({ plain: true }) as any);
    const ids = [...new Set(plain.map((r) => String(r.tradeTeamId)))];
    const teams = ids.length
      ? await this.teamModel.findAll({
          where: { id: ids },
          attributes: ['id', 'name'],
        })
      : [];
    const byId = new Map(
      teams.map((t) => [String(t.get('id')), t.get({ plain: true })]),
    );
    return plain.map((r) => ({
      ...r,
      tradeTeam: byId.get(String(r.tradeTeamId)) ?? null,
    }));
  }

  /** Full QC history for a project, most recent first. */
  async getProjectHistory(projectId: string): Promise<any[]> {
    return this.history({ projectId });
  }

  /** QC history across projects (or one project), optional date range / result filter. */
  async history(
    q: { projectId?: string; from?: string; to?: string; status?: string } = {},
  ): Promise<any[]> {
    const where: any = {};
    if (q.projectId) where.projectId = q.projectId;
    if (q.status) where.result = String(q.status).toUpperCase();
    if (q.from || q.to) {
      where.checkedAt = {};
      if (q.from) where.checkedAt[Op.gte] = new Date(q.from);
      if (q.to) where.checkedAt[Op.lte] = new Date(`${q.to}T23:59:59`);
    }
    return this.withTeams(
      await this.signOffModel.findAll({
        where,
        order: [['checkedAt', 'DESC']],
        include: this.listInclude(),
      }),
    );
  }

  /**
   * The latest QC result per project + phase/step + trade — i.e. whether
   * handoff to the next trade is currently clear (latest result === PASS).
   * Without projectId it covers every project.
   */
  async getHandoffStatus(projectId?: string) {
    const all = await this.withTeams(
      await this.signOffModel.findAll({
        where: projectId ? { projectId } : {},
        order: [
          ['checkedAt', 'DESC'],
          ['attemptNumber', 'DESC'],
        ],
        include: this.listInclude().slice(1),
      }),
    );

    const latestByKey = new Map<string, any>();
    for (const s of all) {
      const key = `${s.projectId}:${s.stepId}:${s.tradeTeamId}`;
      if (!latestByKey.has(key)) latestByKey.set(key, s);
    }

    return Array.from(latestByKey.values()).map((s) => ({
      id: s.id,
      projectId: s.projectId,
      projectName: s.project?.name ?? null,
      stepId: s.stepId,
      stepName: s.step?.name ?? null,
      tradeTeamId: s.tradeTeamId,
      tradeTeamName: s.tradeTeam?.name ?? null,
      checklistTemplateName: s.checklistTemplate?.name ?? null,
      result: s.result,
      attemptNumber: s.attemptNumber,
      checkedBy: s.checkedBy,
      checkedAt: s.checkedAt,
      notes: s.notes,
      clearedForHandoff: s.result === QcResult.PASS,
    }));
  }
}
