import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PurchaseOrder } from '../models/purchase-order.model';
import { PurchaseOrderItem } from '../models/purchase-order-item.model';
import { DeliveryChallan } from '../models/delivery-challan.model';
import { MaterialQuotation } from '../models/material-quotation.model';
import { MaterialEstimate } from '../models/material-estimate.model';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { PurchaseOrderStatus } from '../../../common/enums/purchase-order-status.enum';
import { QuotationStatus } from '../../../common/enums/quotation-status.enum';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';
import { MaterialQuotationService } from './material-quotation.service';
import { MaterialRequirementService } from './material-requirement.service';

/**
 * 4. Purchase orders — issued against approved (accepted) material
 * quotations, with line-item tracking of delivered vs. ordered quantity.
 */
@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrder)
    private readonly model: typeof PurchaseOrder,
    @InjectModel(PurchaseOrderItem)
    private readonly itemModel: typeof PurchaseOrderItem,
    private readonly quotationService: MaterialQuotationService,
    private readonly requirementService: MaterialRequirementService,
  ) {}

  async create(dto: CreatePurchaseOrderDto) {
    const quotation = await this.quotationService.findOne(dto.quotationId);
    if (quotation.status !== QuotationStatus.ACCEPTED) {
      throw new BadRequestException(
        'Purchase orders can only be issued against an accepted quotation',
      );
    }
    if (!dto.items?.length) {
      throw new BadRequestException('A purchase order needs at least one item');
    }

    const items = dto.items.map((item) => ({
      materialRequirementId: item.materialRequirementId,
      description: item.description,
      unit: item.unit,
      orderedQuantity: item.orderedQuantity,
      deliveredQuantity: 0,
      unitRate: item.unitRate,
      lineTotal: Number((item.orderedQuantity * item.unitRate).toFixed(2)),
    }));
    const totalAmount = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

    const po = await this.model.create(
      {
        quotationId: dto.quotationId,
        poNumber: dto.poNumber,
        vendorName: dto.vendorName,
        orderDate: dto.orderDate,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        status: PurchaseOrderStatus.OPEN,
        totalAmount: Number(totalAmount.toFixed(2)),
        items,
      } as any,
      { include: [PurchaseOrderItem] },
    );

    const estimate = quotation.estimate as MaterialEstimate | undefined;
    if (estimate?.materialRequirementId) {
      await this.requirementService.setStatus(
        estimate.materialRequirementId,
        RequirementStatus.ORDERED,
      );
    }

    return po;
  }

  findAll() {
    return this.model.findAll({
      include: [PurchaseOrderItem],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const po = await this.model.findByPk(id, {
      include: [
        PurchaseOrderItem,
        { model: DeliveryChallan, include: [] },
        {
          model: MaterialQuotation,
          include: [MaterialEstimate],
        },
      ],
    });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return po;
  }

  async findItem(itemId: string) {
    const item = await this.itemModel.findByPk(itemId, {
      include: [PurchaseOrder],
    });
    if (!item) throw new NotFoundException(`PO item ${itemId} not found`);
    return item;
  }

  /**
   * Applies a delivered quantity to a line item (called from
   * DeliveryChallanService) and recomputes the parent PO's status
   * from the aggregate of ordered vs. delivered quantities.
   */
  async applyDelivery(itemId: string, deliveredQty: number) {
    const item = await this.findItem(itemId);
    const remaining =
      Number(item.orderedQuantity) - Number(item.deliveredQuantity);
    if (deliveredQty > remaining) {
      throw new BadRequestException(
        `Delivered quantity (${deliveredQty}) exceeds remaining ordered quantity (${remaining}) for item ${itemId}`,
      );
    }
    await item.update({
      deliveredQuantity: Number(item.deliveredQuantity) + deliveredQty,
    });
    await this.recomputeStatus(item.purchaseOrderId);
    return item;
  }

  private async recomputeStatus(purchaseOrderId: string) {
    const po = await this.model.findByPk(purchaseOrderId, {
      include: [PurchaseOrderItem],
    });
    if (!po) return;

    const fullyDelivered = po.items.every(
      (i) => Number(i.deliveredQuantity) >= Number(i.orderedQuantity),
    );
    const anyDelivered = po.items.some((i) => Number(i.deliveredQuantity) > 0);

    const status = fullyDelivered
      ? PurchaseOrderStatus.FULLY_DELIVERED
      : anyDelivered
        ? PurchaseOrderStatus.PARTIALLY_DELIVERED
        : PurchaseOrderStatus.OPEN;

    await po.update({ status });
  }

  async cancel(id: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.FULLY_DELIVERED) {
      throw new BadRequestException(
        'Cannot cancel a fully delivered purchase order',
      );
    }
    return po.update({ status: PurchaseOrderStatus.CANCELLED });
  }

  async close(id: string) {
    const po = await this.findOne(id);
    return po.update({ status: PurchaseOrderStatus.CLOSED });
  }
}
