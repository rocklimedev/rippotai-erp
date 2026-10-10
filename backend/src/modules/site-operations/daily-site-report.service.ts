import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { DailySiteReport } from './models/daily-site-report.model';
import { ManpowerEntry } from './models/manpower-entry.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Client } from '@/modules/clients/models/client.model';
import {
  CreateDailySiteReportDto,
  UpdateDailySiteReportDto,
} from './dto/daily-report.dto';

export interface ListReportsFilter {
  projectId?: string;
  from?: string;
  to?: string;
  status?: string;
  hasIssues?: boolean;
  limit?: number;
}

@Injectable()
export class DailySiteReportService {
  constructor(
    @InjectModel(DailySiteReport) private reportModel: typeof DailySiteReport,
    @InjectModel(ManpowerEntry) private manpowerModel: typeof ManpowerEntry,
    @InjectModel(Project) private projectModel: typeof Project,
    private readonly sequelize: Sequelize,
  ) {}

  private get include() {
    return [
      { model: this.manpowerModel },
      {
        model: this.projectModel,
        attributes: ['id', 'name', 'site_location', 'client_id', 'status'],
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      },
    ];
  }

  /** Fields shared by create + update, normalised from the DTO. */
  private fieldsFrom(dto: UpdateDailySiteReportDto) {
    const out: Record<string, unknown> = {};
    const copy = [
      'reportDate',
      'weatherCondition',
      'weatherNotes',
      'siteCondition',
      'workCompleted',
      'workItems',
      'materials',
      'equipment',
      'issueItems',
      'issues',
      'safetyIncident',
      'safetyNotes',
      'photos',
      'nextDayPlan',
      'reportedBy',
      'shareWithClient',
    ] as const;
    for (const k of copy) {
      if ((dto as any)[k] !== undefined) out[k] = (dto as any)[k];
    }
    if (dto.issueItems !== undefined) {
      out.needsAttention = dto.issueItems.some((i) => !!i.needsAttention);
    }
    return out;
  }

  /** Status transition + the "shared" fact that follows a submit with shareWithClient. */
  private applyStatus(
    target: Record<string, unknown>,
    status: string | undefined,
    current?: DailySiteReport,
  ) {
    if (!status) return;
    target.status = status;
    if (status === 'SUBMITTED' && current?.status !== 'SUBMITTED') {
      target.submittedAt = new Date();
    }
    if (status === 'DRAFT') target.submittedAt = null;
    const share =
      (target.shareWithClient as boolean | undefined) ??
      current?.shareWithClient ??
      false;
    if (status === 'SUBMITTED' && share && !current?.isShared) {
      target.isShared = true;
      target.sharedAt = new Date();
    }
  }

  private async replaceManpower(
    reportId: string,
    rows: CreateDailySiteReportDto['manpower'],
    transaction: Transaction,
  ) {
    await this.manpowerModel.destroy({
      where: { dailySiteReportId: reportId },
      transaction,
    });
    const clean = (rows || []).filter((r) => r.trade && r.headcount >= 0);
    if (clean.length) {
      await this.manpowerModel.bulkCreate(
        clean.map((r) => ({
          dailySiteReportId: reportId,
          trade: r.trade,
          contractorName: r.contractorName || null,
          headcount: r.headcount,
        })) as any,
        { transaction },
      );
    }
  }

  private async assertDateFree(
    projectId: string,
    reportDate: string,
    exceptId?: string,
  ) {
    const existing = await this.reportModel.findOne({
      where: {
        projectId,
        reportDate,
        ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}),
      },
      attributes: ['id'],
    });
    if (existing) {
      throw new ConflictException({
        message: `A report for ${reportDate} already exists for this project — open it and edit instead`,
        existingId: existing.id,
      });
    }
  }

  async createReport(dto: CreateDailySiteReportDto): Promise<DailySiteReport> {
    const project = await this.projectModel.findByPk(dto.projectId, {
      attributes: ['id'],
    });
    if (!project) throw new BadRequestException('Project not found');
    await this.assertDateFree(dto.projectId, dto.reportDate);

    const id = await this.sequelize.transaction(async (transaction) => {
      const values: Record<string, unknown> = {
        projectId: dto.projectId,
        status: 'DRAFT',
        ...this.fieldsFrom(dto),
      };
      this.applyStatus(values, dto.status ?? 'DRAFT');
      const report = await this.reportModel.create(values as any, {
        transaction,
      });
      await this.replaceManpower(report.id, dto.manpower, transaction);
      return report.id;
    });

    return this.getReportOrThrow(id);
  }

  async updateReport(
    id: string,
    dto: UpdateDailySiteReportDto,
  ): Promise<DailySiteReport> {
    const report = await this.getReportOrThrow(id);
    // Model fields are plain class properties, so read values through get() (dataValues).
    const cur = report.get({ plain: true }) as DailySiteReport;
    if (dto.reportDate && dto.reportDate !== String(cur.reportDate).slice(0, 10)) {
      await this.assertDateFree(cur.projectId, dto.reportDate, id);
    }

    await this.sequelize.transaction(async (transaction) => {
      const values = this.fieldsFrom(dto);
      this.applyStatus(values, dto.status, cur);
      await report.update(values as any, { transaction });
      if (dto.manpower !== undefined) {
        await this.replaceManpower(id, dto.manpower, transaction);
      }
    });

    return this.getReportOrThrow(id);
  }

  /** Marks the report as shared with the client (e.g. after an email/notification goes out). */
  async markShared(id: string): Promise<DailySiteReport> {
    const report = await this.getReportOrThrow(id);
    await report.update({
      isShared: true,
      shareWithClient: true,
      sharedAt: new Date(),
    } as any);
    return this.getReportOrThrow(id);
  }

  async deleteReport(id: string): Promise<{ id: string; deleted: true }> {
    const report = await this.getReportOrThrow(id);
    await this.sequelize.transaction(async (transaction) => {
      await this.manpowerModel.destroy({
        where: { dailySiteReportId: id },
        transaction,
      });
      await report.destroy({ transaction });
    });
    return { id, deleted: true };
  }

  async getReportOrThrow(id: string): Promise<DailySiteReport> {
    const report = await this.reportModel.findByPk(id, {
      include: this.include,
    });
    if (!report)
      throw new NotFoundException(`Daily site report ${id} not found`);
    return report;
  }

  async getReportByDate(
    projectId: string,
    reportDate: string,
  ): Promise<DailySiteReport | null> {
    return this.reportModel.findOne({
      where: { projectId, reportDate },
      include: this.include,
    });
  }

  async listReports(filter: ListReportsFilter): Promise<DailySiteReport[]> {
    const where: any = {};
    if (filter.projectId) where.projectId = filter.projectId;
    if (filter.status) where.status = filter.status;
    if (filter.hasIssues) {
      where[Op.and] = [
        Sequelize.literal(
          "COALESCE(JSON_LENGTH(`DailySiteReport`.`issue_items`), 0) > 0 OR (`DailySiteReport`.`issues` IS NOT NULL AND `DailySiteReport`.`issues` <> '')",
        ),
      ];
    }
    if (filter.from || filter.to) {
      where.reportDate = {};
      if (filter.from) where.reportDate[Op.gte] = filter.from;
      if (filter.to) where.reportDate[Op.lte] = filter.to;
    }
    return this.reportModel.findAll({
      where,
      order: [
        ['reportDate', 'DESC'],
        ['id', 'DESC'],
      ],
      include: this.include,
      limit: filter.limit && filter.limit > 0 ? filter.limit : 500,
    });
  }
}
