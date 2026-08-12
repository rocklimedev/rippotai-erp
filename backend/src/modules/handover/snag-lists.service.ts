import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SnagList } from './models/snag-list.model';
import { SnagItem } from './models/snag-item.model';
import { CreateSnagListDto } from './dto/create-snag-list.dto';
import { UpdateSnagListDto } from './dto/update-snag-list.dto';

@Injectable()
export class SnagListsService {
  constructor(
    @InjectModel(SnagList)
    private readonly snagListModel: typeof SnagList,
  ) {}

  async create(dto: CreateSnagListDto): Promise<SnagList> {
    return this.snagListModel.create({ ...dto } as any);
  }

  async findAll(projectId?: string): Promise<SnagList[]> {
    return this.snagListModel.findAll({
      where: projectId ? { projectId } : undefined,
      include: [{ model: SnagItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<SnagList> {
    const snagList = await this.snagListModel.findByPk(id, {
      include: [{ model: SnagItem, as: 'items' }],
    });
    if (!snagList) {
      throw new NotFoundException(`Snag list ${id} not found`);
    }
    return snagList;
  }

  async update(id: string, dto: UpdateSnagListDto): Promise<SnagList> {
    const snagList = await this.findOne(id);
    return snagList.update({ ...dto });
  }

  async remove(id: string): Promise<void> {
    const snagList = await this.findOne(id);
    await snagList.destroy();
  }
}
