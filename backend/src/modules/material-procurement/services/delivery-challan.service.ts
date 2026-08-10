import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DeliveryChallan } from '../models/delivery-challan.model';
import { DeliveryChallanItem } from '../models/delivery-challan-item.model';
import { CreateDeliveryChallanDto } from '../dto/create-delivery-challan.dto';
import { PurchaseOrderService } from './purchase-order.service';
import { SiteInventoryService } from './site-inventory.service';

/**
 * 5. Staged deliveries — delivery challans logged against each purchase
 * order and tagged to the site stage that needs them. Posting a challan
 * updates the PO's delivered-vs-ordered quantities and pushes a matching
 * inward transaction into the site inventory register.
 */
@Injectable()
export class DeliveryChallanService {
  constructor(
    @InjectModel(DeliveryChallan)
    private readonly model: typeof DeliveryChallan,
    @InjectModel(DeliveryChallanItem)
    private readonly itemModel: typeof DeliveryChallanItem,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly inventoryService: SiteInventoryService,
  ) {}

  async create(dto: CreateDeliveryChallanDto) {
    const po = await this.purchaseOrderService.findOne(dto.purchaseOrderId);
    if (!dto.items?.length) {
      throw new BadRequestException('A delivery challan needs at least one item');
    }

    const challan = await this.model.create({
      purchaseOrderId: dto.purchaseOrderId,
      challanNumber: dto.challanNumber,
      deliveryDate: dto.deliveryDate,
      siteStage: dto.siteStage,
      receivedBy: dto.receivedBy,
      notes: dto.notes,
    } as any);

    const quotation = po.quotation as any;
    const projectId =
      quotation?.estimate?.materialRequirementId ?? po.vendorName;

    for (const itemDto of dto.items) {
      const poItem = po.items.find((i) => i.id === itemDto.purchaseOrderItemId);
      if (!poItem) {
        throw new NotFoundException(
          `PO item ${itemDto.purchaseOrderItemId} does not belong to purchase order ${po.id}`,
        );
      }

      await this.itemModel.create({
        deliveryChallanId: challan.id,
        purchaseOrderItemId: itemDto.purchaseOrderItemId,
        deliveredQuantity: itemDto.deliveredQuantity,
        remarks: itemDto.remarks,
      } as any);

      // Updates PurchaseOrderItem.deliveredQuantity and recomputes PO status.
      await this.purchaseOrderService.applyDelivery(
        itemDto.purchaseOrderItemId,
        itemDto.deliveredQuantity,
      );

      // Mirrors the receipt into the live site inventory register.
      await this.inventoryService.recordInboundFromDelivery({
        projectId: projectId ?? 'unassigned',
        materialRequirementId: poItem.materialRequirementId,
        materialName: poItem.description,
        unit: poItem.unit,
        quantity: itemDto.deliveredQuantity,
        purchaseOrderId: po.id,
        deliveryChallanId: challan.id,
        receivedBy: dto.receivedBy,
      });
    }

    return this.findOne(challan.id);
  }

  findAllForPurchaseOrder(purchaseOrderId: string) {
    return this.model.findAll({
      where: { purchaseOrderId },
      include: [DeliveryChallanItem],
      order: [['deliveryDate', 'DESC']],
    });
  }

  async findOne(id: string) {
    const challan = await this.model.findByPk(id, {
      include: [DeliveryChallanItem],
    });
    if (!challan) throw new NotFoundException(`Delivery challan ${id} not found`);
    return challan;
  }
}
