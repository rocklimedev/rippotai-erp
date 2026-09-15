import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { PurchaseOrderItem } from '../models/purchase-order-item.model';
import { MaterialMaster } from '../models/material-master.model';

import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '../dto/purchase-order.dto';
import {
  PurchaseOrder,
  PurchaseOrderSourceType,
  PurchaseOrderStatus,
} from '../models/purchase-order.model';
@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrder)
    private readonly purchaseOrderModel: typeof PurchaseOrder,

    @InjectModel(PurchaseOrderItem)
    private readonly purchaseOrderItemModel: typeof PurchaseOrderItem,

    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,
  ) {}

  private calculateTotals(
    items: CreatePurchaseOrderDto['items'],
    discount = 0,
    gstPercent = 0,
    cartage = 0,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.ordered_quantity) * Number(item.rate),
      0,
    );

    const taxableAmount = Math.max(subtotal - Number(discount || 0), 0);

    const gstAmount = taxableAmount * (Number(gstPercent || 0) / 100);

    const totalAmount = taxableAmount + gstAmount + Number(cartage || 0);

    return {
      subtotal,
      discount: Number(discount || 0),
      gst_percent: Number(gstPercent || 0),
      gst_amount: gstAmount,
      cartage: Number(cartage || 0),
      total_amount: totalAmount,
    };
  }

  async create(dto: CreatePurchaseOrderDto, userId?: string) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'Purchase order must contain at least one item',
      );
    }

    for (const item of dto.items) {
      const material = await this.materialModel.findByPk(item.material_id);

      if (!material) {
        throw new NotFoundException(`Material ${item.material_id} not found`);
      }

      if (!material.is_active) {
        throw new BadRequestException(`Material ${material.name} is inactive`);
      }
    }

    const poNumber = await this.generatePoNumber();

    const totals = this.calculateTotals(
      dto.items,
      dto.discount,
      dto.gst_percent,
      dto.cartage,
    );

    const po = await this.purchaseOrderModel.create({
      po_number: poNumber,

      project_id: dto.project_id,
      site_id: dto.site_id ?? null,
      vendor_id: dto.vendor_id ?? null,

      po_date: dto.po_date,
      target_delivery_date: dto.target_delivery_date ?? null,

      agency_name: dto.agency_name ?? null,
      contact_person: dto.contact_person ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,

      vendor_gstin: dto.vendor_gstin ?? null,
      vendor_pan: dto.vendor_pan ?? null,

      ship_to_address: dto.ship_to_address ?? null,

      source_type: dto.source_type ?? PurchaseOrderSourceType.MANUAL,
      source_reference_id: dto.source_reference_id ?? null,

      notes: dto.notes ?? null,

      terms_and_conditions: dto.terms_and_conditions ?? null,

      ...totals,

      created_by: userId ?? null,
    });

    const itemRows = dto.items.map((item, index) => ({
      purchase_order_id: po.id,
      material_id: item.material_id,

      line_number: index + 1,

      description: item.description ?? `Material ${item.material_id}`,

      specification: item.specification ?? null,

      brand: item.brand ?? null,

      unit: item.unit ?? 'Nos',

      ordered_quantity: item.ordered_quantity,

      rate: item.rate,

      amount: Number(item.ordered_quantity) * Number(item.rate),

      received_quantity: 0,

      pending_quantity: item.ordered_quantity,

      remarks: item.remarks ?? null,

      source_reference_id: item.source_reference_id ?? null,
    }));

    await this.purchaseOrderItemModel.bulkCreate(itemRows);

    return this.findOne(po.id);
  }

  async findAll(params?: {
    projectId?: string;
    vendorId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (params?.projectId) {
      where.project_id = params.projectId;
    }

    if (params?.vendorId) {
      where.vendor_id = params.vendorId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    return this.purchaseOrderModel.findAll({
      where,
      include: [
        {
          model: PurchaseOrderItem,
          include: [MaterialMaster],
        },
      ],
      order: [['po_date', 'DESC']],
    });
  }

  async findOne(id: string) {
    const po = await this.purchaseOrderModel.findByPk(id, {
      include: [
        {
          model: PurchaseOrderItem,
          include: [MaterialMaster],
        },
      ],
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(id);

    if (
      ['PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'].includes(
        po.status,
      )
    ) {
      throw new BadRequestException(
        `Purchase order cannot be edited in ${po.status} status`,
      );
    }

    await po.update(dto);

    return this.findOne(id);
  }

  async approve(id: string, userId?: string) {
    const po = await this.findOne(id);

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft purchase orders can be approved',
      );
    }

    await po.update({
      status: PurchaseOrderStatus.APPROVED,
      approved_by: userId ?? null,
      approved_at: new Date(),
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const po = await this.findOne(id);

    if (
      [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CLOSED].includes(
        po.status,
      )
    ) {
      throw new BadRequestException(
        'Received/closed purchase order cannot be cancelled',
      );
    }

    await po.update({
      status: PurchaseOrderStatus.CANCELLED,
    });

    return po;
  }
  private async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();

    const prefix = `PO-${year}-`;

    const last = await this.purchaseOrderModel.findOne({
      where: {
        po_number: {
          // Sequelize operator intentionally kept local
          // to avoid coupling DTOs to Sequelize.
          // @ts-ignore
          [require('sequelize').Op.like]: `${prefix}%`,
        },
      },
      order: [['created_at', 'DESC']],
    });

    let sequence = 1;

    if (last?.po_number) {
      const match = last.po_number.match(/-(\d+)$/);

      if (match) {
        sequence = Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
