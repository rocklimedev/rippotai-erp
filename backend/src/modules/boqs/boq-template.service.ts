import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { literal } from 'sequelize';
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

@Injectable()
export class BoqTemplateService {
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

  /**
   * Shapes rows to exactly what BoqTemplatesList.jsx renders:
   * name, template_tier, category_count, item_count, total_value,
   * created_by, updated_at.
   */
  async findAll() {
    const templates = await this.templateModel.findAll({
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*) FROM boq_template_categories btc
              WHERE btc.template_id = BoqTemplate.id
            )`),
            'category_count',
          ],
          [
            literal(`(
              SELECT COUNT(*) FROM boq_template_items bti
              INNER JOIN boq_template_categories btc ON btc.id = bti.template_category_id
              WHERE btc.template_id = BoqTemplate.id
            )`),
            'item_count',
          ],
          [
            literal(`(
              SELECT COALESCE(SUM(bti.quantity * bti.rate), 0)
              FROM boq_template_items bti
              INNER JOIN boq_template_categories btc ON btc.id = bti.template_category_id
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

  async findOne(id: string) {
    const template = await this.templateModel.findByPk(id, {
      include: [
        {
          model: BoqTemplateCategory,
          include: [BoqTemplateItem],
        },
      ],
      order: [
        [{ model: BoqTemplateCategory, as: 'categories' }, 'sort_order', 'ASC'],
      ],
    });
    if (!template) throw new NotFoundException('BOQ template not found');
    return template;
  }

  async create(dto: CreateTemplateDto, actorId?: string) {
    return this.sequelize.transaction(async (t) => {
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
              template_category_id: cat.id,
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

      return template;
    });
  }

  async update(id: string, dto: UpdateTemplateDto, actorId?: string) {
    const template = await this.findOne(id);
    await template.update({ ...dto, updated_by: actorId ?? null });

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.UPDATED,
      target: `Template · ${template.name}`,
    });

    return template;
  }

  async remove(id: string, actorId?: string) {
    const template = await this.findOne(id);
    await template.destroy();

    await this.activity.log({
      user_id: actorId,
      action: BoqActivityAction.DELETED,
      target: `Template · ${template.name}`,
    });

    return { id, deleted: true };
  }
}
