import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DailySiteReport } from './models/daily-site-report.model';
import { ManpowerEntry } from './models/manpower-entry.model';
import { Team } from '../process-workflow/models/team.model';
import { CreateDailySiteReportDto, UpdateDailySiteReportDto } from './dto/daily-report.dto';

@Injectable()
export class DailySiteReportService {
  constructor(
    @InjectModel(DailySiteReport) private reportModel: typeof DailySiteReport,
    @InjectModel(ManpowerEntry) private manpowerModel: typeof ManpowerEntry,
    @InjectModel(Team) private teamModel: typeof Team,
  ) {}

  async createReport(dto: CreateDailySiteReportDto): Promise<DailySiteReport> {
    const existing = await this.reportModel.findOne({
      where: { projectId: dto.projectId, reportDate: dto.reportDate },
    });
    if (existing) {
      throw new ConflictException(
        `A report for ${dto.reportDate} already exists for this project — use update instead`,
      );
    }

    const report = await this.reportModel.create({
      projectId: dto.projectId,
      reportDate: dto.reportDate,
      weatherCondition: dto.weatherCondition ?? null,
      weatherNotes: dto.weatherNotes ?? null,
      workCompleted: dto.workCompleted,
      issues: dto.issues ?? null,
      reportedBy: dto.reportedBy,
    } as any);

    if (dto.manpower?.length) {
      for (const entry of dto.manpower) {
        await this.manpowerModel.create({ ...entry, dailySiteReportId: report.id } as any);
      }
    }

    return this.getReportOrThrow(report.id);
  }

  async updateReport(id: number, dto: UpdateDailySiteReportDto): Promise<DailySiteReport> {
    const report = await this.getReportOrThrow(id);
    await report.update({
      weatherCondition: dto.weatherCondition ?? report.weatherCondition,
      weatherNotes: dto.weatherNotes ?? report.weatherNotes,
      workCompleted: dto.workCompleted ?? report.workCompleted,
      issues: dto.issues ?? report.issues,
    } as any);

    if (dto.manpower?.length) {
      await this.manpowerModel.destroy({ where: { dailySiteReportId: id } });
      for (const entry of dto.manpower) {
        await this.manpowerModel.create({ ...entry, dailySiteReportId: id } as any);
      }
    }

    return this.getReportOrThrow(id);
  }

  /** Marks the report as shared with the whole team (e.g. after an email/notification goes out). */
  async markShared(id: number): Promise<DailySiteReport> {
    const report = await this.getReportOrThrow(id);
    await report.update({ isShared: true, sharedAt: new Date() } as any);
    return report;
  }

  async getReportOrThrow(id: number): Promise<DailySiteReport> {
    const report = await this.reportModel.findByPk(id, {
      include: [{ model: this.manpowerModel, include: [this.teamModel] }],
    });
    if (!report) throw new NotFoundException(`Daily site report ${id} not found`);
    return report;
  }

  async getReportByDate(projectId: number, reportDate: string): Promise<DailySiteReport | null> {
    return this.reportModel.findOne({
      where: { projectId, reportDate },
      include: [{ model: this.manpowerModel, include: [this.teamModel] }],
    });
  }

  async listReports(projectId: number, from?: string, to?: string): Promise<DailySiteReport[]> {
    const where: any = { projectId };
    if (from || to) {
      const { Op } = require('sequelize');
      where.reportDate = {};
      if (from) where.reportDate[Op.gte] = from;
      if (to) where.reportDate[Op.lte] = to;
    }
    return this.reportModel.findAll({
      where,
      order: [['reportDate', 'DESC']],
      include: [{ model: this.manpowerModel, include: [this.teamModel] }],
    });
  }
}
