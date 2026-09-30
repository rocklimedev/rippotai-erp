import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { ArchitectSiteVisit } from './models/architect-site-visit.model';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { VisitStatus, VisitType } from '@/common/enums/architect-visit.enums';
import {
  CreateSiteVisitDto,
  GenerateProjectVisitsDto,
  QuerySiteVisitDto,
  UpdateSiteVisitDto,
} from './dto/site-visit.dto';

const INCLUDES = [
  { model: ArchitectVisitStage, as: 'stage' },
  { model: Project, as: 'project', attributes: ['id', 'name', 'slug'] },
  { model: User, as: 'architect', attributes: ['id', 'name'], required: false },
];

@Injectable()
export class SiteVisitService {
  constructor(
    @InjectModel(ArchitectSiteVisit)
    private readonly model: typeof ArchitectSiteVisit,
    @InjectModel(ArchitectVisitStage)
    private readonly stages: typeof ArchitectVisitStage,
  ) {}

  async create(dto: CreateSiteVisitDto, userId?: string) {
    if (
      await this.model.findOne({
        where: { project_id: dto.project_id, stage_id: dto.stage_id },
      })
    ) {
      throw new ConflictException('This visit already exists for the project');
    }
    const status =
      dto.status ??
      (dto.scheduled_date ? VisitStatus.SCHEDULED : VisitStatus.NOT_SCHEDULED);
    const row = await this.model.create({
      ...dto,
      status,
      created_by: userId ?? null,
    } as any);
    return this.findOne(row.id);
  }

  /** Creates visits 1..21 for a project in one go (skips ones that already exist). */
  async generateForProject(dto: GenerateProjectVisitsDto, userId?: string) {
    const stages = await this.stages.findAll({
      where: { is_active: true },
      order: [['visit_no', 'ASC']],
    });
    const existing = await this.model.findAll({
      where: { project_id: dto.project_id },
      attributes: ['stage_id'],
    });
    const have = new Set(existing.map((e) => e.stage_id));
    const toCreate = stages
      .filter((s) => !have.has(s.id))
      .map((s) => ({
        project_id: dto.project_id,
        stage_id: s.id,
        architect_id: dto.architect_id ?? null,
        status: VisitStatus.NOT_SCHEDULED,
        created_by: userId ?? null,
      }));
    if (toCreate.length) await this.model.bulkCreate(toCreate as any);
    return {
      created: toCreate.length,
      skipped: stages.length - toCreate.length,
    };
  }

  async findAll(q: QuerySiteVisitDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const where: WhereOptions<any> = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.architect_id) where.architect_id = q.architect_id;
    if (q.status) where.status = q.status;
    if (q.from_date || q.to_date) {
      where.scheduled_date = {
        ...(q.from_date && { [Op.gte]: q.from_date }),
        ...(q.to_date && { [Op.lte]: q.to_date }),
      };
    }
    const stageWhere: any = {};
    if (q.visit_type) stageWhere.visit_type = q.visit_type;
    if (q.pending_hold) {
      stageWhere.visit_type = VisitType.HOLD_POINT;
      where.hold_released = false;
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [
        {
          ...INCLUDES[0],
          where: Object.keys(stageWhere).length ? stageWhere : undefined,
          required: !!Object.keys(stageWhere).length,
        },
        INCLUDES[1],
        INCLUDES[2],
      ] as any,
      order: [[{ model: ArchitectVisitStage, as: 'stage' }, 'visit_no', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id, { include: INCLUDES as any });
    if (!row) throw new NotFoundException('Site visit not found');
    return row;
  }

  async update(id: string, dto: UpdateSiteVisitDto, userId?: string) {
    const row = await this.findOne(id);
    const patch: any = { ...dto, updated_by: userId ?? null };

    if (
      dto.status === VisitStatus.COMPLETED &&
      !dto.visited_date &&
      !row.visited_date
    ) {
      patch.visited_date = new Date().toISOString().slice(0, 10);
    }
    if (
      dto.scheduled_date &&
      !dto.status &&
      row.status === VisitStatus.NOT_SCHEDULED
    ) {
      patch.status = VisitStatus.SCHEDULED;
    }
    if (dto.hold_released !== undefined) {
      if (row.stage.visit_type !== VisitType.HOLD_POINT) {
        throw new BadRequestException('Only Hold Point visits can be released');
      }
      const finalStatus = patch.status ?? row.status;
      if (dto.hold_released && finalStatus !== VisitStatus.COMPLETED) {
        throw new BadRequestException(
          'Complete the visit before releasing the hold point',
        );
      }
      patch.hold_released_at = dto.hold_released ? new Date() : null;
      patch.hold_released_by = dto.hold_released ? (userId ?? null) : null;
    }
    await row.update(patch);
    return this.findOne(id);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await row.destroy();
    return { message: 'Site visit deleted' };
  }

  /** Progress of a project's visit schedule + next hold point blocking work */
  async projectProgress(projectId: string) {
    const rows = await this.model.findAll({
      where: { project_id: projectId },
      include: [{ model: ArchitectVisitStage, as: 'stage' }],
      order: [[{ model: ArchitectVisitStage, as: 'stage' }, 'visit_no', 'ASC']],
    });
    const completed = rows.filter(
      (r) => r.status === VisitStatus.COMPLETED,
    ).length;
    const blockingHold = rows.find(
      (r) =>
        r.stage.visit_type === VisitType.HOLD_POINT &&
        !r.hold_released &&
        r.status !== VisitStatus.CANCELLED,
    );
    return {
      total: rows.length,
      completed,
      pct: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      next_hold_point: blockingHold
        ? {
            id: blockingHold.id,
            visit_no: blockingHold.stage.visit_no,
            stage: blockingHold.stage.stage,
          }
        : null,
    };
  }
}
