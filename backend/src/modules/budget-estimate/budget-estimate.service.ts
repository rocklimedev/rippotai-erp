import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BudgetEstimate } from './models/budget-estimate.model';
import { BudgetEstimateCategory } from './models/budget-estimate-category.model';
import { BudgetEstimateItem } from './models/budget-estimate-item.model';
import { BudgetEstimateMiscellaneous } from './models/budget-estimate-miscellaneous.model';
import { TermsTemplate } from '../metas/models/terms-templates.model';
import { Boq } from '../boqs/models/boq.model';
import { BoqItem } from '../boqs/models/boq-item.model';
import { BoqCategory } from '../boqs/models/boq-category.model';

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

    @InjectModel(TermsTemplate)
    private readonly termsTemplateModel: typeof TermsTemplate,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    private readonly sequelize: Sequelize,
  ) {}

  // ============================================================
  // CREATE NORMAL ESTIMATE
  // ============================================================

  async create(
    dto: CreateBudgetEstimateDto,
    userId?: string,
  ): Promise<BudgetEstimate> {
    const transaction = await this.sequelize.transaction();

    try {
      // ----------------------------------------------------------
      // 1. CHECK PROJECT
      // ----------------------------------------------------------

      const project = await this.projectModel.findByPk(dto.project_id, {
        transaction,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // ----------------------------------------------------------
      // 2. CHECK BOQ
      // ----------------------------------------------------------

      let boq: Boq | null = null;

      if (dto.boq_id) {
        boq = await this.boqModel.findByPk(dto.boq_id, {
          transaction,
        });

        if (!boq) {
          throw new NotFoundException('BOQ not found');
        }
      }

      // ----------------------------------------------------------
      // 3. RESOLVE TERMS TEMPLATE
      //
      // Priority:
      // DTO template → BOQ template → null
      //
      // Never save a template ID unless the referenced template
      // actually exists and is not soft-deleted.
      // ----------------------------------------------------------

      const requestedTermsTemplateId =
        dto.terms_template_id ?? boq?.terms_template_id ?? null;

      let termsTemplate: TermsTemplate | null = null;

      if (requestedTermsTemplateId) {
        termsTemplate = await this.termsTemplateModel.findByPk(
          requestedTermsTemplateId,
          {
            transaction,
          },
        );

        // --------------------------------------------------------
        // If a template ID was explicitly supplied by the user,
        // reject it if it doesn't exist.
        // --------------------------------------------------------

        if (dto.terms_template_id && !termsTemplate) {
          throw new BadRequestException(
            'Selected terms template was not found or has been deleted',
          );
        }

        // --------------------------------------------------------
        // If the template came from an old BOQ and is no longer
        // available, simply don't carry the invalid FK forward.
        //
        // The terms_html snapshot is still preserved below.
        // --------------------------------------------------------
      }

      const termsTemplateId = termsTemplate?.id ?? null;

      const termsTemplateVersion = termsTemplate
        ? (dto.terms_template_version ??
          boq?.terms_template_version ??
          termsTemplate.current_version ??
          null)
        : null;

      // ----------------------------------------------------------
      // 4. TERMS HTML
      //
      // Explicit DTO HTML has highest priority.
      // Then BOQ snapshot.
      // Then current template content.
      // ----------------------------------------------------------

      const termsHtml =
        dto.terms_html ??
        boq?.terms_html ??
        termsTemplate?.content_html ??
        null;

      // ----------------------------------------------------------
      // 5. ESTIMATE NUMBER
      // ----------------------------------------------------------

      const estimateNumber = dto.estimate_number || `BE-${Date.now()}`;

      // ----------------------------------------------------------
      // 6. CREATE ESTIMATE HEADER
      // ----------------------------------------------------------

      const estimate = await this.estimateModel.create(
        {
          project_id: dto.project_id,

          boq_id: dto.boq_id || null,

          source_template_id: dto.source_template_id || null,

          estimate_number: estimateNumber,

          title: dto.title,

          status: 'draft',

          client_name: dto.client_name ?? boq?.client_name ?? null,

          location: dto.location ?? boq?.location ?? null,

          prepared_by: dto.prepared_by ?? boq?.prepared_by ?? null,

          estimate_date: dto.estimate_date ?? boq?.date ?? null,

          misc_percentage: dto.misc_percentage ?? 0,

          design_amount: dto.design_amount ?? 0,

          execution_amount: dto.execution_amount ?? 0,

          supervisor_amount: dto.supervisor_amount ?? 0,

          additional_amount: dto.additional_amount ?? 0,

          tax_percentage: dto.tax_percentage ?? 0,

          discount_amount: dto.discount_amount ?? 0,

          // ------------------------------------------------------
          // TERMS
          // ------------------------------------------------------

          terms_html: termsHtml,

          terms_template_id: termsTemplateId,

          terms_template_version: termsTemplateVersion,

          // ------------------------------------------------------
          // AUDIT
          // ------------------------------------------------------

          created_by: userId || null,

          updated_by: userId || null,
        },
        {
          transaction,
        },
      );

      // ----------------------------------------------------------
      // 7. CREATE CATEGORIES + ITEMS
      // ----------------------------------------------------------

      if (dto.categories?.length) {
        for (const categoryDto of dto.categories) {
          const category = await this.categoryModel.create(
            {
              estimate_id: estimate.id,

              library_category_id: categoryDto.library_category_id || null,

              name: categoryDto.name,

              sort_order: categoryDto.sort_order ?? 0,
            },
            {
              transaction,
            },
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

      // ----------------------------------------------------------
      // 8. CREATE MISCELLANEOUS
      // ----------------------------------------------------------

      if (dto.miscellaneous?.length) {
        await this.miscellaneousModel.bulkCreate(
          dto.miscellaneous.map((item) => ({
            estimate_id: estimate.id,

            name: item.name,

            value: item.value,

            notes: item.notes || null,

            sort_order: item.sort_order ?? 0,
          })),
          {
            transaction,
          },
        );
      }

      // ----------------------------------------------------------
      // 9. COMMIT
      // ----------------------------------------------------------

      await transaction.commit();

      // ----------------------------------------------------------
      // 10. RETURN COMPLETE ESTIMATE
      // ----------------------------------------------------------

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

    const quantity = Number(dto.quantity ?? 0);

    const rate = Number(dto.rate ?? libraryItem?.default_rate ?? 0);

    await this.itemModel.create(
      {
        estimate_id: estimateId,

        estimate_category_id: categoryId,

        library_item_id: dto.library_item_id || null,

        boq_item_id: dto.boq_item_id || null,

        name: dto.name || libraryItem?.name || 'Unnamed Item',

        unit_id: dto.unit_id || libraryItem?.unit_id || null,

        unit: dto.unit || libraryItem?.unit || null,

        quantity,

        rate,

        amount: quantity * rate,

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
  // CONVERT BOQ → BUDGET ESTIMATE
  // ============================================================

  async createFromBoq(boqId: string, userId?: string): Promise<BudgetEstimate> {
    const transaction = await this.sequelize.transaction();

    try {
      // --------------------------------------------------------
      // 1. LOAD BOQ
      // --------------------------------------------------------

      const boq = await this.boqModel.findByPk(boqId, {
        transaction,

        include: [
          {
            model: BoqCategory,
            as: 'categories',

            include: [
              {
                model: BoqItem,
                as: 'items',

                include: [
                  {
                    model: LibraryItem,
                    as: 'library_item',
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!boq) {
        throw new NotFoundException('BOQ not found');
      }

      // --------------------------------------------------------
      // 2. CHECK PROJECT
      // --------------------------------------------------------

      const project = await this.projectModel.findByPk(boq.project_id, {
        transaction,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // --------------------------------------------------------
      // 3. RESOLVE TERMS TEMPLATE
      //
      // IMPORTANT:
      // BOQ may contain an old/deleted terms_template_id.
      //
      // Because TermsTemplate is paranoid, findByPk() will also
      // exclude soft-deleted templates.
      //
      // We only save the FK if the template actually exists.
      // The BOQ terms_html remains as a snapshot regardless.
      // --------------------------------------------------------

      let termsTemplate: TermsTemplate | null = null;

      if (boq.terms_template_id) {
        termsTemplate = await this.termsTemplateModel.findByPk(
          boq.terms_template_id,
          {
            transaction,
          },
        );
      }

      const termsTemplateId = termsTemplate?.id ?? null;

      const termsTemplateVersion = termsTemplate
        ? (boq.terms_template_version ?? termsTemplate.current_version ?? null)
        : null;

      // --------------------------------------------------------
      // 4. RESOLVE TERMS HTML
      //
      // Priority:
      //
      // 1. BOQ snapshot
      // 2. Current template content
      // 3. null
      //
      // BOQ snapshot is preferred because the estimate should
      // preserve exactly what was present on the BOQ.
      // --------------------------------------------------------

      const termsHtml = boq.terms_html ?? termsTemplate?.content_html ?? null;

      // --------------------------------------------------------
      // 5. GENERATE ESTIMATE NUMBER
      // --------------------------------------------------------

      const estimateNumber = await this.generateEstimateNumber(transaction);

      // --------------------------------------------------------
      // 6. CREATE ESTIMATE HEADER
      // --------------------------------------------------------

      const estimate = await this.estimateModel.create(
        {
          project_id: boq.project_id,

          boq_id: boq.id,

          source_template_id: boq.source_template_id || null,

          estimate_number: estimateNumber,

          title: `Budget Estimate - ${boq.title}`,

          status: 'draft',

          // ------------------------------------------------------
          // SNAPSHOT BOQ INFORMATION
          // ------------------------------------------------------

          client_name: boq.client_name || null,

          location: boq.location || null,

          prepared_by: boq.prepared_by || null,

          estimate_date: boq.date || null,

          // ------------------------------------------------------
          // COPY BOQ COMMERCIAL VALUES
          // ------------------------------------------------------

          misc_percentage: Number(boq.misc_pct || 0),

          design_amount: Number(boq.design_amount || 0),

          execution_amount: Number(boq.execution_amount || 0),

          supervisor_amount: Number(boq.supervisor_amount || 0),

          additional_amount: Number(boq.additional_total || 0),

          // ------------------------------------------------------
          // TERMS
          //
          // NEVER insert an invalid FK.
          // ------------------------------------------------------

          terms_html: termsHtml,

          terms_template_id: termsTemplateId,

          terms_template_version: termsTemplateVersion,

          // ------------------------------------------------------
          // AUDIT
          // ------------------------------------------------------

          created_by: userId || null,

          updated_by: userId || null,
        },

        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // 7. CONVERT CATEGORIES + ITEMS
      // --------------------------------------------------------

      const boqCategories = ((boq as any).categories || []) as any[];

      for (
        let categoryIndex = 0;
        categoryIndex < boqCategories.length;
        categoryIndex++
      ) {
        const boqCategory = boqCategories[categoryIndex];

        // ------------------------------------------------------
        // CREATE BUDGET CATEGORY
        // ------------------------------------------------------

        const budgetCategory = await this.categoryModel.create(
          {
            estimate_id: estimate.id,

            library_category_id: boqCategory.library_category_id || null,

            name: boqCategory.name,

            sort_order: boqCategory.sort_order ?? categoryIndex,
          },

          {
            transaction,
          },
        );

        // ------------------------------------------------------
        // CONVERT ITEMS
        // ------------------------------------------------------

        const boqItems = (boqCategory.items || []) as BoqItem[];

        for (let itemIndex = 0; itemIndex < boqItems.length; itemIndex++) {
          const boqItem = boqItems[itemIndex];

          const quantity = Number(boqItem.quantity || 0);

          const rate = Number(boqItem.rate || 0);

          await this.itemModel.create(
            {
              estimate_id: estimate.id,

              estimate_category_id: budgetCategory.id,

              library_item_id: boqItem.library_item_id || null,

              boq_item_id: boqItem.id,

              // --------------------------------------------------
              // SNAPSHOT
              // --------------------------------------------------

              name: boqItem.name,

              unit_id: boqItem.unit_id || null,

              unit: boqItem.unit || null,

              quantity,

              rate,

              amount: quantity * rate,

              calc_type: boqItem.calc_type || 'M',

              location: boqItem.location || null,

              detail: boqItem.detail || null,

              notes: boqItem.notes || null,

              hidden: boqItem.hidden ?? false,

              sort_order: boqItem.sort_order ?? itemIndex,
            },

            {
              transaction,
            },
          );
        }
      }

      // --------------------------------------------------------
      // 8. RECALCULATE
      // --------------------------------------------------------

      await this.recalculateWithTransaction(estimate.id, transaction);

      // --------------------------------------------------------
      // 9. CREATE INITIAL VERSION
      // --------------------------------------------------------
      //
      // Currently optional.
      //
      // If you later want V1 automatically created here,
      // create BudgetEstimateVersion using the same transaction.
      //
      // --------------------------------------------------------

      // --------------------------------------------------------
      // 10. COMMIT
      // --------------------------------------------------------

      await transaction.commit();

      // --------------------------------------------------------
      // 11. RETURN COMPLETE ESTIMATE
      // --------------------------------------------------------

      return this.findOne(estimate.id);
    } catch (error) {
      await transaction.rollback();

      throw error;
    }
  }
  // ============================================================
  // RECALCULATE WITH TRANSACTION
  // ============================================================

  private async recalculateWithTransaction(id: string, transaction: any) {
    const estimate = await this.estimateModel.findByPk(id, { transaction });

    if (!estimate) {
      throw new NotFoundException('Budget estimate not found');
    }

    const items = await this.itemModel.findAll({
      where: {
        estimate_id: id,
      },

      transaction,
    });

    const miscellaneous = await this.miscellaneousModel.findAll({
      where: {
        estimate_id: id,
      },

      transaction,
    });

    // ----------------------------------------------------------
    // SUBTOTAL
    // ----------------------------------------------------------

    const subtotal = items
      .filter((item) => !item.hidden)
      .reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.rate),
        0,
      );

    // ----------------------------------------------------------
    // MISC
    // ----------------------------------------------------------

    const miscItemsTotal = miscellaneous.reduce(
      (sum, item) => sum + Number(item.value),
      0,
    );

    const percentageMisc =
      subtotal * (Number(estimate.misc_percentage || 0) / 100);

    const miscAmount = percentageMisc + miscItemsTotal;

    // ----------------------------------------------------------
    // BEFORE TAX
    // ----------------------------------------------------------

    const beforeTax =
      subtotal +
      miscAmount +
      Number(estimate.design_amount || 0) +
      Number(estimate.execution_amount || 0) +
      Number(estimate.supervisor_amount || 0) +
      Number(estimate.additional_amount || 0) -
      Number(estimate.discount_amount || 0);

    // ----------------------------------------------------------
    // TAX
    // ----------------------------------------------------------

    const taxAmount = beforeTax * (Number(estimate.tax_percentage || 0) / 100);

    // ----------------------------------------------------------
    // TOTAL
    // ----------------------------------------------------------

    const totalAmount = beforeTax + taxAmount;

    await estimate.update(
      {
        subtotal,

        misc_amount: miscAmount,

        tax_amount: taxAmount,

        total_amount: totalAmount,
      },

      { transaction },
    );

    return estimate;
  }

  // ============================================================
  // GENERATE ESTIMATE NUMBER
  // ============================================================

  private async generateEstimateNumber(transaction: any): Promise<string> {
    const year = new Date().getFullYear();

    const prefix = `BE-${year}-`;

    const latest = await this.estimateModel.findOne({
      where: {
        estimate_number: {
          [Op.like]: `${prefix}%`,
        },
      },

      order: [['created_at', 'DESC']],

      transaction,
    });

    let nextNumber = 1;

    if (latest?.estimate_number) {
      const match = latest.estimate_number.match(
        new RegExp(`^BE-${year}-(\\d+)$`),
      );

      if (match) {
        nextNumber = Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
}
