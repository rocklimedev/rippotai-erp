import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectConnection, InjectModel } from '@nestjs/sequelize';

import { Sequelize } from 'sequelize-typescript';

import {
  DeliveryChallan,
  DeliveryChallanStatus,
} from '../models/delivery-challan.model';

import { DeliveryChallanItem } from '../models/delivery-challan-item.model';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../models/purchase-order.model';

import { PurchaseOrderItem } from '../models/purchase-order-item.model';

import { MaterialMaster } from '../models/material-master.model';

import {
  CreateDeliveryChallanDto,
  UpdateDeliveryChallanDto,
} from '../dto/delivery-challan.dto';
import { MaterialConditionStatus } from '../models/delivery-challan-item.model';
import { InventoryService } from './inventory.service';

@Injectable()
export class DeliveryChallanService {
  constructor(
    @InjectModel(DeliveryChallan)
    private readonly challanModel: typeof DeliveryChallan,

    @InjectModel(DeliveryChallanItem)
    private readonly challanItemModel: typeof DeliveryChallanItem,

    @InjectModel(PurchaseOrder)
    private readonly purchaseOrderModel: typeof PurchaseOrder,

    @InjectModel(PurchaseOrderItem)
    private readonly purchaseOrderItemModel: typeof PurchaseOrderItem,

    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,

    private readonly inventoryService: InventoryService,

    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateDeliveryChallanDto, userId?: string) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'Delivery challan must contain at least one item',
      );
    }

    const transaction = await this.challanModel.sequelize!.transaction();

    try {
      // ============================================================
      // 1. LOAD PURCHASE ORDER
      // ============================================================

      let purchaseOrder: PurchaseOrder | null = null;

      if (dto.purchase_order_id) {
        purchaseOrder = await this.purchaseOrderModel.findByPk(
          dto.purchase_order_id,
          {
            include: [
              {
                model: PurchaseOrderItem,
              },
            ],
            transaction,
          },
        );

        if (!purchaseOrder) {
          throw new NotFoundException('Purchase order not found');
        }

        if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
          throw new BadRequestException(
            'Cannot create delivery against a cancelled purchase order',
          );
        }
      }

      // ============================================================
      // 2. LOAD ALL MATERIALS ONCE
      // ============================================================

      const materialIds = [
        ...new Set(dto.items.map((item) => item.material_id)),
      ];

      const materials = await this.materialModel.findAll({
        where: {
          id: materialIds,
        },
        transaction,
      });

      const materialMap = new Map(
        materials.map((material) => [material.id, material]),
      );

      // ============================================================
      // 3. VALIDATE ITEMS
      // ============================================================

      for (const item of dto.items) {
        const material = materialMap.get(item.material_id);

        if (!material) {
          throw new NotFoundException(`Material ${item.material_id} not found`);
        }

        if (!material.is_active) {
          throw new BadRequestException(
            `Material ${material.name} is inactive`,
          );
        }

        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new BadRequestException(
            `Quantity must be greater than zero for material ${material.name}`,
          );
        }

        const acceptedQuantity =
          item.accepted_quantity !== undefined
            ? Number(item.accepted_quantity)
            : quantity;

        const shortageQuantity =
          item.shortage_quantity !== undefined
            ? Number(item.shortage_quantity)
            : 0;

        const damagedQuantity =
          item.damaged_quantity !== undefined
            ? Number(item.damaged_quantity)
            : 0;

        const rejectedQuantity =
          item.rejected_quantity !== undefined
            ? Number(item.rejected_quantity)
            : 0;

        if (acceptedQuantity < 0) {
          throw new BadRequestException(
            `Accepted quantity cannot be negative for ${material.name}`,
          );
        }

        if (shortageQuantity < 0) {
          throw new BadRequestException(
            `Shortage quantity cannot be negative for ${material.name}`,
          );
        }

        if (damagedQuantity < 0) {
          throw new BadRequestException(
            `Damaged quantity cannot be negative for ${material.name}`,
          );
        }

        if (rejectedQuantity < 0) {
          throw new BadRequestException(
            `Rejected quantity cannot be negative for ${material.name}`,
          );
        }

        if (acceptedQuantity > quantity) {
          throw new BadRequestException(
            `Accepted quantity cannot exceed delivered quantity for ${material.name}`,
          );
        }

        if (shortageQuantity > quantity) {
          throw new BadRequestException(
            `Shortage quantity cannot exceed delivered quantity for ${material.name}`,
          );
        }

        if (damagedQuantity > quantity) {
          throw new BadRequestException(
            `Damaged quantity cannot exceed delivered quantity for ${material.name}`,
          );
        }

        if (rejectedQuantity > quantity) {
          throw new BadRequestException(
            `Rejected quantity cannot exceed delivered quantity for ${material.name}`,
          );
        }

        /**
         * The quantities represent the disposition of the delivered
         * material. They should not exceed the delivered quantity.
         *
         * Example:
         *
         * delivered = 100
         * accepted = 90
         * damaged = 5
         * rejected = 5
         * shortage = 0
         *
         * total = 100
         */
        const dispositionTotal =
          acceptedQuantity + damagedQuantity + rejectedQuantity;

        if (dispositionTotal > quantity) {
          throw new BadRequestException(
            `Accepted + damaged + rejected quantities cannot exceed delivered quantity for ${material.name}`,
          );
        }

        /**
         * Shortage is not physically part of the received quantity,
         * so it is not added to the disposition total.
         *
         * Example:
         *
         * ordered = 100
         * delivered = 95
         * accepted = 90
         * damaged = 5
         * shortage = 5
         *
         * The shortage is recorded separately.
         */
      }

      // ============================================================
      // 4. GENERATE CHALLAN NUMBER
      // ============================================================

      const challanNumber = await this.generateChallanNumber();

      // ============================================================
      // 5. DETERMINE INITIAL STATUS
      // ============================================================

      let status = DeliveryChallanStatus.DRAFT;

      const hasAcceptedMaterial = dto.items.some(
        (item) => Number(item.accepted_quantity ?? item.quantity) > 0,
      );

      if (dto.material_checked && hasAcceptedMaterial) {
        const hasDiscrepancy = dto.items.some(
          (item) =>
            Number(item.shortage_quantity ?? 0) > 0 ||
            Number(item.damaged_quantity ?? 0) > 0 ||
            Number(item.rejected_quantity ?? 0) > 0,
        );

        status = hasDiscrepancy
          ? DeliveryChallanStatus.PARTIALLY_ACCEPTED
          : DeliveryChallanStatus.RECEIVED;
      }

      // ============================================================
      // 6. CREATE DELIVERY CHALLAN
      // ============================================================

      const challan = await this.challanModel.create(
        {
          challan_number: challanNumber,

          project_id: dto.project_id,

          site_id: dto.site_id ?? null,

          purchase_order_id: dto.purchase_order_id ?? null,

          vendor_id: dto.vendor_id ?? null,

          challan_date: dto.challan_date,

          site_address: dto.site_address ?? null,

          status,

          gate_pass_received: dto.gate_pass_received ?? false,

          material_checked: dto.material_checked ?? false,

          general_remarks: dto.general_remarks ?? null,

          discrepancy_notes: dto.discrepancy_notes ?? null,

          attachment_url: dto.attachment_url ?? null,

          created_by: userId ?? null,
        },
        {
          transaction,
        },
      );

      // ============================================================
      // 7. BUILD CHALLAN ITEM ROWS
      // ============================================================

      const itemRows: Array<{
        delivery_challan_id: string;
        purchase_order_item_id: string | null;
        material_id: string;
        line_number: number;
        description: string;
        brand: string | null;
        specification: string | null;
        unit: string;
        quantity: number;
        accepted_quantity: number;
        shortage_quantity: number;
        damaged_quantity: number;
        rejected_quantity: number;
        condition_status: MaterialConditionStatus;
        condition_notes: string | null;
        stored_at: string | null;
        remarks: string | null;
      }> = [];

      for (let index = 0; index < dto.items.length; index++) {
        const item = dto.items[index];

        const material = materialMap.get(item.material_id);

        if (!material) {
          throw new NotFoundException(`Material ${item.material_id} not found`);
        }

        itemRows.push({
          delivery_challan_id: challan.id,

          purchase_order_item_id: item.purchase_order_item_id ?? null,

          material_id: item.material_id,

          line_number: index + 1,

          description: item.description ?? material.name,

          brand: item.brand ?? material.brand ?? null,

          specification: item.specification ?? material.specification ?? null,

          unit: item.unit ?? material.default_unit,

          quantity: Number(item.quantity),

          accepted_quantity:
            item.accepted_quantity !== undefined
              ? Number(item.accepted_quantity)
              : Number(item.quantity),

          shortage_quantity:
            item.shortage_quantity !== undefined
              ? Number(item.shortage_quantity)
              : 0,

          damaged_quantity:
            item.damaged_quantity !== undefined
              ? Number(item.damaged_quantity)
              : 0,

          rejected_quantity:
            item.rejected_quantity !== undefined
              ? Number(item.rejected_quantity)
              : 0,

          condition_status:
            item.condition_status ?? MaterialConditionStatus.GOOD,

          condition_notes: item.condition_notes ?? null,

          stored_at: item.stored_at ?? null,

          remarks: item.remarks ?? null,
        });
      }

      // ============================================================
      // 8. CREATE CHALLAN ITEMS
      // ============================================================

      await this.challanItemModel.bulkCreate(itemRows, {
        transaction,
      });

      // ============================================================
      // 9. COMMIT
      // ============================================================

      await transaction.commit();

      // ============================================================
      // 10. RETURN COMPLETE CHALLAN
      // ============================================================

      return this.findOne(challan.id);
    } catch (error) {
      // ============================================================
      // ROLLBACK
      // ============================================================

      await transaction.rollback();

      throw error;
    }
  }

  async findAll(params?: {
    projectId?: string;
    purchaseOrderId?: string;
    vendorId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (params?.projectId) {
      where.project_id = params.projectId;
    }

    if (params?.purchaseOrderId) {
      where.purchase_order_id = params.purchaseOrderId;
    }

    if (params?.vendorId) {
      where.vendor_id = params.vendorId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    return this.challanModel.findAll({
      where,
      include: [
        {
          model: DeliveryChallanItem,
          include: [MaterialMaster, PurchaseOrderItem],
        },
      ],
      order: [['challan_date', 'DESC']],
    });
  }

  async findOne(id: string) {
    const challan = await this.challanModel.findByPk(id, {
      include: [
        {
          model: DeliveryChallanItem,
          include: [MaterialMaster, PurchaseOrderItem],
        },
      ],
    });

    if (!challan) {
      throw new NotFoundException('Delivery challan not found');
    }

    return challan;
  }

  async update(id: string, dto: UpdateDeliveryChallanDto) {
    const challan = await this.findOne(id);

    if (
      [
        DeliveryChallanStatus.RECEIVED,
        DeliveryChallanStatus.CANCELLED,
      ].includes(challan.status)
    ) {
      throw new BadRequestException(
        `Cannot update challan in ${challan.status} status`,
      );
    }

    await challan.update(dto);

    return this.findOne(id);
  }

  async receive(id: string, userId?: string) {
    const transaction = await this.sequelize.transaction();

    try {
      const challan = await this.challanModel.findByPk(id, {
        include: [
          {
            model: DeliveryChallanItem,
            include: [MaterialMaster, PurchaseOrderItem],
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!challan) {
        throw new NotFoundException('Delivery challan not found');
      }

      if (
        [
          DeliveryChallanStatus.RECEIVED,
          DeliveryChallanStatus.CANCELLED,
        ].includes(challan.status)
      ) {
        throw new BadRequestException(`Challan is already ${challan.status}`);
      }

      if (!challan.material_checked) {
        throw new BadRequestException(
          'Material must be checked before receiving',
        );
      }

      // ============================================================
      // ITEMS
      // ============================================================

      const items = challan.items;

      if (!items?.length) {
        throw new BadRequestException(
          'Cannot receive a delivery challan without items',
        );
      }

      // ============================================================
      // RECEIVING INFORMATION
      // ============================================================

      if (!challan.received_by) {
        await challan.update(
          {
            received_by: userId ?? null,
            received_at: new Date(),
          },
          {
            transaction,
          },
        );
      }

      // ============================================================
      // INVENTORY RECEIPT
      // ============================================================

      for (const item of items) {
        const accepted = Number(item.accepted_quantity);

        if (!Number.isFinite(accepted) || accepted <= 0) {
          continue;
        }

        await this.inventoryService.receiveFromDelivery(
          {
            project_id: challan.project_id,

            site_id: challan.site_id ?? undefined,

            material_id: item.material_id,

            quantity: accepted,

            unit: item.unit,

            delivery_challan_id: challan.id,

            delivery_challan_item_id: item.id,

            vendor_id: challan.vendor_id ?? undefined,

            storage_location: item.stored_at ?? undefined,

            condition_status: item.condition_status,

            condition_notes: item.condition_notes ?? undefined,

            received_by: userId,

            transaction_date: challan.challan_date,

            remarks: item.remarks ?? undefined,
          },
          userId,
        );
      }

      // ============================================================
      // MARK CHALLAN AS RECEIVED
      // ============================================================

      await challan.update(
        {
          status: DeliveryChallanStatus.RECEIVED,

          received_by: userId ?? challan.received_by,

          received_at: challan.received_at ?? new Date(),
        },
        {
          transaction,
        },
      );

      await transaction.commit();

      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async generateChallanNumber() {
    const year = new Date().getFullYear();

    const prefix = `DC-${year}-`;

    const last = await this.challanModel.findOne({
      where: {
        challan_number: {
          // @ts-ignore
          [require('sequelize').Op.like]: `${prefix}%`,
        },
      },
      order: [['created_at', 'DESC']],
    });

    let sequence = 1;

    if (last?.challan_number) {
      const match = last.challan_number.match(/-(\d+)$/);

      if (match) {
        sequence = Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
