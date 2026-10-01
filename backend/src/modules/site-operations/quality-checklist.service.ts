import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import {
  QualityChecklist,
  ChecklistStatus,
} from './models/quality-checklist.model';
import {
  QualityChecklistItem,
  ItemStatus,
  CheckpointPhase,
} from './models/quality-checklist-item.model';
import {
  CreateQualityChecklistDto,
  UpdateQualityChecklistDto,
  CreateQualityChecklistItemDto,
  UpdateQualityChecklistItemDto,
  PaginatedQualityChecklistDto,
  ChecklistSummaryDto,
  FilterQualityChecklistDto,
  FilterChecklistItemDto,
  BulkUpdateChecklistItemsDto,
} from './dto/quality-checklist.dto';
import { WorkHead, WorkHeadLabels } from '@/common/enums/quality-checklist.enums';
import {
  WORK_HEAD_CHECKPOINTS,
} from './constants/work-head-checkpoints.constant';

@Injectable()
export class QualityChecklistService {
  constructor(
    @InjectModel(QualityChecklist)
    private readonly checklistModel: typeof QualityChecklist,
    @InjectModel(QualityChecklistItem)
    private readonly checklistItemModel: typeof QualityChecklistItem,
  ) {}

  /**
   * Create a new Quality Checklist
   */
  async createChecklist(
    createChecklistDto: CreateQualityChecklistDto,
    userId: string,
  ): Promise<QualityChecklist> {
    try {
      const { checklist_items, ...checklistData } = createChecklistDto;

      const checklist = await this.checklistModel.create({
        ...checklistData,
        created_by: userId,
        updated_by: userId,
      });

      if (checklist_items && checklist_items.length > 0) {
        const items = checklist_items.map((item) => ({
          ...item,
          checklist_id: checklist.id,
          created_by: userId,
          updated_by: userId,
        }));

        await this.checklistItemModel.bulkCreate(items);
      }

      return this.getChecklistById(checklist.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      throw new BadRequestException(`Failed to create checklist: ${message}`);
    }
  }
  /**
   * Get checklist by ID with all items
   */
  async getChecklistById(id: string): Promise<QualityChecklist> {
    const checklist = await this.checklistModel.findByPk(id, {
      include: [
        {
          model: QualityChecklistItem,
          as: 'checklist_items',
          order: [['serial_number', 'ASC']],
        },
      ],
    });

    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }

    return checklist;
  }

  /**
   * Get all checklists for a project with pagination and filtering
   */
  async getChecklistsByProject(
    projectId: string,
    filter: FilterQualityChecklistDto,
  ): Promise<PaginatedQualityChecklistDto> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));
    const offset = (page - 1) * limit;

    const where: any = { project_id: projectId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      where[Op.or] = [
        { checklist_name: { [Op.like]: `%${filter.search}%` } },
        { description: { [Op.like]: `%${filter.search}%` } },
      ];
    }

    const { count, rows } = await this.checklistModel.findAndCountAll({
      where,
      include: [
        {
          model: QualityChecklistItem,
          as: 'checklist_items',
          order: [['serial_number', 'ASC']],
        },
      ],
      order: [[filter.sortBy || 'created_at', filter.sortOrder || 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update checklist
   */
  async updateChecklist(
    id: string,
    updateChecklistDto: UpdateQualityChecklistDto,
    userId: string,
  ): Promise<QualityChecklist> {
    const checklist = await this.getChecklistById(id);

    await checklist.update(
      {
        ...updateChecklistDto,
        updated_by: userId,
      },
      { returning: true },
    );

    return this.getChecklistById(id);
  }

  /**
   * Delete checklist (soft delete)
   */
  async deleteChecklist(id: string): Promise<void> {
    const checklist = await this.getChecklistById(id);
    await checklist.destroy();
  }

  /**
   * Add item to checklist
   */
  async addChecklistItem(
    checklistId: string,
    createItemDto: CreateQualityChecklistItemDto,
    userId: string,
  ): Promise<QualityChecklistItem> {
    const checklist = await this.getChecklistById(checklistId);

    const item = await this.checklistItemModel.create({
      ...createItemDto,
      checklist_id: checklistId,
      created_by: userId,
      updated_by: userId,
    });

    // Recalculate completion percentage
    await this.updateChecklistCompletion(checklistId);

    return item;
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    itemId: string,
    updateItemDto: UpdateQualityChecklistItemDto,
    userId: string,
  ): Promise<QualityChecklistItem> {
    const item = await this.checklistItemModel.findByPk(itemId);

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    await item.update(
      {
        ...updateItemDto,
        updated_by: userId,
      },
      { returning: true },
    );

    // Recalculate completion percentage
    await this.updateChecklistCompletion(item.checklist_id);

    return item;
  }

  /**
   * Bulk update checklist items
   */
  async bulkUpdateChecklistItems(
    bulkUpdateDto: BulkUpdateChecklistItemsDto,
    userId: string,
  ): Promise<QualityChecklistItem[]> {
    const items = bulkUpdateDto.items;
    const checklistIds = new Set<string>();

    // Update each item
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const checklistItem = await this.checklistItemModel.findByPk(item.id);
        if (!checklistItem) {
          throw new NotFoundException(
            `Checklist item with ID ${item.id} not found`,
          );
        }

        checklistIds.add(checklistItem.checklist_id);

        await checklistItem.update(
          {
            status: item.status,
            is_accepted: item.is_accepted,
            remarks: item.remarks,
            inspection_date: item.inspection_date,
            inspected_by: item.inspected_by,
            updated_by: userId,
          },
          { returning: true },
        );

        return checklistItem;
      }),
    );

    // Recalculate completion for all affected checklists
    for (const checklistId of checklistIds) {
      await this.updateChecklistCompletion(checklistId);
    }

    return updatedItems;
  }

  /**
   * Get checklist items with filtering
   */
  async getChecklistItems(
    filter: FilterChecklistItemDto,
  ): Promise<{ items: QualityChecklistItem[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filter.checklist_id) {
      where.checklist_id = filter.checklist_id;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.phase) {
      where.phase = filter.phase;
    }

    if (filter.is_accepted !== undefined) {
      where.is_accepted = filter.is_accepted;
    }

    const { count, rows } = await this.checklistItemModel.findAndCountAll({
      where,
      order: [[filter.sortBy || 'serial_number', filter.sortOrder || 'ASC']],
      limit,
      offset,
    });

    return { items: rows, total: count };
  }

  /**
   * Delete checklist item
   */
  async deleteChecklistItem(itemId: string): Promise<void> {
    const item = await this.checklistItemModel.findByPk(itemId);

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    const checklistId = item.checklist_id;
    await item.destroy();

    // Recalculate completion percentage
    await this.updateChecklistCompletion(checklistId);
  }

  /**
   * Calculate and update checklist completion percentage
   */
  async updateChecklistCompletion(checklistId: string): Promise<void> {
    const summary = await this.getChecklistSummary(checklistId);

    const completionPercentage =
      summary.total_items > 0
        ? (summary.accepted_items / summary.total_items) * 100
        : 0;

    // Update status based on completion
    let status = ChecklistStatus.PENDING;
    if (completionPercentage > 0 && completionPercentage < 100) {
      status = ChecklistStatus.IN_PROGRESS;
    } else if (completionPercentage === 100) {
      status = ChecklistStatus.COMPLETED;
    }

    await this.checklistModel.update(
      {
        completion_percentage: Math.round(completionPercentage * 100) / 100,
        status,
      },
      { where: { id: checklistId } },
    );
  }

  /**
   * Get checklist summary/statistics
   */
  async getChecklistSummary(checklistId: string): Promise<ChecklistSummaryDto> {
    const items = await this.checklistItemModel.findAll({
      where: { checklist_id: checklistId },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_items'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal('CASE WHEN is_accepted = true THEN 1 ELSE 0 END'),
          ),
          'accepted_items',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              'CASE WHEN is_accepted = false THEN 1 ELSE 0 END',
            ),
          ),
          'rejected_items',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN status = '${ItemStatus.NOT_STARTED}' THEN 1 ELSE 0 END`,
            ),
          ),
          'pending_items',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN status = '${ItemStatus.IN_PROGRESS}' THEN 1 ELSE 0 END`,
            ),
          ),
          'in_progress_items',
        ],
      ],
      raw: true,
    });

    const summary = items[0] as any;
    const totalItems = parseInt(summary.total_items) || 0;
    const acceptedItems = parseInt(summary.accepted_items) || 0;
    const rejectedItems = parseInt(summary.rejected_items) || 0;

    return {
      total_items: totalItems,
      accepted_items: acceptedItems,
      rejected_items: rejectedItems,
      pending_items: parseInt(summary.pending_items) || 0,
      in_progress_items: parseInt(summary.in_progress_items) || 0,
      completion_percentage:
        totalItems > 0 ? Math.round((acceptedItems / totalItems) * 100) : 0,
      acceptance_percentage:
        totalItems > 0
          ? Math.round(((acceptedItems - rejectedItems) / totalItems) * 100)
          : 0,
    };
  }

  /**
   * Get items by phase
   */
  async getItemsByPhase(
    checklistId: string,
    phase: CheckpointPhase,
  ): Promise<QualityChecklistItem[]> {
    return this.checklistItemModel.findAll({
      where: { checklist_id: checklistId, phase },
      order: [['serial_number', 'ASC']],
    });
  }

  /**
   * Mark checklist as complete
   */
  async completeChecklist(id: string): Promise<QualityChecklist> {
    const checklist = await this.getChecklistById(id);

    // Check if all items are accepted
    const pendingItems = await this.checklistItemModel.count({
      where: {
        checklist_id: id,
        is_accepted: { [Op.ne]: true },
      },
    });

    if (pendingItems > 0) {
      throw new BadRequestException(
        'Cannot complete checklist with pending items',
      );
    }

    await checklist.update({
      status: ChecklistStatus.PASSED,
      completion_percentage: 100,
    });

    return checklist;
  }

  /**
   * Export checklist data to Excel-ready format
   */
  async exportChecklistData(checklistId: string): Promise<any> {
    const checklist = await this.getChecklistById(checklistId);
    const summary = await this.getChecklistSummary(checklistId);

    return {
      checklist: {
        id: checklist.id,
        name: checklist.checklist_name,
        status: checklist.status,
        completion_percentage: checklist.completion_percentage,
      },
      summary,
      items: checklist.checklist_items.map((item) => ({
        serial_number: item.serial_number,
        checkpoint_name: item.checkpoint_name,
        phase: item.phase,
        status: item.status,
        is_accepted: item.is_accepted,
        remarks: item.remarks,
        inspection_date: item.inspection_date,
      })),
    };
  }

  /**
   * Return the cleaned template checkpoints for a work head
   * (from QUALITY CHECK LIST.xlsx detailed sheets).
   */
  getWorkHeadTemplate(workHead: WorkHead) {
    const checkpoints = WORK_HEAD_CHECKPOINTS[workHead] ?? [];
    return {
      work_head: workHead,
      label: WorkHeadLabels[workHead],
      checkpoint_count: checkpoints.length,
      checkpoints,
    };
  }

  /**
   * List all work heads that have a detailed checkpoint template.
   */
  listWorkHeadTemplates() {
    return (Object.keys(WORK_HEAD_CHECKPOINTS) as WorkHead[])
      .map((wh) => ({
        work_head: wh,
        label: WorkHeadLabels[wh],
        checkpoint_count: WORK_HEAD_CHECKPOINTS[wh].length,
        has_template: WORK_HEAD_CHECKPOINTS[wh].length > 0,
      }))
      .filter((t) => t.has_template);
  }

  /**
   * Create a project quality checklist pre-filled from a work-head template.
   * Source: QUALITY CHECK LIST.xlsx detailed sheet for that work head.
   */
  async createFromWorkHead(
    projectId: string,
    workHead: WorkHead,
    userId: string,
    description?: string,
  ): Promise<QualityChecklist> {
    const template = WORK_HEAD_CHECKPOINTS[workHead];
    if (!template || template.length === 0) {
      throw new BadRequestException(
        `No detailed checklist template for work head: ${workHead}`,
      );
    }

    return this.createChecklist(
      {
        project_id: projectId,
        checklist_name: WorkHeadLabels[workHead],
        description:
          description ??
          `Auto-generated from ${WorkHeadLabels[workHead]} QC template`,
        checklist_items: template.map((c) => ({
          serial_number: c.serial_number,
          checkpoint_name: c.checkpoint_name,
          phase: c.phase,
        })),
      } as any,
      userId,
    );
  }
}
