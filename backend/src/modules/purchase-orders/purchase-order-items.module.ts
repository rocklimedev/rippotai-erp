import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PurchaseOrderItem } from './models/purchase-order-item.model';
import { PurchaseOrderItemsService } from './purchase-order-items.service';
import { PurchaseOrderItemsController } from './purchase-order-items.controller';

@Module({
  imports: [SequelizeModule.forFeature([PurchaseOrderItem])],
  providers: [PurchaseOrderItemsService],
  controllers: [PurchaseOrderItemsController],
  exports: [PurchaseOrderItemsService],
})
export class PurchaseOrderItemsModule {}
