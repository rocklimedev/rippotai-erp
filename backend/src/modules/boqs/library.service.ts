import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { LibraryItem } from './models/library-item.model';
import { LibraryCategory } from './models/library-category.model';
import { BoqItem } from './models/boq-item.model';
import {
  CreateLibraryCategoryDto,
  CreateLibraryItemDto,
  QueryLibraryItemsDto,
  UpdateLibraryItemDto,
} from './dto/library-item.dto';
import { BoqActivityService } from './boq-activity.service';
import { BoqActivityAction } from '@/common/enums/boq-enums';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(LibraryItem)
    private readonly itemModel: typeof LibraryItem,
    @InjectModel(LibraryCategory)
    private readonly categoryModel: typeof LibraryCategory,
    @InjectModel(BoqItem)
    private readonly boqItemModel: typeof BoqItem,
    private readonly activity: BoqActivityService,
  ) {}

  async resolveCategory(name: string, transaction?: Transaction) {
    const [category] = await this.categoryModel.findOrCreate({
      where: { name: name.trim() }, defaults: { name: name.trim() } as LibraryCategory, transaction,
    });
    return category;
  }

  async categoryItems(name: string, categoryId?: string) {
    if (categoryId) {
      const category = await this.categoryModel.findByPk(categoryId);
      if (!category) throw new NotFoundException('Library category not found');
      name = category.name;
    }
    const category = await this.resolveCategory(name);
    const items = await this.itemModel.findAll({
      where: { is_active: true, [Op.or]: [{ category_id: category.id }, { category_name: category.name }] },
      order: [['created_at', 'ASC']],
    });
    return { category, items };
  }

  // Update reusable defaults only. Existing BOQs retain their own snapshots and quantities.
  async saveBoqItem(item: BoqItem, categoryName: string, transaction: Transaction) {
    if (!item.name?.trim()) return;
    const category = await this.resolveCategory(categoryName, transaction);
    let library = item.library_item_id
      ? await this.itemModel.findByPk(item.library_item_id, { transaction }) : null;
    // Moving a project row to another category must not move the original library entry.
    if (library && library.category_name !== category.name) library = null;
    if (!library) library = await this.itemModel.findOne({
      where: { name: item.name.trim(), category_name: category.name }, transaction,
    });
    const values = { name: item.name.trim(), category_id: category.id, category_name: category.name,
      unit_id: item.unit_id, unit: item.unit, default_rate: Number(item.rate), notes: item.notes };
    if (library) await library.update(values, { transaction });
    else library = await this.itemModel.create(values as LibraryItem, { transaction });
    await item.update({ library_item_id: library.id }, { transaction });
  }

  async findCategories() {
    return this.categoryModel.findAll({
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async createCategory(dto: CreateLibraryCategoryDto) {
    return this.categoryModel.create(dto as LibraryCategory);
  }

  async findItems(query: QueryLibraryItemsDto) {
    const where: WhereOptions<LibraryItem> = {};

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.q) {
      where.name = {
        [Op.like]: `%${query.q}%`,
      };
    }

    return this.itemModel.findAll({
      where,
      include: [{ model: LibraryCategory, as: 'category' }],
      order: [['name', 'ASC']],
    });
  }

  async findOneItem(id: string) {
    const item = await this.itemModel.findByPk(id, {
      include: [{ model: LibraryCategory, as: 'category' }],
    });
    if (!item) throw new NotFoundException('Library item not found');
    return item;
  }

  async createItem(dto: CreateLibraryItemDto, actorId?: string) {
    let category_name = dto.category_name ?? null;
    if (dto.category_id) {
      const category = await this.categoryModel.findByPk(dto.category_id);
      category_name = category?.name ?? category_name;
    }

    const category = category_name ? await this.resolveCategory(category_name) : null;
    const item = await this.itemModel.create({
      name: dto.name.trim(),
      category_id: dto.category_id ?? category?.id ?? null,
      category_name,
      unit_id: dto.unit_id ?? null,
      unit: dto.unit ?? null,
      default_rate: dto.default_rate ?? 0,
      notes: dto.notes ?? null,
    } as LibraryItem);

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.CREATED,
      target: `Library item · ${item.name}`,
    });

    return item;
  }

  async updateItem(id: string, dto: UpdateLibraryItemDto, actorId?: string) {
    const item = await this.findOneItem(id);

    let category_name = dto.category_name ?? item.category_name;
    if (dto.category_id) {
      const category = await this.categoryModel.findByPk(dto.category_id);
      category_name = category?.name ?? category_name;
    }

    const rateChanged =
      dto.default_rate !== undefined &&
      Number(dto.default_rate) !== Number(item.default_rate);

    await item.update({
      ...dto,
      category_name,
    });

    await this.activity.log({
      user_id: actorId,
      action: rateChanged
        ? BoqActivityAction.RATE_CHANGED
        : BoqActivityAction.UPDATED,
      target: `Library item · ${item.name}`,
      details: rateChanged
        ? `Default rate updated to ${dto.default_rate}`
        : undefined,
    });

    return item;
  }

  /**
   * Deletes a library item. Because BoqItem/BoqTemplateItem store a
   * snapshot of name/unit/rate rather than a live reference, existing
   * BOQ line items are left completely intact — we just report how many
   * of them pointed at this library item, matching the toast copy in
   * BoqLibraryPage.jsx ("was used in N BOQ line item(s) — snapshots
   * preserved").
   */
  async removeItem(id: string, actorId?: string) {
    const item = await this.findOneItem(id);
    const referenced_by = await this.boqItemModel.count({
      where: { library_item_id: id },
    });

    await item.destroy();

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.DELETED,
      target: `Library item · ${item.name}`,
      details: referenced_by
        ? `Removed from library; ${referenced_by} existing BOQ line item(s) kept their snapshot`
        : undefined,
    });

    return { id, deleted: true, referenced_by };
  }
}
