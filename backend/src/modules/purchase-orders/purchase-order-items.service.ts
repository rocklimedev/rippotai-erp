import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';

import { PurchaseOrderItem } from './models/purchase-order-item.model';

import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from './dto/purchase-order-item.dto';

@Injectable()
export class PurchaseOrderItemsService {
  constructor(
    @InjectModel(PurchaseOrderItem)
    private readonly model: typeof PurchaseOrderItem,
  ) {}

  findAll(purchaseOrderId: string) {
    return this.model.findAll({
      where: {
        purchaseOrderId,
      },
    });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id);

    if (!record) {
      throw new NotFoundException(`PurchaseOrderItem ${id} not found`);
    }

    return record;
  }

  create(dto: CreatePurchaseOrderItemDto) {
    return this.model.create({
      id: randomUUID(),
      purchaseOrderId: dto.purchase_order_id,
      materialName: dto.material_name,
      unitId: dto.unit_id ?? null,
      quantity: dto.quantity,
      rate: dto.rate,
      amount: Number(dto.quantity) * Number(dto.rate),
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderItemDto) {
    const record = await this.findOne(id);

    const quantity =
      dto.quantity !== undefined ? dto.quantity : record.quantity;

    const rate = dto.rate !== undefined ? dto.rate : record.rate;

    await record.update({
      ...(dto.purchase_order_id !== undefined && {
        purchaseOrderId: dto.purchase_order_id,
      }),

      ...(dto.material_name !== undefined && {
        materialName: dto.material_name,
      }),

      ...(dto.unit_id !== undefined && {
        unitId: dto.unit_id,
      }),

      ...(dto.quantity !== undefined && {
        quantity: dto.quantity,
      }),

      ...(dto.rate !== undefined && {
        rate: dto.rate,
      }),

      amount: Number(quantity) * Number(rate),
    });

    return record;
  }

  async remove(id: string) {
    const record = await this.findOne(id);

    await record.destroy();

    return {
      deleted: true,
    };
  }
}
