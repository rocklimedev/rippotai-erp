import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Purchase Order models
import { PurchaseOrder } from './models/purchase-order.model';
import { PurchaseOrderItem } from './models/purchase-order-item.model';

// Delivery Challan models
import { DeliveryChallan } from './models/delivery-challan.model';
import { DeliveryChallanItem } from './models/delivery-challan-item.model';

// Services
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrderItemsService } from './purchase-order-items.service';
import { DeliveryChallansService } from './delivery-challans.service';

// Controllers
import { PurchaseOrdersController } from './purchase-orders.controller';
import { DeliveryChallansController } from './delivery-challans.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      DeliveryChallan,
      DeliveryChallanItem,
    ]),
  ],

  providers: [
    PurchaseOrdersService,
    PurchaseOrderItemsService,
    DeliveryChallansService,
  ],

  controllers: [PurchaseOrdersController, DeliveryChallansController],

  exports: [
    PurchaseOrdersService,
    PurchaseOrderItemsService,
    DeliveryChallansService,
    SequelizeModule,
  ],
})
export class PurchaseOrdersModule {}
