import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuid } from 'uuid';
import { Op } from 'sequelize';

import { InventoryRequest } from '../models/inventory-request.model';
import { CreateInventoryRequestDto } from '../dto/create-inventory-request.dto';
import { UpdateInventoryRequestDto } from '../dto/update-inventory-request.dto';

@Injectable()
export class InventoryRequestService {
  constructor(
    @InjectModel(InventoryRequest)
    private requestModel: typeof InventoryRequest,
  ) {}

  async createRequest(dto: CreateInventoryRequestDto) {
    return this.requestModel.create({
      id: uuid(),
      project_id: dto.project_id,
      project_material_id: dto.project_material_id,
      quantity_required: dto.quantity_required,
      required_date: dto.required_date ?? null,
      vendor_id: dto.vendor_id ?? null,
      source_type: dto.source_type,
      requested_by: dto.requested_by ?? null,
    });
  }

  async findAllRequests() {
    return this.requestModel.findAll({
      include: [
        {
          association: 'project',
          include: [
            { association: 'client' },
            { association: 'site' },
            { association: 'creator' },
            { association: 'assignedUser' },
          ],
        },
        { association: 'vendor' },
        { association: 'requester' },
        { association: 'approver' },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getRequestsByProject(projectId: string) {
    return this.requestModel.findAll({
      where: { project_id: projectId },
      include: [
        {
          association: 'project',
          include: [
            { association: 'client' },
            { association: 'site' },
            { association: 'creator' },
            { association: 'assignedUser' },
          ],
        },
        { association: 'vendor' },
        { association: 'requester' },
        { association: 'approver' },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findRequestById(id: string) {
    const request = await this.requestModel.findByPk(id, {
      include: { all: true, nested: true },
    });

    if (!request) throw new NotFoundException('Inventory request not found');
    return request;
  }

  async updateRequest(id: string, dto: UpdateInventoryRequestDto) {
    const request = await this.findRequestById(id);
    return request.update(dto);
  }

  async deleteRequest(id: string) {
    const request = await this.findRequestById(id);
    await request.destroy();
    return { message: 'Request deleted successfully' };
  }

  async findRequestsByProject(projectId: string) {
    return this.requestModel.findAll({
      where: { project_id: projectId },
      include: [{ all: true, nested: true }],
      order: [['created_at', 'DESC']],
    });
  }

  async getPendingRequests() {
    return this.requestModel.findAll({
      where: {
        status: {
          [Op.in]: ['draft', 'submitted', 'approved'],
        },
      },
      include: [{ all: true, nested: true }],
    });
  }

  async countByProject(projectId: string) {
    return this.requestModel.count({ where: { project_id: projectId } });
  }

  async countTotal() {
    return this.requestModel.count();
  }
}
