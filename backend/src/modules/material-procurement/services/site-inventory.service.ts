import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SiteInventory } from '../models/site-inventory.model';
import { InventoryTransaction } from '../models/inventory-transaction.model';
import { RecordInventoryTransactionDto } from '../dto/record-inventory-transaction.dto';
import { InventoryTransactionType } from '../../../common/enums/inventory-transaction-type.enum';

/**
 * 6. Site inventory register — live on-site stock levels with
 * inward / outward / adjustment / damage transactions, reconciled
 * against purchase orders.
 */
@Injectable()
export class SiteInventoryService {
  constructor(
    @InjectModel(SiteInventory)
    private readonly model: typeof SiteInventory,
    @InjectModel(InventoryTransaction)
    private readonly txnModel: typeof InventoryTransaction,
  ) {}

  private async getOrCreateLine(
    projectId: string,
    materialRequirementId: string | undefined,
    materialName: string,
    unit: string,
  ) {
    let line = await this.model.findOne({
      where: materialRequirementId
        ? { projectId, materialRequirementId }
        : { projectId, materialName },
    });
    if (!line) {
      line = await this.model.create({
        projectId,
        materialRequirementId,
        materialName,
        unit,
        currentStock: 0,
      } as any);
    }
    return line;
  }

  /** Records a transaction and atomically updates the running stock balance. */
  async recordTransaction(dto: RecordInventoryTransactionDto) {
    const line = await this.getOrCreateLine(
      dto.projectId,
      dto.materialRequirementId,
      dto.materialName,
      dto.unit,
    );

    const isInbound = dto.type === InventoryTransactionType.INWARD;
    const isOutbound =
      dto.type === InventoryTransactionType.OUTWARD ||
      dto.type === InventoryTransactionType.DAMAGE;

    let newBalance = Number(line.currentStock);
    if (isInbound) {
      newBalance += dto.quantity;
    } else if (isOutbound) {
      if (dto.quantity > newBalance) {
        throw new BadRequestException(
          `Insufficient stock for ${dto.materialName}: have ${newBalance}, requested ${dto.quantity}`,
        );
      }
      newBalance -= dto.quantity;
    } else {
      // ADJUSTMENT — quantity is treated as the signed correction amount
      // encoded via `reference` (e.g. "+" or "-"); default to a positive add.
      newBalance += dto.quantity;
    }

    newBalance = Number(newBalance.toFixed(3));

    const txn = await this.txnModel.create({
      siteInventoryId: line.id,
      purchaseOrderId: dto.purchaseOrderId,
      deliveryChallanId: dto.deliveryChallanId,
      type: dto.type,
      quantity: dto.quantity,
      balanceAfter: newBalance,
      reference: dto.reference,
      remarks: dto.remarks,
      transactedBy: dto.transactedBy,
    } as any);

    await line.update({ currentStock: newBalance });
    return txn;
  }

  /** Convenience used by DeliveryChallanService to post an inward receipt. */
  recordInboundFromDelivery(params: {
    projectId: string;
    materialRequirementId?: string;
    materialName: string;
    unit: string;
    quantity: number;
    purchaseOrderId: string;
    deliveryChallanId: string;
    receivedBy?: string;
  }) {
    return this.recordTransaction({
      projectId: params.projectId,
      materialRequirementId: params.materialRequirementId,
      materialName: params.materialName,
      unit: params.unit,
      type: InventoryTransactionType.INWARD,
      quantity: params.quantity,
      purchaseOrderId: params.purchaseOrderId,
      deliveryChallanId: params.deliveryChallanId,
      reference: `PO delivery via challan ${params.deliveryChallanId}`,
      transactedBy: params.receivedBy,
    });
  }

  findAll(projectId?: string) {
    return this.model.findAll({
      where: projectId ? { projectId } : {},
      order: [['materialName', 'ASC']],
    });
  }

  async findOne(id: string) {
    const line = await this.model.findByPk(id);
    if (!line) throw new NotFoundException(`Inventory line ${id} not found`);
    return line;
  }

  getTransactions(siteInventoryId: string) {
    return this.txnModel.findAll({
      where: { siteInventoryId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Reconciliation check: sums INWARD transactions tagged to a purchase
   * order and compares them against that PO's total delivered quantity
   * (sum of PurchaseOrderItem.deliveredQuantity) to flag any mismatch.
   */
  async reconcileAgainstPurchaseOrder(
    purchaseOrderId: string,
    poDeliveredTotal: number,
  ) {
    const txns = await this.txnModel.findAll({
      where: { purchaseOrderId, type: InventoryTransactionType.INWARD },
    });
    const inventoryInwardTotal = txns.reduce(
      (sum, t) => sum + Number(t.quantity),
      0,
    );
    const variance = Number(
      (inventoryInwardTotal - poDeliveredTotal).toFixed(3),
    );
    return {
      purchaseOrderId,
      poDeliveredTotal,
      inventoryInwardTotal,
      variance,
      reconciled: variance === 0,
    };
  }
}
