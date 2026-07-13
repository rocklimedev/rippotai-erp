import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { fn, col, Transaction } from 'sequelize';
import { Boq } from './models/boq.model';
import { BoqCategory } from './models/boq-category.model';
import { BoqItem } from './models/boq-item.model';
import { BoqTemplate } from './models/boq-template.model';
import { Project } from '../projects/models/projects.model';
import { CreateBoqDto } from './dto/create-boq.dto';
import { UpdateBoqDto } from './dto/update-boq.dto';
import {
  CreateBoqCategoryDto,
  UpdateBoqCategoryDto,
} from './dto/create-boq-category.dto';
import { CreateBoqItemDto, UpdateBoqItemDto } from './dto/create-boq-item.dto';
import { BoqActivityService } from './boq-activity.service';
import { BoqActivityAction, BoqStatus } from '@/common/enums/boq-enums';

@Injectable()
export class BoqService {
  constructor(
    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
    @InjectModel(BoqCategory)
    private readonly categoryModel: typeof BoqCategory,
    @InjectModel(BoqItem)
    private readonly itemModel: typeof BoqItem,
    @InjectModel(BoqTemplate)
    private readonly templateModel: typeof BoqTemplate,
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    private readonly sequelize: Sequelize,
    private readonly activity: BoqActivityService,
  ) {}

  async findAll(project_id?: string) {
    return this.boqModel.findAll({
      where: project_id ? { project_id } : undefined,
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const boq = await this.boqModel.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        {
          model: BoqCategory,
          include: [BoqItem],
        },
      ],
      order: [
        [{ model: BoqCategory, as: 'categories' }, 'sort_order', 'ASC'],
        [
          { model: BoqCategory, as: 'categories' },
          { model: BoqItem, as: 'items' },
          'sort_order',
          'ASC',
        ],
      ],
    });
    if (!boq) throw new NotFoundException('BOQ not found');
    return boq;
  }

  /**
   * Creates a new BOQ for a project. If template_id is supplied, the
   * template's categories/items are deep-copied as independent rows
   * (snapshot), so later edits to the template never affect this BOQ.
   */
  async create(dto: CreateBoqDto, actorId?: string) {
    const project = await this.projectModel.findByPk(dto.project_id);

    if (!project) throw new NotFoundException('Project not found');

    const boqId = await this.sequelize.transaction(async (t) => {
      const boq = await this.boqModel.create(
        {
          project_id: dto.project_id,
          title: dto.title || `${project.name} · Bill of Quantities`,
          status: BoqStatus.DRAFT,
          created_by: actorId ?? null,
        } as Boq,
        { transaction: t },
      );

      await this.recomputeTotal(boq.id, t);

      await this.activity.log({
        boq_id: boq.id,
        user_id: actorId,
        action: BoqActivityAction.CREATED,
        target: `BOQ · ${boq.title}`,
        details: 'Created blank',
        transaction: t,
      });

      return boq.id;
    });

    return this.findOne(boqId);
  }
  async update(id: string, dto: UpdateBoqDto, actorId?: string) {
    const boq = await this.getOrThrow(id);
    const statusChanged = dto.status && dto.status !== boq.status;

    await boq.update({ ...dto, updated_by: actorId ?? null });

    await this.activity.log({
      boq_id: boq.id,
      user_id: actorId,
      action: statusChanged
        ? this.actionForStatus(dto.status as BoqStatus)
        : BoqActivityAction.UPDATED,
      target: `BOQ · ${boq.title}`,
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    const boq = await this.getOrThrow(id);
    await boq.destroy();

    await this.activity.log({
      boq_id: boq.id,
      user_id: actorId,
      action: BoqActivityAction.DELETED,
      target: `BOQ · ${boq.title}`,
    });

    return { id, deleted: true };
  }

  // ---------- Categories ----------

  async addCategory(
    boqId: string,
    dto: CreateBoqCategoryDto,
    actorId?: string,
  ) {
    await this.getOrThrow(boqId);
    const category = await this.categoryModel.create({
      boq_id: boqId,
      name: dto.name,
      sort_order: dto.sort_order ?? 0,
    } as BoqCategory);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.CATEGORY_ADDED,
      target: `Category · ${category.name}`,
    });

    return category;
  }

  async updateCategory(
    boqId: string,
    categoryId: string,
    dto: UpdateBoqCategoryDto,
  ) {
    const category = await this.getCategoryOrThrow(boqId, categoryId);
    await category.update(dto);
    return category;
  }

  async removeCategory(boqId: string, categoryId: string, actorId?: string) {
    const category = await this.getCategoryOrThrow(boqId, categoryId);
    await category.destroy();
    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.CATEGORY_DELETED,
      target: `Category · ${category.name}`,
    });

    return { id: categoryId, deleted: true };
  }

  // ---------- Line items ----------

  async addItem(boqId: string, dto: CreateBoqItemDto, actorId?: string) {
    const category = await this.getCategoryOrThrow(boqId, dto.boq_category_id);
    const quantity = dto.quantity ?? 0;
    const rate = dto.rate ?? 0;

    const item = await this.itemModel.create({
      boq_category_id: category.id,
      library_item_id: dto.library_item_id ?? null,
      name: dto.name ?? '',
      unit_id: dto.unit_id ?? null,
      unit: dto.unit ?? null,
      quantity,
      rate,
      amount: quantity * rate,
      notes: dto.notes ?? null,
      sort_order: dto.sort_order ?? 0,
    } as BoqItem);

    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEM_ADDED,
      target: `Item · ${item.name}`,
    });

    return item;
  }

  async updateItem(
    boqId: string,
    itemId: string,
    dto: UpdateBoqItemDto,
    actorId?: string,
  ) {
    const item = await this.getItemOrThrow(boqId, itemId);

    if (dto.boq_category_id && dto.boq_category_id !== item.boq_category_id) {
      // Validate the target category belongs to the same BOQ.
      await this.getCategoryOrThrow(boqId, dto.boq_category_id);
    }

    const quantity = dto.quantity ?? Number(item.quantity);
    const rate = dto.rate ?? Number(item.rate);
    const rateChanged =
      dto.rate !== undefined && Number(dto.rate) !== Number(item.rate);
    const moved =
      dto.boq_category_id !== undefined &&
      dto.boq_category_id !== item.boq_category_id;

    await item.update({
      ...dto,
      quantity,
      rate,
      amount: quantity * rate,
    });

    await this.recomputeTotal(boqId);

    if (moved) {
      await this.activity.log({
        boq_id: boqId,
        user_id: actorId,
        action: BoqActivityAction.ITEM_MOVED,
        target: `Item · ${item.name}`,
      });
    } else {
      await this.activity.log({
        boq_id: boqId,
        user_id: actorId,
        action: rateChanged
          ? BoqActivityAction.RATE_CHANGED
          : BoqActivityAction.ITEM_UPDATED,
        target: `Item · ${item.name}`,
        details: rateChanged ? `Rate updated to ${rate}` : undefined,
      });
    }

    return item;
  }

  async removeItem(boqId: string, itemId: string, actorId?: string) {
    const item = await this.getItemOrThrow(boqId, itemId);
    await item.destroy();
    await this.recomputeTotal(boqId);

    await this.activity.log({
      boq_id: boqId,
      user_id: actorId,
      action: BoqActivityAction.ITEM_DELETED,
      target: `Item · ${item.name}`,
    });

    return { id: itemId, deleted: true };
  }

  // ---------- helpers ----------

  private async getOrThrow(id: string) {
    const boq = await this.boqModel.findByPk(id);
    if (!boq) throw new NotFoundException('BOQ not found');
    return boq;
  }

  private async getCategoryOrThrow(boqId: string, categoryId: string) {
    const category = await this.categoryModel.findOne({
      where: { id: categoryId, boq_id: boqId },
    });
    if (!category) throw new NotFoundException('BOQ category not found');
    return category;
  }

  private async getItemOrThrow(boqId: string, itemId: string) {
    const item = await this.itemModel.findByPk(itemId, {
      include: [{ model: BoqCategory, where: { boq_id: boqId } }],
    });
    if (!item) throw new NotFoundException('BOQ item not found');
    return item;
  }

  private actionForStatus(status: BoqStatus): BoqActivityAction {
    switch (status) {
      case BoqStatus.PENDING_APPROVAL:
        return BoqActivityAction.SUBMITTED;
      case BoqStatus.APPROVED:
        return BoqActivityAction.APPROVED;
      case BoqStatus.REJECTED:
        return BoqActivityAction.REJECTED;
      case BoqStatus.ARCHIVED:
        return BoqActivityAction.ARCHIVED;
      default:
        return BoqActivityAction.UPDATED;
    }
  }

  private async recomputeTotal(boqId: string, transaction?: Transaction) {
    const result = (await this.itemModel.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
      include: [
        {
          model: BoqCategory,
          attributes: [],
          where: { boq_id: boqId },
        },
      ],
      raw: true,
      transaction,
    })) as unknown as { total: string } | null;

    await this.boqModel.update(
      {
        total_value: Number(result?.total ?? 0),
      },
      {
        where: { id: boqId },
        transaction,
      },
    );
  }
}
