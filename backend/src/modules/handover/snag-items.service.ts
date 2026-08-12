import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SnagItem, SnagItemStatus } from './models/snag-item.model';
import { CreateSnagItemDto } from './dto/create-snag-item.dto';
import { UpdateSnagItemDto } from './dto/update-snag-item.dto';

@Injectable()
export class SnagItemsService {
  constructor(
    @InjectModel(SnagItem)
    private readonly snagItemModel: typeof SnagItem,
  ) {}

  async create(dto: CreateSnagItemDto): Promise<SnagItem> {
    return this.snagItemModel.create({ ...dto } as any);
  }

  async findAll(
    snagListId?: string,
    status?: SnagItemStatus,
  ): Promise<SnagItem[]> {
    const where: Record<string, unknown> = {};
    if (snagListId) where.snagListId = snagListId;
    if (status) where.status = status;
    return this.snagItemModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<SnagItem> {
    const snagItem = await this.snagItemModel.findByPk(id);
    if (!snagItem) {
      throw new NotFoundException(`Snag item ${id} not found`);
    }
    return snagItem;
  }

  async update(id: string, dto: UpdateSnagItemDto): Promise<SnagItem> {
    const snagItem = await this.findOne(id);
    return snagItem.update({ ...dto });
  }

  /** Marks the item rectified (trade team fixed it) without closing it out. */
  async markRectified(id: string): Promise<SnagItem> {
    const snagItem = await this.findOne(id);
    return snagItem.update({
      status: SnagItemStatus.RECTIFIED,
      resolvedAt: new Date(),
    });
  }

  /** Supervisor/QC verifies the fix on-site — final state. */
  async verify(id: string): Promise<SnagItem> {
    const snagItem = await this.findOne(id);
    return snagItem.update({ status: SnagItemStatus.VERIFIED });
  }

  async remove(id: string): Promise<void> {
    const snagItem = await this.findOne(id);
    await snagItem.destroy();
  }
}
