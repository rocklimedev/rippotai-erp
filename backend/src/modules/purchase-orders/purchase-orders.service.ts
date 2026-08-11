import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID } from 'crypto';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './models/purchase-order.model';

import { PurchaseOrderItem } from './models/purchase-order-item.model';

import {
  CreatePurchaseOrderDto,
  IssuePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder)
    private readonly model: typeof PurchaseOrder,

    @InjectModel(PurchaseOrderItem)
    private readonly itemModel: typeof PurchaseOrderItem,

    private readonly sequelize: Sequelize,
  ) {}

  findAll(projectId?: string, vendorId?: string) {
    const where: Record<string, string> = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    return this.model.findAll({
      where,
      include: [PurchaseOrderItem],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id, {
      include: [PurchaseOrderItem],
    });

    if (!record) {
      throw new NotFoundException(`PurchaseOrder ${id} not found`);
    }

    return record;
  }

  async create(dto: CreatePurchaseOrderDto) {
    return this.sequelize.transaction(async (transaction) => {
      const items = dto.items.map((item) => ({
        id: randomUUID(),
        materialName: item.material_name,
        unitId: item.unit_id ?? null,
        quantity: item.quantity,
        rate: item.rate,
        amount: Number(item.quantity) * Number(item.rate),
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      const po = await this.model.create(
        {
          id: randomUUID(),
          poNumber: dto.po_number,
          projectId: dto.project_id,
          vendorId: dto.vendor_id,
          estimateId: dto.estimate_id ?? null,
          status: dto.status ?? PurchaseOrderStatus.DRAFT,
          expectedDeliveryDate: dto.expected_delivery_date ?? null,
          totalAmount,
        },
        { transaction },
      );

      await this.itemModel.bulkCreate(
        items.map((item) => ({
          ...item,
          purchaseOrderId: po.id,
        })),
        { transaction },
      );

      return this.model.findByPk(po.id, {
        include: [PurchaseOrderItem],
        transaction,
      });
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const record = await this.findOne(id);

    const { items, ...rest } = dto;

    await record.update({
      ...(rest.po_number !== undefined && {
        poNumber: rest.po_number,
      }),

      ...(rest.project_id !== undefined && {
        projectId: rest.project_id,
      }),

      ...(rest.vendor_id !== undefined && {
        vendorId: rest.vendor_id,
      }),

      ...(rest.estimate_id !== undefined && {
        estimateId: rest.estimate_id,
      }),

      ...(rest.status !== undefined && {
        status: rest.status,
      }),

      ...(rest.expected_delivery_date !== undefined && {
        expectedDeliveryDate: rest.expected_delivery_date,
      }),
    });

    return this.findOne(id);
  }

  async issue(id: string, dto: IssuePurchaseOrderDto) {
    const record = await this.findOne(id);

    if (record.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be issued');
    }

    return record.update({
      status: PurchaseOrderStatus.ISSUED,
      issuedBy: dto.issued_by,
      issuedAt: new Date(),
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
