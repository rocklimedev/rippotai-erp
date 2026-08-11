import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Sequelize } from 'sequelize-typescript';

import { randomUUID } from 'crypto';

import { DeliveryChallan } from './models/delivery-challan.model';
import { DeliveryChallanItem } from './models/delivery-challan-item.model';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './models/purchase-order.model';

import { PurchaseOrderItem } from './models/purchase-order-item.model';

import { CreateDeliveryChallanDto } from './dto/delivery-challan.dto';

@Injectable()
export class DeliveryChallansService {
  constructor(
    @InjectModel(DeliveryChallan)
    private readonly model: typeof DeliveryChallan,

    @InjectModel(DeliveryChallanItem)
    private readonly itemModel: typeof DeliveryChallanItem,

    @InjectModel(PurchaseOrderItem)
    private readonly poItemModel: typeof PurchaseOrderItem,

    @InjectModel(PurchaseOrder)
    private readonly poModel: typeof PurchaseOrder,

    private readonly sequelize: Sequelize,
  ) {}

  findAll(purchaseOrderId?: string, projectId?: string) {
    const where: Record<string, string> = {};

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    return this.model.findAll({
      where,
      include: [DeliveryChallanItem],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id, {
      include: [DeliveryChallanItem],
    });

    if (!record) {
      throw new NotFoundException(`DeliveryChallan ${id} not found`);
    }

    return record;
  }

  async create(dto: CreateDeliveryChallanDto) {
    return this.sequelize.transaction(async (transaction) => {
      const challan = await this.model.create(
        {
          id: randomUUID(),
          challanNumber: dto.challan_number,
          purchaseOrderId: dto.purchase_order_id,
          projectId: dto.project_id,
          deliveredAt: dto.delivered_at
            ? new Date(dto.delivered_at)
            : new Date(),
          receivedBy: dto.received_by,
          siteStage: dto.site_stage,
          remarks: dto.remarks ?? null,
        },
        { transaction },
      );

      await this.itemModel.bulkCreate(
        dto.items.map((item) => ({
          id: randomUUID(),

          deliveryChallanId: challan.id,

          purchaseOrderItemId: item.purchase_order_item_id ?? null,

          materialName: item.material_name,

          quantityDelivered: item.quantity_delivered,

          conditionNotes: item.condition_notes ?? null,
        })),
        { transaction },
      );

      // Update delivered quantity on linked PO items.
      for (const item of dto.items) {
        if (item.purchase_order_item_id) {
          await this.poItemModel.increment('deliveredQuantity', {
            by: Number(item.quantity_delivered),

            where: {
              id: item.purchase_order_item_id,
            },

            transaction,
          });
        }
      }

      // Get all PO items to calculate the current delivery status.
      const poItems = await this.poItemModel.findAll({
        where: {
          purchaseOrderId: dto.purchase_order_id,
        },
        transaction,
      });

      const fullyDelivered =
        poItems.length > 0 &&
        poItems.every(
          (item) => Number(item.deliveredQuantity) >= Number(item.quantity),
        );

      const partiallyDelivered = poItems.some(
        (item) => Number(item.deliveredQuantity) > 0,
      );

      let status: PurchaseOrderStatus;

      if (fullyDelivered) {
        status = PurchaseOrderStatus.DELIVERED;
      } else if (partiallyDelivered) {
        status = PurchaseOrderStatus.PARTIALLY_DELIVERED;
      } else {
        status = PurchaseOrderStatus.ISSUED;
      }

      await this.poModel.update(
        {
          status,
        },
        {
          where: {
            id: dto.purchase_order_id,
          },
          transaction,
        },
      );

      return this.model.findByPk(challan.id, {
        include: [DeliveryChallanItem],
        transaction,
      });
    });
  }

  async remove(id: string) {
    const record = await this.findOne(id);

    await record.destroy();

    return {
      deleted: true,
    };
  }
}
