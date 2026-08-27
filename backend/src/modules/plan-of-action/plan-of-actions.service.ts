import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';

import { PlanOfAction } from './models/plan-of-action.model';
import { ProjectPhase } from '../projects/models/project-phase.model';
import { PlanOfActionPhase } from './models/plan-of-action-phase.model';

import { TermsTemplate } from '../metas/models/terms-templates.model';
import { TermsTemplateVersion } from '../metas/models/terms-template-version.model';

import { TeamService } from '../process-workflow/team.service';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';
import { PlanOfActionStatus } from '@/common/enums/plan-of-action.enums';

import { CreatePlanOfActionDto } from './dto/create-plan-of-action.dto';
import { UpdatePlanOfActionDto } from './dto/update-plan-of-action.dto';
import { UpsertPhaseDto } from './dto/upsert-phase.dto';
import { ApplyTermsDto } from '../metas/dto/apply-terms.dto';

@Injectable()
export class PlanOfActionsService {
  constructor(
    @InjectModel(PlanOfAction)
    private readonly planOfActionModel: typeof PlanOfAction,

    @InjectModel(ProjectPhase)
    private readonly phaseModel: typeof ProjectPhase,

    @InjectModel(PlanOfActionPhase)
    private readonly planPhaseModel: typeof PlanOfActionPhase,

    @InjectModel(TermsTemplate)
    private readonly termsTemplateModel: typeof TermsTemplate,

    @InjectModel(TermsTemplateVersion)
    private readonly termsVersionModel: typeof TermsTemplateVersion,

    private readonly teamService: TeamService,

    private readonly sequelize: Sequelize,
  ) {}
  // ============================================================
  // Find All
  // ============================================================

  async findAll() {
    return this.planOfActionModel.findAll({
      include: [
        {
          association: 'project',
          attributes: ['id', 'name'],
        },
        {
          association: 'phases',
          through: {
            attributes: ['id', 'sort_order'],
          },
        },
        {
          association: 'terms_template',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }
  // ============================================================
  // Create
  // ============================================================

  async create(dto: CreatePlanOfActionDto, actingUserId?: string) {
    return this.sequelize
      .transaction(async (transaction) => {
        const plan = await this.planOfActionModel.create(
          {
            project_id: dto.project_id,
            title: dto.title ?? 'Plan of Action',
            execution_description: dto.execution_description ?? null,

            total_duration_min_days: dto.total_duration_min_days ?? null,

            total_duration_max_days: dto.total_duration_max_days ?? null,

            total_duration_label: dto.total_duration_label ?? null,

            total_phases: dto.phases?.length ?? 0,

            created_by: actingUserId ?? null,
          } as PlanOfAction,
          { transaction },
        );

        // --------------------------------------------------------
        // Phases
        // --------------------------------------------------------

        if (dto.phases?.length) {
          await this.createPhasesForPlan(plan.id, dto.phases, transaction);
        }

        // --------------------------------------------------------
        // Terms
        // --------------------------------------------------------

        if (dto.terms_template_id) {
          await this.applyTermsInternal(
            plan,
            {
              terms_template_id: dto.terms_template_id,
            },
            transaction,
          );
        }

        // --------------------------------------------------------
        // Team Members
        // --------------------------------------------------------

        if (dto.team_members?.length) {
          await this.teamService.replaceAll(
            TeamMemberOwnerType.PLAN_OF_ACTION,
            plan.id,
            dto.team_members,
            actingUserId,
            transaction,
          );
        } else {
          console.log(
            'POA create — team_members MISSING or empty:',
            dto.team_members,
          );
        }

        return plan.id;
      })
      .then((id) => this.findOne(id));
  }

  // ============================================================
  // Find One
  // ============================================================

  async findOne(id: string) {
    const plan = await this.planOfActionModel.findByPk(id, {
      include: [
        {
          association: 'project',
        },
        {
          association: 'phases',
          through: {
            attributes: [
              'id',
              'plan_of_action_id',
              'project_phase_id',

              // Duration
              'duration_min_days',
              'duration_max_days',

              // Notes
              'parallel_work_note',
              'inclusion_note',

              // Gantt
              'gantt_start_offset_days',
              'gantt_duration_days',

              // Ordering
              'sort_order',

              // Timestamps
              'created_at',
              'updated_at',
              'deleted_at',
            ],
          },
        },
        {
          association: 'terms_template',
        },
        {
          association: 'terms_version',
        },
      ],
    });

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    const team_members = await this.teamService.list(
      TeamMemberOwnerType.PLAN_OF_ACTION,
      id,
    );

    const json = plan.toJSON();

    if (Array.isArray(json.phases)) {
      json.phases.sort((a: any, b: any) => {
        const aOrder = a.PlanOfActionPhase?.sort_order ?? 0;
        const bOrder = b.PlanOfActionPhase?.sort_order ?? 0;

        return aOrder - bOrder;
      });
    }

    return {
      ...json,
      team_members,
    };
  }

  // ============================================================
  // Find By Project
  // ============================================================

  findByProject(projectId: string) {
    return this.planOfActionModel.findAll({
      where: {
        project_id: projectId,
      },
      order: [['created_at', 'DESC']],
    });
  }

  // ============================================================
  // Update
  // ============================================================

  async update(id: string, dto: UpdatePlanOfActionDto) {
    const plan = await this.planOfActionModel.findByPk(id);

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    await this.sequelize.transaction(async (transaction) => {
      // --------------------------------------------------------
      // Update main Plan of Action
      // --------------------------------------------------------

      await plan.update(
        {
          title: dto.title ?? plan.title,

          execution_description:
            dto.execution_description ?? plan.execution_description,

          total_duration_min_days:
            dto.total_duration_min_days ?? plan.total_duration_min_days,

          total_duration_max_days:
            dto.total_duration_max_days ?? plan.total_duration_max_days,

          total_duration_label:
            dto.total_duration_label ?? plan.total_duration_label,
        },
        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // Update Phases
      // --------------------------------------------------------

      if (dto.phases !== undefined) {
        // Remove old POA -> ProjectPhase relationships.
        //
        // IMPORTANT:
        // We do NOT delete ProjectPhase records themselves.
        await this.planPhaseModel.destroy({
          where: {
            plan_of_action_id: id,
          },
          transaction,
        });

        if (dto.phases.length > 0) {
          await this.createPhasesForPlan(id, dto.phases, transaction);
        }

        await plan.update(
          {
            total_phases: dto.phases.length,
          },
          {
            transaction,
          },
        );
      }

      // --------------------------------------------------------
      // Update Terms
      // --------------------------------------------------------

      if (dto.terms_template_id !== undefined) {
        await this.applyTermsInternal(
          plan,
          {
            terms_template_id: dto.terms_template_id,
          },
          transaction,
        );
      }

      // --------------------------------------------------------
      // Update Team Members
      // --------------------------------------------------------

      if (dto.team_members !== undefined) {
        await this.teamService.replaceAll(
          TeamMemberOwnerType.PLAN_OF_ACTION,
          id,
          dto.team_members,
          undefined,
          transaction,
        );
      }
    });

    return this.findOne(id);
  }
  // ============================================================
  // Remove
  // ============================================================

  async remove(id: string) {
    const plan = await this.planOfActionModel.findByPk(id);

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    await plan.destroy();
  }

  // ============================================================
  // Phases
  // ============================================================

  async replacePhases(planId: string, phases: UpsertPhaseDto[]) {
    const plan = await this.planOfActionModel.findByPk(planId);

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    await this.sequelize.transaction(async (transaction) => {
      // --------------------------------------------------------
      // Remove existing relationships only.
      //
      // IMPORTANT:
      // Do NOT delete ProjectPhase records because they are
      // independent/reusable entities.
      // --------------------------------------------------------

      await this.planPhaseModel.destroy({
        where: {
          plan_of_action_id: planId,
        },
        transaction,
      });

      // --------------------------------------------------------
      // Create new phases + relationships
      // --------------------------------------------------------

      if (phases.length) {
        await this.createPhasesForPlan(planId, phases, transaction);
      }

      // --------------------------------------------------------
      // Update phase count
      // --------------------------------------------------------

      await plan.update(
        {
          total_phases: phases.length,
        },
        {
          transaction,
        },
      );
    });

    return this.findOne(planId);
  }

  // ============================================================
  // Create Phases For Plan
  // ============================================================

  private async createPhasesForPlan(
    planId: string,
    phases: UpsertPhaseDto[],
    transaction: Transaction,
  ) {
    for (let index = 0; index < phases.length; index++) {
      const phase = phases[index];

      // --------------------------------------------------------
      // Create independent ProjectPhase
      // --------------------------------------------------------

      const projectPhase = await this.phaseModel.create(
        {
          phase_number: phase.phase_number,
          phase_code: phase.phase_code,
          title: phase.title,
          description: phase.description ?? null,
          sort_order: index,
        } as ProjectPhase,
        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // Create Plan of Action Phase
      // POA-specific timing / notes / Gantt configuration
      // --------------------------------------------------------

      await this.planPhaseModel.create(
        {
          plan_of_action_id: planId,
          project_phase_id: projectPhase.id,

          duration_min_days: phase.duration_min_days ?? null,
          duration_max_days: phase.duration_max_days ?? null,

          parallel_work_note: phase.parallel_work_note ?? null,
          inclusion_note: phase.inclusion_note ?? null,

          gantt_start_offset_days: phase.gantt_start_offset_days ?? 0,

          gantt_duration_days: phase.gantt_duration_days ?? 0,

          sort_order: index,
        } as PlanOfActionPhase,
        {
          transaction,
        },
      );
    }
  }

  // ============================================================
  // Terms
  // ============================================================

  async applyTerms(planId: string, dto: ApplyTermsDto) {
    const plan = await this.planOfActionModel.findByPk(planId);

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    await this.applyTermsInternal(plan, dto);

    return this.findOne(planId);
  }

  // ============================================================
  // Apply Terms Internal
  // ============================================================

  private async applyTermsInternal(
    plan: PlanOfAction,
    dto: ApplyTermsDto,
    transaction?: Transaction,
  ) {
    const template = await this.termsTemplateModel.findByPk(
      dto.terms_template_id,
      {
        transaction,
      },
    );

    if (!template) {
      throw new NotFoundException('Terms template not found');
    }

    const version = dto.version
      ? await this.termsVersionModel.findOne({
          where: {
            terms_template_id: template.id,
            version: dto.version,
          },
          transaction,
        })
      : await this.termsVersionModel.findOne({
          where: {
            terms_template_id: template.id,
            version: template.current_version,
          },
          transaction,
        });

    if (dto.version && !version) {
      throw new NotFoundException(
        `Terms template version ${dto.version} not found`,
      );
    }

    await plan.update(
      {
        terms_template_id: template.id,

        terms_template_version_id: version?.id ?? null,

        terms_content_snapshot: version?.content_html ?? template.content_html,
      },
      {
        transaction,
      },
    );
  }

  // ============================================================
  // Publish
  // ============================================================

  async publish(id: string) {
    const plan = await this.planOfActionModel.findByPk(id);

    if (!plan) {
      throw new NotFoundException('Plan of Action not found');
    }

    await plan.update({
      status: PlanOfActionStatus.PUBLISHED,

      published_at: new Date(),
    });

    return this.findOne(id);
  }
}
