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
import { ARCHITECT_VISIT_STAGES } from './constants/architect-visit-stages.constant';
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
    return rows.flatMap((row) => {
      const standard = ARCHITECT_VISIT_STAGES.find(
        (s) => s.visit_no === row.visit_no && s.visit_no !== 20,
      );
      return standard ? [{ ...row.toJSON(), ...standard }] : [];
    });
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id);
    if (!row) throw new NotFoundException('Visit stage not found');
    const standard = ARCHITECT_VISIT_STAGES.find(
      (s) => s.visit_no === row.visit_no && s.visit_no !== 20,
    );
    if (!standard)
      throw new NotFoundException('Visit stage is unavailable for allocation');
    return { ...row.toJSON(), ...standard };
  }

  async create(dto: CreateVisitStageDto) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
  }

  async update(id: string, dto: UpdateVisitStageDto) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
  }

  /** Soft-disable instead of delete so historical visits keep their stage */
  async deactivate(id: string) {
    throw new BadRequestException(
      'Architect visit stages are fixed by the site visit schedule',
    );
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
