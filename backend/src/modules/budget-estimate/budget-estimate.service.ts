import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { BudgetEstimate } from './models/budget-estimate.model';
import { BudgetEstimateCategory } from './models/budget-estimate-category.model';
import { BudgetEstimateItem } from './models/budget-estimate-item.model';
import { BudgetEstimateMiscellaneous } from './models/budget-estimate-miscellaneous.model';
import { Boq } from '../boqs/models/boq.model';
import { BoqItem } from '../boqs/models/boq-item.model';
import { LibraryCategory } from '../boqs/models/library-category.model';
import { LibraryItem } from '../boqs/models/library-item.model';
import { Project } from '@/modules/projects/models/projects.model';

import {
  CreateBudgetEstimateDto,
  CreateBudgetEstimateItemDto,
} from './dto/create-budget-estimate.dto';

import { UpdateBudgetEstimateDto } from './dto/update-budget-estimate.dto';

@Injectable()
export class BudgetEstimateService {
  constructor(
    @InjectModel(BudgetEstimate)
    private readonly estimateModel: typeof BudgetEstimate,

    @InjectModel(BudgetEstimateCategory)
    private readonly categoryModel: typeof BudgetEstimateCategory,

    @InjectModel(BudgetEstimateItem)
    private readonly itemModel: typeof BudgetEstimateItem,

    @InjectModel(BudgetEstimateMiscellaneous)
    private readonly miscellaneousModel: typeof BudgetEstimateMiscellaneous,

    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,

    @InjectModel(BoqItem)
    private readonly boqItemModel: typeof BoqItem,

    @InjectModel(LibraryItem)
    private readonly libraryItemModel: typeof LibraryItem,

    @InjectModel(LibraryCategory)
    private readonly libraryCategoryModel: typeof LibraryCategory,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    private readonly sequelize: Sequelize,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    dto: CreateBudgetEstimateDto,
    userId?: string,
  ): Promise<BudgetEstimate> {
    const transaction = await this.sequelize.transaction();

    try {
      const project = await this.projectModel.findByPk(dto.project_id, {
        transaction,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      let boq: Boq | null = null;

      if (dto.boq_id) {
        boq = await this.boqModel.findByPk(dto.boq_id, {
          transaction,
        });

        if (!boq) {
          throw new NotFoundException('BOQ not found');
        }
      }

      const estimateNumber = dto.estimate_number || `BE-${Date.now()}`;

      const estimate = await this.estimateModel.create(
        {
          project_id: dto.project_id,
          boq_id: dto.boq_id || null,
          source_template_id: dto.source_template_id || null,

          estimate_number: estimateNumber,
          title: dto.title,

          status: 'draft',

          client_name: dto.client_name || (boq?.client_name ?? null),

          location: dto.location || (boq?.location ?? null),

          prepared_by: dto.prepared_by || (boq?.prepared_by ?? null),

          estimate_date: dto.estimate_date || (boq?.date ?? null),

          misc_percentage: dto.misc_percentage ?? 0,

          design_amount: dto.design_amount ?? 0,

          execution_amount: dto.execution_amount ?? 0,

          supervisor_amount: dto.supervisor_amount ?? 0,

          additional_amount: dto.additional_amount ?? 0,

          tax_percentage: dto.tax_percentage ?? 0,

          discount_amount: dto.discount_amount ?? 0,

          terms_html: dto.terms_html ?? boq?.terms_html ?? null,

          terms_template_id:
            dto.terms_template_id ?? boq?.terms_template_id ?? null,

          terms_template_version:
            dto.terms_template_version ?? boq?.terms_template_version ?? null,

          created_by: userId || null,
          updated_by: userId || null,
        },
        { transaction },
      );

      if (dto.categories?.length) {
        for (const categoryDto of dto.categories) {
          const category = await this.categoryModel.create(
            {
              estimate_id: estimate.id,
              library_category_id: categoryDto.library_category_id || null,
              name: categoryDto.name,
              sort_order: categoryDto.sort_order ?? 0,
            },
            { transaction },
          );

          if (categoryDto.items?.length) {
            for (const itemDto of categoryDto.items) {
              await this.createItem(
                estimate.id,
                category.id,
                itemDto,
                transaction,
              );
            }
          }
        }
      }

      if (dto.miscellaneous?.length) {
        await this.miscellaneousModel.bulkCreate(
          dto.miscellaneous.map((item) => ({
            estimate_id: estimate.id,
            name: item.name,
            value: item.value,
            notes: item.notes || null,
            sort_order: item.sort_order ?? 0,
          })),
          { transaction },
        );
      }

      await transaction.commit();

      return this.findOne(estimate.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // CREATE ITEM
  // ============================================================

  private async createItem(
    estimateId: string,
    categoryId: string,
    dto: CreateBudgetEstimateItemDto,
    transaction: any,
  ) {
    let libraryItem: LibraryItem | null = null;

    if (dto.library_item_id) {
      libraryItem = await this.libraryItemModel.findByPk(dto.library_item_id, {
        transaction,
      });
    }

    await this.itemModel.create(
      {
        estimate_id: estimateId,
        estimate_category_id: categoryId,

        library_item_id: dto.library_item_id || null,

        boq_item_id: dto.boq_item_id || null,

        name: dto.name || libraryItem?.name || 'Unnamed Item',

        unit_id: dto.unit_id || libraryItem?.unit_id || null,

        unit: dto.unit || libraryItem?.unit || null,

        quantity: dto.quantity ?? 0,

        rate: dto.rate ?? libraryItem?.default_rate ?? 0,

        amount:
          Number(dto.quantity || 0) *
          Number(dto.rate ?? libraryItem?.default_rate ?? 0),

        calc_type: dto.calc_type || 'M',

        location: dto.location || null,

        detail: dto.detail || null,

        notes: dto.notes || libraryItem?.notes || null,

        hidden: dto.hidden ?? false,

        sort_order: dto.sort_order ?? 0,
      },
      { transaction },
    );
  }

  // ============================================================
  // GET ALL
  // ============================================================

  async findAll(projectId?: string) {
    const where: any = {};

    if (projectId) {
      where.project_id = projectId;
    }

    return this.estimateModel.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: Boq,
          as: 'boq',
        },
        {
          model: BudgetEstimateCategory,
          as: 'categories',
          include: [
            {
              model: BudgetEstimateItem,
              as: 'items',
              include: [
                {
                  model: LibraryItem,
                  as: 'libraryItem',
                },
              ],
            },
          ],
        },
        {
          model: BudgetEstimateMiscellaneous,
          as: 'miscellaneous',
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  // ============================================================
  // GET ONE
  // ============================================================

  async findOne(id: string) {
    const estimate = await this.estimateModel.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: Boq,
          as: 'boq',
        },
        {
          model: BudgetEstimateCategory,
          as: 'categories',
          include: [
            {
              model: BudgetEstimateItem,
              as: 'items',
              include: [
                {
                  model: LibraryItem,
                  as: 'libraryItem',
                },
                {
                  model: BoqItem,
                  as: 'boqItem',
                },
              ],
            },
          ],
        },
        {
          model: BudgetEstimateMiscellaneous,
          as: 'miscellaneous',
        },
      ],
    });

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    return estimate;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateBudgetEstimateDto, userId?: string) {
    const estimate = await this.estimateModel.findByPk(id);

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    if (estimate.locked) {
      throw new BadRequestException('Budget estimate is locked');
    }

    await estimate.update({
      ...dto,
      categories: undefined,
      miscellaneous: undefined,
      updated_by: userId || estimate.updated_by,
    });

    await this.recalculate(id);

    return this.findOne(id);
  }

  // ============================================================
  // RECALCULATE
  // ============================================================

  async recalculate(id: string) {
    const estimate = await this.estimateModel.findByPk(id);

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    const items = await this.itemModel.findAll({
      where: {
        estimate_id: id,
      },
    });

    const miscellaneous = await this.miscellaneousModel.findAll({
      where: {
        estimate_id: id,
      },
    });

    const subtotal = items
      .filter((item) => !item.hidden)
      .reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.rate),
        0,
      );

    const miscItemsTotal = miscellaneous.reduce(
      (sum, item) => sum + Number(item.value),
      0,
    );

    const percentageMisc =
      subtotal * (Number(estimate.misc_percentage || 0) / 100);

    const miscAmount = percentageMisc + miscItemsTotal;

    const beforeTax =
      subtotal +
      miscAmount +
      Number(estimate.design_amount || 0) +
      Number(estimate.execution_amount || 0) +
      Number(estimate.supervisor_amount || 0) +
      Number(estimate.additional_amount || 0) -
      Number(estimate.discount_amount || 0);

    const taxAmount = beforeTax * (Number(estimate.tax_percentage || 0) / 100);

    const totalAmount = beforeTax + taxAmount;

    await estimate.update({
      subtotal,
      misc_amount: miscAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    });

    return estimate;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const estimate = await this.estimateModel.findByPk(id);

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    if (estimate.locked) {
      throw new BadRequestException('Budget estimate is locked');
    }

    await estimate.destroy();

    return {
      message: 'Budget estimate deleted successfully',
    };
  }

  // ============================================================
  // LOCK
  // ============================================================

  async lock(id: string) {
    const estimate = await this.estimateModel.findByPk(id);

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    await estimate.update({
      locked: true,
    });

    return estimate;
  }

  // ============================================================
  // UNLOCK
  // ============================================================

  async unlock(id: string) {
    const estimate = await this.estimateModel.findByPk(id);

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    await estimate.update({
      locked: false,
    });

    return estimate;
  }

  // ============================================================
  // CREATE ESTIMATE FROM BOQ
  // ============================================================

  async createFromBoq(boqId: string, userId?: string) {
    const boq = await this.boqModel.findByPk(boqId, {
      include: [
        {
          model: BudgetEstimateCategory,
          required: false,
        },
      ],
    });

    if (!boq) {
      throw new NotFoundException('BOQ not found');
    }

    const categories = await this.categoryModel.findAll({
      where: {
        boq_id: boqId,
      } as any,
    });

    const boqItems = await this.boqItemModel.findAll({
      include: [
        {
          model: BudgetEstimateCategory,
          required: false,
        },
      ],
    });

    return {
      message: 'BOQ found. Use the BOQ mapping to create the budget estimate.',
      boq_id: boqId,
      project_id: boq.project_id,
      items: boqItems,
      categories,
      user_id: userId || null,
    };
  }
}
