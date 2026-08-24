import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VisitAssignment } from './models/visit-assignment.model';
import { SiteVisitLog } from './models/site-visit-log.model';
import {
  CreateVisitAssignmentDto,
  LogSiteVisitDto,
  UpdateSiteVisitDto,
} from './dto/visit.dto';
import { VisitStatus } from '../../common/enums/site-operations.enums';

@Injectable()
export class SiteVisitService {
  constructor(
    @InjectModel(VisitAssignment)
    private assignmentModel: typeof VisitAssignment,
    @InjectModel(SiteVisitLog) private visitLogModel: typeof SiteVisitLog,
  ) {}

  // ---------- Central assignment ----------

  async createAssignment(
    dto: CreateVisitAssignmentDto,
  ): Promise<VisitAssignment> {
    return this.assignmentModel.create({ ...dto } as any);
  }

  async listAssignments(projectId: number): Promise<VisitAssignment[]> {
    return this.assignmentModel.findAll({
      where: { projectId, isActive: true },
    });
  }

  async deactivateAssignment(id: number): Promise<VisitAssignment> {
    const assignment = await this.assignmentModel.findByPk(id);
    if (!assignment)
      throw new NotFoundException(`Visit assignment ${id} not found`);
    await assignment.update({ isActive: false } as any);
    return assignment;
  }

  // ---------- Visit logging ----------

  async logVisit(dto: LogSiteVisitDto): Promise<SiteVisitLog> {
    if (dto.visitAssignmentId) {
      const assignment = await this.assignmentModel.findByPk(
        dto.visitAssignmentId,
      );
      if (!assignment)
        throw new NotFoundException(
          `Visit assignment ${dto.visitAssignmentId} not found`,
        );
    }

    return this.visitLogModel.create({
      projectId: dto.projectId,
      visitAssignmentId: dto.visitAssignmentId ?? null,
      visitorType: dto.visitorType,
      visitorName: dto.visitorName,
      scheduledDate: dto.scheduledDate,
      actualVisitAt: dto.actualVisitAt ? new Date(dto.actualVisitAt) : null,
      status:
        dto.status ??
        (dto.actualVisitAt ? VisitStatus.COMPLETED : VisitStatus.SCHEDULED),
      purpose: dto.purpose ?? null,
      notes: dto.notes ?? null,
      loggedBy: dto.loggedBy,
    } as any);
  }

  async updateVisit(
    id: number,
    dto: UpdateSiteVisitDto,
  ): Promise<SiteVisitLog> {
    const visit = await this.visitLogModel.findByPk(id);
    if (!visit) throw new NotFoundException(`Site visit ${id} not found`);

    await visit.update({
      status: dto.status ?? visit.status,
      actualVisitAt: dto.actualVisitAt
        ? new Date(dto.actualVisitAt)
        : visit.actualVisitAt,
      notes: dto.notes ?? visit.notes,
    } as any);
    return visit;
  }

  /** Marks a scheduled visit as completed (arrival check-in). */
  async checkIn(id: number): Promise<SiteVisitLog> {
    const visit = await this.visitLogModel.findByPk(id);
    if (!visit) throw new NotFoundException(`Site visit ${id} not found`);
    await visit.update({
      status: VisitStatus.COMPLETED,
      actualVisitAt: new Date(),
    } as any);
    return visit;
  }

  async getVisitLog(
    projectId: number,
    from?: string,
    to?: string,
  ): Promise<SiteVisitLog[]> {
    const where: any = { projectId };
    if (from || to) {
      const { Op } = require('sequelize');
      where.scheduledDate = {};
      if (from) where.scheduledDate[Op.gte] = from;
      if (to) where.scheduledDate[Op.lte] = to;
    }
    return this.visitLogModel.findAll({
      where,
      order: [['scheduledDate', 'DESC']],
      include: [{ model: this.assignmentModel }],
    });
  }
}
