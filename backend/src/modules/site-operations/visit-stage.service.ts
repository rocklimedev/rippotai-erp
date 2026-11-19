import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import {
  CreateVisitStageDto,
  UpdateVisitStageDto,
} from './dto/visit-stage.dto';
import { UniqueConstraintError } from 'sequelize';
import { ArchitectSiteVisit } from './models/architect-site-visit.model';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';
import { buildArchitectVisitScheduleWorkbook } from './architect-visit-schedule-excel';

@Injectable()
export class VisitStageService {
  constructor(
    @InjectModel(ArchitectVisitStage)
    private readonly model: typeof ArchitectVisitStage,
  ) {}

  async findAll(includeInactive = false) {
    const rows = await this.model.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [['visit_no', 'ASC']],
    });
    return rows.map((row) => row.toJSON());
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id);
    if (!row) throw new NotFoundException('Visit stage not found');
    return row;
  }

  private values(dto: UpdateVisitStageDto) {
    const values = { ...dto };
    for (const key of ['stage', 'checks_purpose'] as const) {
      if (values[key] !== undefined) {
        values[key] = values[key].trim();
        if (!values[key]) throw new BadRequestException(key + ' is required');
      }
    }
    return values;
  }

  async create(dto: CreateVisitStageDto) {
    try {
      return await this.model.create(this.values(dto) as any);
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new BadRequestException('Visit number already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateVisitStageDto) {
    const row = await this.findOne(id);
    try {
      return await row.update(this.values(dto));
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new BadRequestException('Visit number already exists');
      throw error;
    }
  }

  /** Preserve referenced stages and historical allocation snapshots. */
  async deactivate(id: string) {
    const row = await this.findOne(id);
    await row.update({ is_active: false });
    return { success: true };
  }

  /**
   * ARCHITECT SITE VISIT SCHEDULE TEMPLATE.xlsx: the visit stages, and — for a
   * project — each stage's visit status, dates, architect and findings.
   */
  async exportSchedule(projectId?: string) {
    const stages = await this.findAll();
    let projectName: string | null = null;
    const byStage = new Map<string, any>();
    if (projectId) {
      const project = await Project.findByPk(projectId, {
        attributes: ['id', 'name'],
      });
      if (!project) throw new NotFoundException('Project not found');
      projectName = project.name;
      const visits = await ArchitectSiteVisit.findAll({
        where: { project_id: projectId },
        include: [{ model: User, as: 'architect', attributes: ['id', 'name'] }],
      });
      for (const v of visits) byStage.set(v.stage_id, v.toJSON());
    }
    return buildArchitectVisitScheduleWorkbook({
      projectName,
      rows: stages.map((s: any) => {
        const v = byStage.get(s.id);
        return {
          visit_no: s.visit_no,
          stage: s.stage,
          checks_purpose: s.checks_purpose,
          visit_type: s.visit_type,
          remarks: s.remarks,
          visit: v
            ? {
                status: v.status,
                scheduled_date: v.scheduled_date,
                visited_date: v.visited_date,
                architect: v.architect?.name ?? null,
                findings: v.findings,
                remarks: v.remarks,
                hold_released: v.hold_released,
              }
            : projectId
              ? { status: 'Not Scheduled' }
              : null,
        };
      }),
    });
  }
}
