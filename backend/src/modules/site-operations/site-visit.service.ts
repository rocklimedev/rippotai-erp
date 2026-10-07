import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VisitAssignment } from './models/visit-assignment.model';
import { SiteVisitLog } from './models/site-visit-log.model';
import {
  CreateVisitAssignmentDto,
  LogSiteVisitDto,
  UpdateSiteVisitDto,
  UpdateVisitAssignmentDto,
} from './dto/visit.dto';
import {
  VisitorType,
  VisitStatus,
} from '../../common/enums/site-operations.enums';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import { Project } from '../projects/models/projects.model';
import { Team } from '../process-workflow/models/team.model';
import { ARCHITECT_VISIT_STAGES } from './constants/architect-visit-stages.constant';

@Injectable()
export class SiteVisitService {
  constructor(
    @InjectModel(VisitAssignment)
    private assignmentModel: typeof VisitAssignment,
    @InjectModel(SiteVisitLog) private visitLogModel: typeof SiteVisitLog,
    @InjectModel(ArchitectVisitStage)
    private stageModel: typeof ArchitectVisitStage,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Team) private teamModel: typeof Team,
  ) {}

  // ---------- Central assignment ----------

  async createAssignment(
    dto: CreateVisitAssignmentDto,
  ): Promise<VisitAssignment> {
    return this.assignmentModel.create(
      (await this.assignmentValues(dto)) as any,
    );
  }

  private async assignmentValues(dto: CreateVisitAssignmentDto) {
    if (!dto.scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.scheduledDate)) {
      throw new BadRequestException('A visit event requires a scheduled date');
    }
    if (!(await this.projectModel.findByPk(dto.projectId)))
      throw new NotFoundException('Project not found');
    const externalPartyName = dto.externalPartyName?.trim() || null;
    if (Boolean(dto.teamId) === Boolean(externalPartyName)) {
      throw new BadRequestException(
        'Allocate either an internal team or a named visitor',
      );
    }
    if (dto.teamId && !(await this.teamModel.findByPk(dto.teamId)))
      throw new NotFoundException('Team not found');
    let snapshot: {
      stageId: string | null;
      stageName: string | null;
      checksPurpose: string | null;
      visitType: string | null;
    } = {
      stageId: null,
      stageName: null,
      checksPurpose: null,
      visitType: null,
    };
    if (dto.visitorType === VisitorType.ARCHITECT) {
      if (!dto.stageId)
        throw new BadRequestException('Select an architect visit stage');
      const stage = await this.stageModel.findByPk(dto.stageId);
      const standard =
        stage &&
        ARCHITECT_VISIT_STAGES.find(
          (s) => s.visit_no === stage.visit_no && s.visit_no !== 20,
        );
      if (!standard || !stage.is_active)
        throw new BadRequestException(
          'Select a standard active architect visit stage',
        );
      snapshot = {
        stageId: stage.id,
        stageName: standard.stage,
        checksPurpose: standard.checks_purpose,
        visitType: standard.visit_type,
      };
    } else if (dto.stageId) {
      throw new BadRequestException(
        'Architect stages are only available for architect visits',
      );
    } else if (!dto.purpose?.trim()) {
      throw new BadRequestException('Enter the purpose of the visit');
    }
    return {
      projectId: dto.projectId,
      visitorType: dto.visitorType,
      teamId: dto.teamId || null,
      externalPartyName,
      scheduledDate: dto.scheduledDate,
      ...snapshot,
      purpose: snapshot.stageName || dto.purpose?.trim(),
      frequency: null,
      scheduleDays: null,
    };
  }

  async listAssignments(projectId?: string): Promise<VisitAssignment[]> {
    return this.assignmentModel.findAll({
      where: projectId ? { projectId } : {},
      include: [Project, Team, ArchitectVisitStage, SiteVisitLog],
      order: [
        ['scheduledDate', 'DESC'],
        ['id', 'DESC'],
      ],
    });
  }

  async updateAssignment(id: number, dto: UpdateVisitAssignmentDto) {
    return this.assignmentModel.sequelize!.transaction(async (transaction) => {
      const row = await this.assignmentModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) throw new NotFoundException('Visit assignment not found');
      if (!row.isActive)
        throw new ConflictException('Inactive allocations cannot be edited');
      if (
        (dto.projectId !== undefined && dto.projectId !== row.projectId) ||
        (dto.visitorType !== undefined &&
          dto.visitorType !== row.visitorType) ||
        (dto.stageId !== undefined && dto.stageId !== row.stageId)
      ) {
        throw new BadRequestException(
          'Project, visitor type and stage are locked; create a new allocation',
        );
      }
      if (
        await this.visitLogModel.count({
          where: { visitAssignmentId: id },
          transaction,
        })
      ) {
        throw new ConflictException(
          'An allocation with visit logs cannot be edited',
        );
      }
      const values = await this.assignmentValues({
        projectId: row.projectId,
        visitorType: row.visitorType,
        stageId: row.stageId ?? undefined,
        scheduledDate: row.scheduledDate ?? '',
        teamId: row.teamId ?? undefined,
        externalPartyName: row.externalPartyName ?? undefined,
        purpose: row.purpose ?? undefined,
        ...dto,
      });
      if (row.stageId) {
        Object.assign(values, {
          stageName: row.stageName,
          checksPurpose: row.checksPurpose,
          visitType: row.visitType,
          purpose: row.purpose,
        });
      }
      return row.update(values as any, { transaction });
    });
  }

  async deactivateAssignment(id: number): Promise<VisitAssignment> {
    return this.assignmentModel.sequelize!.transaction(async (transaction) => {
      const assignment = await this.assignmentModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!assignment)
        throw new NotFoundException(`Visit assignment ${id} not found`);
      if (
        await this.visitLogModel.count({
          where: { visitAssignmentId: id, status: VisitStatus.COMPLETED },
          transaction,
        })
      ) {
        throw new ConflictException(
          'Completed visit allocations cannot be cancelled',
        );
      }
      await this.visitLogModel.update(
        { status: VisitStatus.CANCELLED },
        {
          where: { visitAssignmentId: id, status: VisitStatus.SCHEDULED },
          transaction,
        },
      );
      await assignment.update({ isActive: false } as any, { transaction });
      return assignment;
    });
  }

  // ---------- Visit logging ----------

  async logVisit(dto: LogSiteVisitDto): Promise<SiteVisitLog> {
    if (!dto.visitorName?.trim() || !dto.loggedBy?.trim())
      throw new BadRequestException(
        'Visitor name and recorded by are required',
      );
    if (dto.status === VisitStatus.COMPLETED && !dto.actualVisitAt)
      throw new BadRequestException(
        'Completed visits require an actual visit time',
      );
    if (dto.actualVisitAt && dto.status && dto.status !== VisitStatus.COMPLETED)
      throw new BadRequestException(
        'Actual visit time is only valid for completed visits',
      );
    return this.assignmentModel.sequelize!.transaction(async (transaction) => {
      let purpose = dto.purpose ?? null;
      if (dto.visitAssignmentId) {
        const assignment = await this.assignmentModel.findByPk(
          dto.visitAssignmentId,
          { transaction, lock: transaction.LOCK.UPDATE },
        );
        if (!assignment)
          throw new NotFoundException(
            `Visit assignment ${dto.visitAssignmentId} not found`,
          );
        if (!assignment.isActive || !assignment.scheduledDate)
          throw new BadRequestException(
            'Assignment is inactive or requires event allocation',
          );
        if (
          assignment.projectId !== dto.projectId ||
          assignment.visitorType !== dto.visitorType ||
          assignment.scheduledDate !== dto.scheduledDate
        ) {
          throw new BadRequestException(
            'Visit must match the allocation project, visitor type and date',
          );
        }
        if (
          await this.visitLogModel.count({
            where: { visitAssignmentId: assignment.id },
            transaction,
          })
        )
          throw new ConflictException('This event already has a visit log');
        purpose = assignment.purpose;
      } else if (dto.visitorType === VisitorType.ARCHITECT) {
        throw new BadRequestException(
          'Architect visits require a stage-based event allocation',
        );
      }

      return this.visitLogModel.create(
        {
          projectId: dto.projectId,
          visitAssignmentId: dto.visitAssignmentId ?? null,
          visitorType: dto.visitorType,
          visitorName: dto.visitorName.trim(),
          scheduledDate: dto.scheduledDate,
          actualVisitAt: dto.actualVisitAt ? new Date(dto.actualVisitAt) : null,
          status:
            dto.status ??
            (dto.actualVisitAt ? VisitStatus.COMPLETED : VisitStatus.SCHEDULED),
          purpose,
          notes: dto.notes ?? null,
          loggedBy: dto.loggedBy.trim(),
        } as any,
        { transaction },
      );
    });
  }

  async updateVisit(
    id: number,
    dto: UpdateSiteVisitDto,
  ): Promise<SiteVisitLog> {
    return this.mutateVisit(id, dto.status, async (visit, transaction) =>
      visit.update(
        {
          status: dto.status ?? visit.status,
          actualVisitAt: dto.actualVisitAt
            ? new Date(dto.actualVisitAt)
            : dto.status === VisitStatus.COMPLETED
              ? visit.actualVisitAt || new Date()
              : visit.actualVisitAt,
          notes: dto.notes ?? visit.notes,
        } as any,
        { transaction },
      ),
    );
  }

  private async mutateVisit(
    id: number,
    status: VisitStatus | undefined,
    change: (visit: SiteVisitLog, transaction: any) => Promise<SiteVisitLog>,
  ) {
    const initial = await this.visitLogModel.findByPk(id);
    if (!initial) throw new NotFoundException(`Site visit ${id} not found`);
    return this.assignmentModel.sequelize!.transaction(async (transaction) => {
      // All event mutations lock allocation first, then log, matching cancellation.
      if (initial.visitAssignmentId) {
        const assignment = await this.assignmentModel.findByPk(
          initial.visitAssignmentId,
          { transaction, lock: transaction.LOCK.UPDATE },
        );
        if (
          status &&
          status !== VisitStatus.CANCELLED &&
          assignment?.scheduledDate &&
          !assignment.isActive
        ) {
          throw new ConflictException(
            'Cancelled allocations cannot be reopened or completed',
          );
        }
      }
      const visit = await this.visitLogModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!visit) throw new NotFoundException(`Site visit ${id} not found`);
      return change(visit, transaction);
    });
  }

  /** Marks a scheduled visit as completed (arrival check-in). */
  async checkIn(id: number): Promise<SiteVisitLog> {
    return this.mutateVisit(
      id,
      VisitStatus.COMPLETED,
      async (visit, transaction) => {
        if (visit.status === VisitStatus.COMPLETED) return visit;
        if (visit.status !== VisitStatus.SCHEDULED)
          throw new ConflictException(
            'Only scheduled visits can be checked in',
          );
        await visit.update(
          {
            status: VisitStatus.COMPLETED,
            actualVisitAt: new Date(),
          } as any,
          { transaction },
        );
        return visit;
      },
    );
  }

  async getVisitLog(
    projectId?: string,
    from?: string,
    to?: string,
  ): Promise<SiteVisitLog[]> {
    const where: any = projectId ? { projectId } : {};
    if (from || to) {
      const { Op } = require('sequelize');
      where.scheduledDate = {};
      if (from) where.scheduledDate[Op.gte] = from;
      if (to) where.scheduledDate[Op.lte] = to;
    }
    return this.visitLogModel.findAll({
      where,
      order: [['scheduledDate', 'DESC']],
      include: [Project, { model: this.assignmentModel }],
    });
  }

  async getVisit(id: number) {
    const visit = await this.visitLogModel.findByPk(id, {
      include: [Project, VisitAssignment],
    });
    if (!visit) throw new NotFoundException('Site visit not found');
    return visit;
  }
}
