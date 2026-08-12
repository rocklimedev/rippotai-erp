import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QcChecklistItem } from './models/qc-checklist-item.model';
import { CreateQcChecklistItemDto } from './dto/create-qc-checklist-item.dto';
import { UpdateQcChecklistItemDto } from './dto/update-qc-checklist-item.dto';

@Injectable()
export class QcChecklistItemsService {
  constructor(
    @InjectModel(QcChecklistItem)
    private readonly itemModel: typeof QcChecklistItem,
  ) {}

  async create(dto: CreateQcChecklistItemDto): Promise<QcChecklistItem> {
    return this.itemModel.create({ ...dto } as any);
  }

  async findAll(checklistId?: string): Promise<QcChecklistItem[]> {
    return this.itemModel.findAll({
      where: checklistId ? { checklistId } : undefined,
      order: [['sortOrder', 'ASC']],
    });
  }

  async findOne(id: string): Promise<QcChecklistItem> {
    const item = await this.itemModel.findByPk(id);
    if (!item) {
      throw new NotFoundException(`QC checklist item ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    dto: UpdateQcChecklistItemDto,
  ): Promise<QcChecklistItem> {
    const item = await this.findOne(id);
    return item.update({ ...dto });
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await item.destroy();
  }
}
