import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { PaymentSchedule } from './models/payment-schedule.model';
import { PaymentScheduleMilestone } from './models/payment-schedule-milestone.model';
import { Project } from '@/modules/projects/models/projects.model';
import { TermsTemplate } from '../metas/models/terms-templates.model';

import { CreatePaymentScheduleDto } from './dto/create-payment-schedule.dto';
import { UpdatePaymentScheduleDto } from './dto/update-payment-schedule.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class PaymentSchedulesService {
  constructor(
    @InjectModel(PaymentSchedule)
    private readonly paymentScheduleModel: typeof PaymentSchedule,

    @InjectModel(PaymentScheduleMilestone)
    private readonly milestoneModel: typeof PaymentScheduleMilestone,

    @InjectModel(TermsTemplate)
    private readonly termsTemplateModel: typeof TermsTemplate,
  ) {}

  // ============================================================
  // Payment Schedules
  // ============================================================
  async create(dto: CreatePaymentScheduleDto): Promise<PaymentSchedule> {
    const { milestones, termsTemplateId, termsVersion, ...scheduleData } = dto;

    const transaction =
      await this.paymentScheduleModel.sequelize!.transaction();

    try {
      let resolvedTermsTemplateId = termsTemplateId ?? null;
      let resolvedTermsVersion = termsVersion ?? null;

      // ============================================================
      // Resolve Terms Template
      // ============================================================

      if (resolvedTermsTemplateId) {
        const termsTemplate = await this.termsTemplateModel.findByPk(
          resolvedTermsTemplateId,
          {
            transaction,
            include: [
              {
                association: 'versions',
                attributes: [
                  'id',
                  'terms_template_id',
                  'version',
                  'content_html',
                  'change_note',
                  'created_by',
                  'created_at',
                ],
              },
            ],
          },
        );

        if (!termsTemplate) {
          throw new NotFoundException(
            `Terms template ${resolvedTermsTemplateId} not found`,
          );
        }

        if (!termsTemplate.is_active) {
          throw new ConflictException(
            `Terms template ${resolvedTermsTemplateId} is inactive`,
          );
        }

        // If version was not supplied,
        // use the template's current version.
        if (resolvedTermsVersion == null) {
          resolvedTermsVersion = termsTemplate.current_version;
        }

        if (resolvedTermsVersion == null) {
          throw new ConflictException(
            `Terms template ${resolvedTermsTemplateId} has no current version`,
          );
        }
      } else {
        // No template means no version.
        resolvedTermsVersion = null;
      }

      // ============================================================
      // Create Payment Schedule
      // ============================================================

      const schedule = await this.paymentScheduleModel.create(
        {
          ...scheduleData,
          termsTemplateId: resolvedTermsTemplateId,
          termsVersion: resolvedTermsVersion,
        } as any,
        {
          transaction,
        },
      );

      // ============================================================
      // Create Milestones
      // ============================================================

      if (milestones?.length) {
        const milestoneData = milestones.map((milestone) => ({
          ...milestone,
          paymentScheduleId: schedule.id,
        }));

        await this.milestoneModel.bulkCreate(milestoneData as any, {
          transaction,
        });
      }

      // ============================================================
      // Commit
      // ============================================================

      await transaction.commit();

      return this.findOne(schedule.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  // ============================================================
  // Find All
  // ============================================================

  async findAll(projectId?: string): Promise<PaymentSchedule[]> {
    return this.paymentScheduleModel.findAll({
      where: projectId ? { projectId } : undefined,

      include: [
        {
          model: Project,
          as: 'project',
          attributes: [
            'id',
            'name',
            'slug',
            'site_location',
            'status',
            'priority',
            'expected_completion_date',
            'approved_value',
            'current_phase',
            'progress_pct',
            'timeline_status',
          ],
        },

        {
          model: TermsTemplate,
          as: 'termsTemplate',
          attributes: [
            'id',
            'name',
            'scope',
            'current_version',
            'is_default',
            'is_active',
          ],
        },

        {
          model: PaymentScheduleMilestone,
          as: 'milestones',
        },
      ],

      order: [
        ['createdAt', 'DESC'],
        [
          { model: PaymentScheduleMilestone, as: 'milestones' },
          'sortOrder',
          'ASC',
        ],
      ],
    });
  }

  // ============================================================
  // Find One
  // ============================================================

  async findOne(id: string): Promise<PaymentSchedule> {
    const schedule = await this.paymentScheduleModel.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [
            'id',
            'name',
            'slug',
            'site_location',
            'status',
            'priority',
            'expected_completion_date',
            'approved_value',
            'current_phase',
            'progress_pct',
            'timeline_status',
          ],
        },

        {
          model: TermsTemplate,
          as: 'termsTemplate',
          attributes: [
            'id',
            'name',
            'scope',
            'content_html',
            'current_version',
            'is_default',
            'is_active',
          ],
        },

        {
          model: PaymentScheduleMilestone,
          as: 'milestones',
        },
      ],

      order: [
        [
          { model: PaymentScheduleMilestone, as: 'milestones' },
          'sortOrder',
          'ASC',
        ],
      ],
    });

    if (!schedule) {
      throw new NotFoundException(`Payment schedule ${id} not found`);
    }

    return schedule;
  }

  // ============================================================
  // Update Payment Schedule
  // ============================================================

  async update(
    id: string,
    dto: UpdatePaymentScheduleDto,
  ): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);

    const { termsTemplateId, termsVersion, ...scheduleData } = dto;

    let resolvedTermsTemplateId: string | null | undefined = termsTemplateId;

    let resolvedTermsVersion: number | null | undefined = termsVersion;

    // ----------------------------------------------------------
    // If terms template is being changed
    // ----------------------------------------------------------

    if (termsTemplateId !== undefined) {
      if (termsTemplateId === null) {
        resolvedTermsTemplateId = null;
        resolvedTermsVersion = null;
      } else {
        const termsTemplate =
          await this.termsTemplateModel.findByPk(termsTemplateId);

        if (!termsTemplate) {
          throw new NotFoundException(
            `Terms template ${termsTemplateId} not found`,
          );
        }

        if (!termsTemplate.is_active) {
          throw new ConflictException(
            `Terms template ${termsTemplateId} is inactive`,
          );
        }

        // If no explicit version is provided,
        // use the template's current version.
        if (resolvedTermsVersion == null) {
          resolvedTermsVersion = termsTemplate.current_version;
        }

        const versionExists = await termsTemplate.$get('versions', {
          where: {
            version: resolvedTermsVersion,
          },
        });

        if (!versionExists?.length) {
          throw new NotFoundException(
            `Terms version ${resolvedTermsVersion} not found for template ${termsTemplateId}`,
          );
        }
      }
    }

    // ----------------------------------------------------------
    // If only terms version is being changed
    // ----------------------------------------------------------

    if (termsTemplateId === undefined && termsVersion !== undefined) {
      if (!schedule.termsTemplateId) {
        throw new ConflictException(
          'Cannot set terms version without a terms template',
        );
      }

      const termsTemplate = await this.termsTemplateModel.findByPk(
        schedule.termsTemplateId,
      );

      if (!termsTemplate) {
        throw new NotFoundException(
          `Terms template ${schedule.termsTemplateId} not found`,
        );
      }

      const versionExists = await termsTemplate.$get('versions', {
        where: {
          version: termsVersion,
        },
      });

      if (!versionExists?.length) {
        throw new NotFoundException(
          `Terms version ${termsVersion} not found for template ${schedule.termsTemplateId}`,
        );
      }

      resolvedTermsTemplateId = schedule.termsTemplateId;
    }

    // ----------------------------------------------------------
    // Update
    // ----------------------------------------------------------

    await schedule.update({
      ...scheduleData,

      ...(termsTemplateId !== undefined || termsVersion !== undefined
        ? {
            termsTemplateId: resolvedTermsTemplateId,
            termsVersion: resolvedTermsVersion,
          }
        : {}),
    } as any);

    return this.findOne(schedule.id);
  }

  // ============================================================
  // Remove Payment Schedule
  // ============================================================

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);

    await schedule.destroy();
  }

  // ============================================================
  // Milestones
  // ============================================================

  async addMilestone(
    paymentScheduleId: string,
    dto: CreateMilestoneDto,
  ): Promise<PaymentScheduleMilestone> {
    await this.findOne(paymentScheduleId);

    const existing = await this.milestoneModel.findOne({
      where: {
        paymentScheduleId,
        milestoneCode: dto.milestoneCode,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Milestone code '${dto.milestoneCode}' already exists for this schedule`,
      );
    }

    return this.milestoneModel.create({
      ...dto,
      paymentScheduleId,
    } as any);
  }

  async findMilestones(
    paymentScheduleId: string,
  ): Promise<PaymentScheduleMilestone[]> {
    await this.findOne(paymentScheduleId);

    return this.milestoneModel.findAll({
      where: { paymentScheduleId },
      order: [['sortOrder', 'ASC']],
    });
  }

  async findMilestone(
    paymentScheduleId: string,
    milestoneId: string,
  ): Promise<PaymentScheduleMilestone> {
    const milestone = await this.milestoneModel.findOne({
      where: {
        id: milestoneId,
        paymentScheduleId,
      },
    });

    if (!milestone) {
      throw new NotFoundException(
        `Milestone ${milestoneId} not found on schedule ${paymentScheduleId}`,
      );
    }

    return milestone;
  }

  async updateMilestone(
    paymentScheduleId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<PaymentScheduleMilestone> {
    const milestone = await this.findMilestone(paymentScheduleId, milestoneId);

    await milestone.update({ ...dto } as any);

    return milestone;
  }

  async removeMilestone(
    paymentScheduleId: string,
    milestoneId: string,
  ): Promise<void> {
    const milestone = await this.findMilestone(paymentScheduleId, milestoneId);

    await milestone.destroy();
  }
}
