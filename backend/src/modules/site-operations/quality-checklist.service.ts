import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize as Database } from 'sequelize-typescript';
import { QualityChecklistTemplate } from './models/quality-checklist-template.model';
import { Project } from '../projects/models/projects.model';
import { QualityService } from './quality.service';
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
import { WorkHead } from '@/common/enums/quality-checklist.enums';

@Injectable()
export class QualityChecklistService {
  constructor(
    @InjectModel(QualityChecklist)
    private readonly checklistModel: typeof QualityChecklist,
    @InjectModel(QualityChecklistItem)
    private readonly checklistItemModel: typeof QualityChecklistItem,
    @InjectModel(QualityChecklistTemplate)
    private readonly templateModel: typeof QualityChecklistTemplate,
    private readonly database: Database,
    private readonly qualityService: QualityService,
  ) {}

  /**
   * Create a new Quality Checklist
   */
  async createChecklist(
    createChecklistDto: CreateQualityChecklistDto,
    userId: string,
  ): Promise<QualityChecklist> {
    let createdId = '';
    await this.database.transaction(async (transaction) => {
      const { checklist_items, ...checklistData } = createChecklistDto;

      if (
        !(await Project.findByPk(checklistData.project_id, { transaction }))
      ) {
        throw new NotFoundException('Project not found');
      }
      const checklist = await this.checklistModel.create(
        {
          ...checklistData,
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );

      if (checklist_items && checklist_items.length > 0) {
        const items = checklist_items.map((item) => ({
          ...item,
          checklist_id: checklist.id,
          created_by: userId,
          updated_by: userId,
        }));

        await this.checklistItemModel.bulkCreate(items, { transaction });
      }
      createdId = checklist.id;
    });
    return this.getChecklistById(createdId);
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
          separate: true,
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
    return this.getChecklists({ ...filter, project_id: projectId });
  }

  async getChecklists(
    filter: FilterQualityChecklistDto,
  ): Promise<PaginatedQualityChecklistDto> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));
    const offset = (page - 1) * limit;

    const where: any = {};
    if (filter.project_id) where.project_id = filter.project_id;

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
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        {
          model: QualityChecklistItem,
          as: 'checklist_items',
          separate: true,
          order: [['serial_number', 'ASC']],
        },
      ],
      order: [
        [
          ['created_at', 'checklist_name', 'status'].includes(
            filter.sortBy ?? '',
          )
            ? filter.sortBy!
            : 'created_at',
          filter.sortOrder || 'DESC',
        ],
      ],
      limit,
      offset,
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
    if (
      updateChecklistDto.status === ChecklistStatus.PASSED &&
      (!checklist.checklist_items.length ||
        checklist.checklist_items.some((item) => item.is_accepted !== true))
    ) {
      throw new BadRequestException(
        'Cannot pass a checklist with pending items',
      );
    }

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
    await this.getChecklistById(checklistId);

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

    await this.getChecklistById(item.checklist_id);

    await item.update(
      {
        ...this.normalizeResult(updateItemDto),
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
    if (
      new Set(bulkUpdateDto.items.map((item) => item.id)).size !==
      bulkUpdateDto.items.length
    ) {
      throw new BadRequestException('Duplicate item IDs in bulk update');
    }
    const updated = await this.database.transaction(async (transaction) => {
      const rows: QualityChecklistItem[] = [];
      // Validate every target before changing any result.
      for (const patch of bulkUpdateDto.items) {
        const row = await this.checklistItemModel.findByPk(patch.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!row)
          throw new NotFoundException(`Checklist item ${patch.id} not found`);
        if (
          !(await this.checklistModel.findByPk(row.checklist_id, {
            transaction,
          }))
        )
          throw new NotFoundException('Checklist not found');
        this.normalizeResult(patch);
        rows.push(row);
      }
      for (let index = 0; index < rows.length; index++) {
        const { id, ...patch } = bulkUpdateDto.items[index];
        await rows[index].update(
          { ...this.normalizeResult(patch), updated_by: userId },
          { transaction },
        );
      }
      return rows;
    });
    for (const id of new Set(updated.map((row) => row.checklist_id)))
      await this.updateChecklistCompletion(id);
    return updated;
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
      order: [
        [
          ['serial_number', 'status', 'phase'].includes(filter.sortBy ?? '')
            ? filter.sortBy!
            : 'serial_number',
          filter.sortOrder || 'ASC',
        ],
      ],
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
    const parent = await this.checklistModel.findByPk(checklistId);

    // Inspected rows drive completion; acceptance remains a separate outcome.
    let status = ChecklistStatus.PENDING;
    if (summary.completion_percentage > 0 || summary.in_progress_items > 0) {
      status = ChecklistStatus.IN_PROGRESS;
    }
    if (summary.completion_percentage === 100) {
      status = ChecklistStatus.COMPLETED;
    }
    if (
      parent?.status === ChecklistStatus.PASSED &&
      summary.total_items > 0 &&
      summary.accepted_items === summary.total_items
    ) {
      status = ChecklistStatus.PASSED;
    }

    await this.checklistModel.update(
      {
        completion_percentage: summary.completion_percentage,
        status,
      },
      { where: { id: checklistId } },
    );
  }

  /**
   * Get checklist summary/statistics
   */
  async getChecklistSummary(checklistId: string): Promise<ChecklistSummaryDto> {
    await this.getChecklistById(checklistId);
    const items = await this.checklistItemModel.findAll({
      where: { checklist_id: checklistId },
    });
    const totalItems = items.length;
    const acceptedItems = items.filter(
      (item) => item.is_accepted === true,
    ).length;
    const rejectedItems = items.filter(
      (item) => item.is_accepted === false,
    ).length;
    const reviewed = items.filter((item) =>
      [ItemStatus.COMPLETED, ItemStatus.ACCEPTED, ItemStatus.REJECTED].includes(
        item.status,
      ),
    ).length;
    return {
      total_items: totalItems,
      accepted_items: acceptedItems,
      rejected_items: rejectedItems,
      pending_items: items.filter((item) =>
        [ItemStatus.NOT_STARTED, ItemStatus.DEFERRED].includes(item.status),
      ).length,
      in_progress_items: items.filter(
        (item) => item.status === ItemStatus.IN_PROGRESS,
      ).length,
      completion_percentage:
        totalItems > 0 ? Math.round((reviewed / totalItems) * 10000) / 100 : 0,
      acceptance_percentage:
        totalItems > 0
          ? Math.round((acceptedItems / totalItems) * 10000) / 100
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

    const items = await this.checklistItemModel.findAll({
      where: { checklist_id: id },
    });
    const pendingItems = items.filter(
      (item) => item.is_accepted !== true,
    ).length;

    if (!items.length || pendingItems > 0) {
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
    const project = await Project.findByPk(checklist.project_id);

    return {
      project: {
        id: checklist.project_id,
        name: project?.name ?? checklist.project_id,
      },
      checklist: {
        id: checklist.id,
        name: checklist.checklist_name,
        status: checklist.status,
        completion_percentage: checklist.completion_percentage,
        project_id: checklist.project_id,
        work_head: checklist.work_head,
        template_version: checklist.template_version,
        title: checklist.template_title || checklist.checklist_name,
        sheet_name: checklist.template_sheet_name || checklist.checklist_name,
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
        inspected_by: item.inspected_by,
      })),
    };
  }

  /**
   * Return source-exact seeded template checkpoints for a work head
   * (from QUALITY CHECK LIST.xlsx detailed sheets).
   */
  async getWorkHeadTemplate(workHead: WorkHead) {
    const template = await this.templateModel.findByPk(workHead);
    if (!template)
      throw new NotFoundException(
        'Quality template not found; apply the template migration',
      );
    const checkpoints = template.checkpoints;
    return {
      work_head: workHead,
      label: template.label,
      serial_number: template.serial_number,
      title: template.title,
      sheet_name: template.sheet_name,
      version: template.version,
      checkpoint_count: checkpoints.length,
      checkpoints,
    };
  }

  /**
   * List all work heads that have a detailed checkpoint template.
   */
  async listWorkHeadTemplates() {
    const templates = await this.templateModel.findAll({
      order: [['serial_number', 'ASC']],
    });
    return templates.map((template) => ({
      work_head: template.work_head,
      label: template.label,
      serial_number: template.serial_number,
      checkpoint_count: template.checkpoints.length,
      has_template: template.checkpoints.length > 0,
    }));
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
    const template = await this.getWorkHeadTemplate(workHead);
    if (!template.checkpoints.length) {
      throw new BadRequestException(
        `No detailed checklist template for work head: ${workHead}`,
      );
    }

    return this.createChecklist(
      {
        project_id: projectId,
        checklist_name: template.label,
        work_head: workHead,
        template_version: template.version,
        template_title: template.title,
        template_sheet_name: template.sheet_name,
        description:
          description ?? `QUALITY CHECK LIST.xlsx — ${template.sheet_name}`,
        checklist_items: template.checkpoints.map((c) => ({
          serial_number: c.serial_number,
          checkpoint_name: c.checkpoint_name,
          phase: c.phase,
        })),
      } as any,
      userId,
    );
  }

  private normalizeResult(dto: UpdateQualityChecklistItemDto) {
    const patch = { ...dto };
    if (
      (dto.status === ItemStatus.ACCEPTED && dto.is_accepted === false) ||
      (dto.status === ItemStatus.REJECTED && dto.is_accepted === true)
    ) {
      throw new BadRequestException('Status and acceptance conflict');
    }
    if (dto.status === ItemStatus.ACCEPTED) patch.is_accepted = true;
    else if (dto.status === ItemStatus.REJECTED) patch.is_accepted = false;
    else if (dto.status && dto.status !== ItemStatus.COMPLETED)
      patch.is_accepted = null;
    else if (dto.is_accepted === true) patch.status = ItemStatus.ACCEPTED;
    else if (dto.is_accepted === false) patch.status = ItemStatus.REJECTED;
    else if (dto.is_accepted === null && !dto.status)
      patch.status = ItemStatus.NOT_STARTED;
    return patch;
  }

  async exportProjectWorkbook(projectId: string) {
    const project = await Project.findByPk(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const checklists = await this.checklistModel.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: QualityChecklistItem,
          as: 'checklist_items',
          separate: true,
          order: [['serial_number', 'ASC']],
        },
      ],
      order: [['created_at', 'ASC']],
    });
    return {
      project: { id: project.id, name: project.name },
      work_heads: (
        await this.qualityService.projectChecklist({ project_id: projectId })
      ).filter((head) => head.work_head),
      checklists: await Promise.all(
        checklists.map((checklist) => this.exportChecklistData(checklist.id)),
      ),
    };
  }
}
