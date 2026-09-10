import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectPhase } from './models/project-phase.model';
import { PlannerTaskTemplate } from './models/planner-task-template.model';
import { ProjectPlannerTask } from './models/project-planner-task.model';
import { ProjectFloor } from './models/project-floor.model';
import { PlannerTaskFloorProgress } from './models/planner-task-floor-progress.model';
import {
  ProjectPhaseModule,
  PlannerModule,
} from '@/common/enums/project-planner.enum';
import {
  CreatePlannerTaskDto,
  UpdatePlannerTaskDto,
  UpsertFloorProgressDto,
  CloneTemplatesDto,
} from './dto/planner-task.dto';

@Injectable()
export class ProjectPlannerService {
  constructor(
    @InjectModel(ProjectPhase) private readonly phaseModel: typeof ProjectPhase,
    @InjectModel(PlannerTaskTemplate)
    private readonly templateModel: typeof PlannerTaskTemplate,
    @InjectModel(ProjectPlannerTask)
    private readonly taskModel: typeof ProjectPlannerTask,
    @InjectModel(ProjectFloor) private readonly floorModel: typeof ProjectFloor,
    @InjectModel(PlannerTaskFloorProgress)
    private readonly floorProgressModel: typeof PlannerTaskFloorProgress,
  ) {}

  /** Phase catalog for one module, in sheet order. */
  listPhases(module: ProjectPhaseModule) {
    return this.phaseModel.findAll({
      where: { module },
      order: [['sort_order', 'ASC']],
    });
  }

  /**
   * WORK/DETAILS tree for a project + module, each with its floor-progress
   * cells attached — i.e. everything needed to render one full sheet
   * (Consultancy or PMC) in one call.
   */
  async getTaskTree(project_id: string, module: PlannerModule) {
    const [tasks, floors] = await Promise.all([
      this.taskModel.findAll({
        where: { project_id, module },
        include: [{ model: this.floorProgressModel, as: 'floor_progress' }],
        order: [['s_no', 'ASC']],
      }),
      this.floorModel.findAll({
        where: { project_id },
        order: [['sort_order', 'ASC']],
      }),
    ]);

    const byId = new Map(
      tasks.map((t) => [t.id, { ...t.toJSON(), children: [] as any[] }]),
    );
    const roots: any[] = [];
    for (const task of byId.values()) {
      if (task.parent_id && byId.has(task.parent_id)) {
        byId.get(task.parent_id)!.children.push(task);
      } else {
        roots.push(task);
      }
    }
    return { floors, tasks: roots };
  }

  createTask(project_id: string, dto: CreatePlannerTaskDto, userId?: string) {
    return this.taskModel.create({
      project_id,
      module: dto.module,
      phase_id: dto.phase_id ?? null,
      parent_id: dto.parent_id ?? null,
      s_no: dto.s_no ?? 0,
      title: dto.title,
      remarks: dto.remarks ?? null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    } as any);
  }

  async updateTask(id: string, dto: UpdatePlannerTaskDto, userId?: string) {
    const task = await this.taskModel.findByPk(id);
    if (!task) throw new NotFoundException('Planner task not found');
    await task.update({ ...dto, updated_by: userId ?? task.updated_by } as any);
    return task;
  }

  async deleteTask(id: string) {
    const task = await this.taskModel.findByPk(id);
    if (!task) throw new NotFoundException('Planner task not found');
    await task.destroy(); // soft delete (paranoid: true)
  }

  /** Upserts the FLOOR cell (date + remarks) for one task on one floor. */
  async upsertFloorProgress(
    project_planner_task_id: string,
    dto: UpsertFloorProgressDto,
  ) {
    const [row] = await this.floorProgressModel.findOrCreate({
      where: {
        project_planner_task_id,
        project_floor_id: dto.project_floor_id,
      },
      defaults: {
        project_planner_task_id,
        project_floor_id: dto.project_floor_id,
        completed_date: dto.completed_date ?? null,
        remarks: dto.remarks ?? null,
      } as any,
    });
    if (row.isNewRecord === false) {
      await row.update({
        completed_date: dto.completed_date ?? null,
        remarks: dto.remarks ?? null,
      });
    }
    return row;
  }

  /**
   * Clones the active WORK/DETAILS tree from planner_task_templates into
   * a brand new project so its Consultancy or PMC sheet starts populated
   * exactly like the master checklist, while remaining freely editable
   * per project afterwards (ad-hoc rows just have template_id = null).
   */
  async cloneTemplatesIntoProject(dto: CloneTemplatesDto, userId?: string) {
    const templates = await this.templateModel.findAll({
      where: { module: dto.module, is_active: true },
      order: [['sort_order', 'ASC']],
    });

    const idMap = new Map<string, string>(); // template_id -> new task_id
    // Create WORK-level rows first (parent_id null), then DETAILS rows.
    const topLevel = templates.filter((t) => !t.parent_id);
    const children = templates.filter((t) => t.parent_id);

    for (const t of topLevel) {
      const created = await this.taskModel.create({
        project_id: dto.project_id,
        module: dto.module,
        phase_id: t.phase_id,
        template_id: t.id,
        parent_id: null,
        s_no: t.sort_order,
        title: t.title,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      } as any);
      idMap.set(t.id, created.id);
    }
    for (const t of children) {
      const parentTaskId = idMap.get(t.parent_id!) ?? null;
      const created = await this.taskModel.create({
        project_id: dto.project_id,
        module: dto.module,
        phase_id: t.phase_id,
        template_id: t.id,
        parent_id: parentTaskId,
        s_no: t.sort_order,
        title: t.title,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      } as any);
      idMap.set(t.id, created.id);
    }

    return { cloned: idMap.size };
  }
}
