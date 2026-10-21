// boq-template.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { literal, Transaction } from 'sequelize';
import { BoqTemplate } from './models/boq-template.model';
import { BoqTemplateCategory } from './models/boq-template-category.model';
import { BoqTemplateItem } from './models/boq-template-item.model';
import { User } from '@/modules/users/models/user.model';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/create-boq-template.dto';
import { BoqActivityService } from './boq-activity.service';
import { BoqActivityAction } from '@/common/enums/boq-enums';

/** Fields a client may set on a template item. Anything else (e.g. boq_category_id, id) is ignored. */
const ITEM_EDITABLE_FIELDS = [
  'library_item_id',
  'name',
  'unit_id',
  'unit',
  'quantity',
  'rate',
  'notes',
] as const;

type ItemEditableField = (typeof ITEM_EDITABLE_FIELDS)[number];

function pickItemFields(
  body: Partial<BoqTemplateItem>,
): Partial<Pick<BoqTemplateItem, ItemEditableField>> {
  const out: Partial<Pick<BoqTemplateItem, ItemEditableField>> = {};
  for (const key of ITEM_EDITABLE_FIELDS) {
    if (body[key] !== undefined) {
      // Object.assign avoids TypeScript's "union key is never" error on out[key] = ...
      Object.assign(out, { [key]: body[key] });
    }
  }
  return out;
}

@Injectable()
export class BoqTemplateService {
  private readonly logger = new Logger(BoqTemplateService.name);

  constructor(
    @InjectModel(BoqTemplate)
    private readonly templateModel: typeof BoqTemplate,

    @InjectModel(BoqTemplateCategory)
    private readonly categoryModel: typeof BoqTemplateCategory,

    @InjectModel(BoqTemplateItem)
    private readonly itemModel: typeof BoqTemplateItem,

    private readonly sequelize: Sequelize,

    private readonly activity: BoqActivityService,
  ) {}

  async findAll() {
    const templates = await this.templateModel.findAll({
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM boq_template_categories btc
              WHERE btc.template_id = BoqTemplate.id
            )`),
            'category_count',
          ],
          [
            literal(`(
              SELECT COUNT(*)
              FROM boq_template_items bti
              INNER JOIN boq_template_categories btc
                ON btc.id = bti.boq_category_id
              WHERE btc.template_id = BoqTemplate.id
            )`),
            'item_count',
          ],
          [
            literal(`(
              SELECT COALESCE(SUM(bti.quantity * bti.rate), 0)
              FROM boq_template_items bti
              INNER JOIN boq_template_categories btc
                ON btc.id = bti.boq_category_id
              WHERE btc.template_id = BoqTemplate.id
            )`),
            'total_value',
          ],
        ],
      },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      template_tier: t.template_tier,
      created_by: t.creator?.name ?? null,
      category_count: Number(t.getDataValue('category_count')),
      item_count: Number(t.getDataValue('item_count')),
      total_value: Number(t.getDataValue('total_value')),
      updated_at: t.get('updated_at'),
    }));
  }

  /** Editor view: categories and items, ordered, with a computed subtotal per category. */
  async findOne(id: string, transaction?: Transaction) {
    const template = await this.templateModel.findByPk(id, {
      transaction,
      include: [
        {
          model: BoqTemplateCategory,
          include: [BoqTemplateItem],
        },
      ],
      order: [
        [{ model: BoqTemplateCategory, as: 'categories' }, 'sort_order', 'ASC'],
        [
          { model: BoqTemplateCategory, as: 'categories' },
          { model: BoqTemplateItem, as: 'items' },
          'sort_order',
          'ASC',
        ],
      ],
    });

    if (!template) {
      throw new NotFoundException('BOQ template not found');
    }

    const plain = template.get({ plain: true }) as any;

    plain.categories = (plain.categories ?? []).map((c: any) => ({
      ...c,
      subtotal: (c.items ?? []).reduce(
        (sum: number, i: any) => sum + Number(i.quantity) * Number(i.rate),
        0,
      ),
    }));

    plain.total_value = plain.categories.reduce(
      (sum: number, c: any) => sum + c.subtotal,
      0,
    );

    return plain;
  }

  async create(dto: CreateTemplateDto, actorId?: string) {
    try {
      return await this.sequelize.transaction(async (t) => {
        const template = await this.templateModel.create(
          {
            name: dto.name,
            template_tier: dto.template_tier ?? null,
            description: dto.description ?? null,
            created_by: actorId ?? null,
          } as BoqTemplate,
          { transaction: t },
        );

        for (const [ci, category] of (dto.categories ?? []).entries()) {
          const cat = await this.categoryModel.create(
            {
              template_id: template.id,
              name: category.name,
              sort_order: ci,
            } as BoqTemplateCategory,
            { transaction: t },
          );

          for (const [ii, item] of (category.items ?? []).entries()) {
            await this.itemModel.create(
              {
                boq_category_id: cat.id,
                library_item_id: item.library_item_id ?? null,
                name: item.name,
                unit_id: item.unit_id ?? null,
                unit: item.unit ?? null,
                quantity: item.quantity ?? 0,
                rate: item.rate ?? 0,
                notes: item.notes ?? null,
                sort_order: ii,
              } as BoqTemplateItem,
              { transaction: t },
            );
          }
        }

        await this.activity.log({
          user_id: actorId,
          action: BoqActivityAction.CREATED,
          target: `Template · ${template.name}`,
        });

        this.logger.log(`Created BOQ template ${template.id}`);

        return await this.findOne(template.id, t);
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create BOQ template (actor ${actorId ?? 'unknown'})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /** Top-level fields only (name, tier, description). Categories and items use the methods below. */
  async update(id: string, dto: UpdateTemplateDto, actorId?: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('BOQ template not found');

    await template.update({ ...dto, updated_by: actorId ?? null });

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.UPDATED,
      target: `Template · ${template.name}`,
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId?: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('BOQ template not found');
    await template.destroy();

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.DELETED,
      target: `Template · ${template.name}`,
    });

    return { id, deleted: true };
  }

  // ==========================
  // Categories
  // ==========================

  async addCategory(templateId: string, name: string) {
    await this.assertTemplateExists(templateId);

    const maxOrder = Number(
      (await this.categoryModel.max('sort_order', {
        where: { template_id: templateId },
      })) ?? -1,
    );

    await this.categoryModel.create({
      template_id: templateId,
      name,
      sort_order: maxOrder + 1,
    } as BoqTemplateCategory);

    return this.findOne(templateId);
  }

  async deleteCategory(templateId: string, categoryId: string) {
    const cat = await this.categoryModel.findOne({
      where: { id: categoryId, template_id: templateId },
    });
    if (!cat) throw new NotFoundException('Template category not found');
    await cat.destroy();
    return this.findOne(templateId);
  }

  // ==========================
  // Items
  // ==========================

  async addItem(
    templateId: string,
    categoryId: string,
    body: Partial<BoqTemplateItem>,
  ) {
    if (!body.name) {
      throw new BadRequestException('Item name is required');
    }

    const cat = await this.categoryModel.findOne({
      where: { id: categoryId, template_id: templateId },
    });
    if (!cat) throw new NotFoundException('Template category not found');

    const maxOrder = Number(
      (await this.itemModel.max('sort_order', {
        where: { boq_category_id: categoryId },
      })) ?? -1,
    );

    await this.itemModel.create({
      boq_category_id: categoryId,
      library_item_id: body.library_item_id ?? null,
      name: body.name,
      unit_id: body.unit_id ?? null,
      unit: body.unit ?? null,
      quantity: body.quantity ?? 0,
      rate: body.rate ?? 0,
      notes: body.notes ?? null,
      sort_order: maxOrder + 1,
    } as BoqTemplateItem);

    return this.findOne(templateId);
  }

  async updateItem(
    templateId: string,
    itemId: string,
    body: Partial<BoqTemplateItem>,
  ) {
    const item = await this.itemModel.findByPk(itemId, {
      include: [
        { model: BoqTemplateCategory, where: { template_id: templateId } },
      ],
    });
    if (!item) throw new NotFoundException('Template item not found');

    await item.update(pickItemFields(body));
    return this.findOne(templateId);
  }

  async deleteItem(templateId: string, itemId: string) {
    const item = await this.itemModel.findByPk(itemId, {
      include: [
        { model: BoqTemplateCategory, where: { template_id: templateId } },
      ],
    });
    if (!item) throw new NotFoundException('Template item not found');
    await item.destroy();
    return this.findOne(templateId);
  }

  async reorderItems(
    templateId: string,
    categoryId: string,
    orderedIds: string[],
  ) {
    const cat = await this.categoryModel.findOne({
      where: { id: categoryId, template_id: templateId },
      attributes: ['id'],
    });
    if (!cat) throw new NotFoundException('Template category not found');

    await this.sequelize.transaction(async (t) => {
      for (const [idx, itemId] of orderedIds.entries()) {
        await this.itemModel.update(
          { sort_order: idx },
          {
            where: { id: itemId, boq_category_id: categoryId },
            transaction: t,
          },
        );
      }
    });

    return this.findOne(templateId);
  }

  private async assertTemplateExists(id: string) {
    const exists = await this.templateModel.findByPk(id, {
      attributes: ['id'],
    });
    if (!exists) throw new NotFoundException('BOQ template not found');
  }
}
