import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuid } from 'uuid';

import { InventoryDispatch } from '../models/inventory-dispatch.model';
import { CreateInventoryDispatchDto } from '../dto/create-inventory-dispatch.dto';
import { UpdateInventoryDispatchDto } from '../dto/update-inventory-dispatch.dto';

@Injectable()
export class InventoryDispatchService {
  constructor(
    @InjectModel(InventoryDispatch)
    private dispatchModel: typeof InventoryDispatch,
  ) {}

  async createDispatch(dto: CreateInventoryDispatchDto) {
    return this.dispatchModel.create({
      id: uuid(),
      ...dto,
    });
  }

  async findAllDispatches() {
    return this.dispatchModel.findAll({
      include: [
        {
          association: 'request',
          include: [
            {
              association: 'project',
              include: [
                { association: 'client' },
                { association: 'site' },
                { association: 'creator' },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findDispatchById(id: string) {
    const dispatch = await this.dispatchModel.findByPk(id, {
      include: [{ all: true, nested: true }],
    });

    if (!dispatch) throw new NotFoundException('Dispatch record not found');
    return dispatch;
  }

  async updateDispatch(id: string, dto: UpdateInventoryDispatchDto) {
    const dispatch = await this.findDispatchById(id);
    return dispatch.update(dto);
  }

  async deleteDispatch(id: string) {
    const dispatch = await this.findDispatchById(id);
    await dispatch.destroy();
    return { message: 'Dispatch deleted successfully' };
  }

  async findDispatchesByProject(projectId: string) {
    return this.dispatchModel.findAll({
      where: { project_id: projectId },
      include: [{ all: true, nested: true }],
      order: [['created_at', 'DESC']],
    });
  }

  async countByProject(projectId: string) {
    return this.dispatchModel.count({ where: { project_id: projectId } });
  }

  async countTotal() {
    return this.dispatchModel.count();
  }
}
