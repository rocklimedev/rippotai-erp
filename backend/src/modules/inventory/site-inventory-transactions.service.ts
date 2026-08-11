import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID } from 'crypto';
import {
  InventoryTransactionType,
  SiteInventoryTransaction,
} from './models/site-inventory-transaction.model';
import { SiteInventoryItem } from './models/site-inventory-item.model';
import { CreateSiteInventoryTransactionDto } from './dto/site-inventory-transaction.dto';

@Injectable()
export class SiteInventoryTransactionsService {
  constructor(
    @InjectModel(SiteInventoryTransaction)
    private readonly model: typeof SiteInventoryTransaction,
    @InjectModel(SiteInventoryItem)
    private readonly itemModel: typeof SiteInventoryItem,
    private readonly sequelize: Sequelize,
  ) {}

  findAll(inventoryItemId: string) {
    return this.model.findAll({
      where: { inventoryItemId },
      order: [['createdAt', 'DESC']],
    });
  }

  async create(dto: CreateSiteInventoryTransactionDto) {
    return this.sequelize.transaction(async (transaction) => {
      const item = await this.itemModel.findByPk(dto.inventory_item_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!item) {
        throw new NotFoundException(
          `SiteInventoryItem ${dto.inventory_item_id} not found`,
        );
      }

      const signedDelta =
        dto.type === InventoryTransactionType.OUTWARD ||
        dto.type === InventoryTransactionType.DAMAGE
          ? -Number(dto.quantity)
          : Number(dto.quantity);

      const newQuantity = Number(item.quantityOnHand) + signedDelta;

      if (newQuantity < 0) {
        throw new BadRequestException(
          'Transaction would result in negative quantity on hand',
        );
      }

      const txn = await this.model.create(
        {
          id: randomUUID(),
          inventoryItemId: dto.inventory_item_id,
          type: dto.type,
          quantity: dto.quantity,
          referenceType: dto.reference_type ?? null,
          referenceId: dto.reference_id ?? null,
          recordedBy: dto.recorded_by ?? null,
          remarks: dto.remarks ?? null,
        },
        { transaction },
      );

      await item.update(
        {
          quantityOnHand: newQuantity,
        },
        { transaction },
      );

      return txn;
    });
  }
}
