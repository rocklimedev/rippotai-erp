import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryChallan } from './models/delivery-challan.model';
import { DeliveryChallanItem } from './models/delivery-challan-item.model';
import { PurchaseOrder } from './models/purchase-order.model';
import { PurchaseOrderItem } from './models/purchase-order-item.model';
import { DeliveryChallansService } from './delivery-challans.service';
import { DeliveryChallansController } from './delivery-challans.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DeliveryChallan,
      DeliveryChallanItem,
      PurchaseOrderItem,
      PurchaseOrder,
    ]),
  ],
  providers: [DeliveryChallansService],
  controllers: [DeliveryChallansController],
  exports: [DeliveryChallansService],
})
export class DeliveryChallansModule {}
