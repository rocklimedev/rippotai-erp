import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChecklistTemplate } from './models/checklist-template.model';
import { ChecklistTemplateItem } from './models/checklist-template-item.model';
import { CreateChecklistTemplateDto, AddChecklistItemDto } from './dto/qc.dto';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(ChecklistTemplate) private templateModel: typeof ChecklistTemplate,
    @InjectModel(ChecklistTemplateItem) private itemModel: typeof ChecklistTemplateItem,
  ) {}

  async createTemplate(dto: CreateChecklistTemplateDto): Promise<ChecklistTemplate> {
    const template = await this.templateModel.create({
      name: dto.name,
      tradeTeamId: dto.tradeTeamId,
      stepId: dto.stepId ?? null,
      description: dto.description ?? null,
    } as any);

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.itemModel.create({ ...item, templateId: template.id } as any);
      }
    }
    return this.getTemplateOrThrow(template.id);
  }

  async addItem(dto: AddChecklistItemDto): Promise<ChecklistTemplateItem> {
    await this.getTemplateOrThrow(dto.templateId);
    return this.itemModel.create({ ...dto } as any);
  }

  async getTemplateOrThrow(id: number): Promise<ChecklistTemplate> {
    const template = await this.templateModel.findByPk(id, {
      include: [{ model: this.itemModel, separate: true, order: [['order', 'ASC']] }],
    });
    if (!template) throw new NotFoundException(`Checklist template ${id} not found`);
    return template;
  }

  /** Reusable checklists for a trade, optionally scoped to a step (phase). */
  async listTemplates(tradeTeamId?: number, stepId?: number): Promise<ChecklistTemplate[]> {
    const where: any = { isActive: true };
    if (tradeTeamId) where.tradeTeamId = tradeTeamId;
    if (stepId) where.stepId = stepId;
    return this.templateModel.findAll({
      where,
      include: [{ model: this.itemModel, separate: true, order: [['order', 'ASC']] }],
    });
  }
}
