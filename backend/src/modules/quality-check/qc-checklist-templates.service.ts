import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QcChecklistTemplate } from './models/qc-checklist-template.model';
import { QcChecklistItem } from './models/qc-checklist-item.model';
import { CreateQcChecklistTemplateDto } from './dto/create-qc-checklist-template.dto';
import { UpdateQcChecklistTemplateDto } from './dto/update-qc-checklist-template.dto';

@Injectable()
export class QcChecklistTemplatesService {
  constructor(
    @InjectModel(QcChecklistTemplate)
    private readonly templateModel: typeof QcChecklistTemplate,
  ) {}

  async create(
    dto: CreateQcChecklistTemplateDto,
  ): Promise<QcChecklistTemplate> {
    return this.templateModel.create({ ...dto } as any);
  }

  async findAll(tradeTeamId?: string): Promise<QcChecklistTemplate[]> {
    return this.templateModel.findAll({
      where: tradeTeamId ? { tradeTeamId } : undefined,
      include: [{ model: QcChecklistItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<QcChecklistTemplate> {
    const template = await this.templateModel.findByPk(id, {
      include: [{ model: QcChecklistItem, as: 'items' }],
    });
    if (!template) {
      throw new NotFoundException(`QC checklist template ${id} not found`);
    }
    return template;
  }

  async update(
    id: string,
    dto: UpdateQcChecklistTemplateDto,
  ): Promise<QcChecklistTemplate> {
    const template = await this.findOne(id);
    return template.update({ ...dto });
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await template.destroy();
  }
}
