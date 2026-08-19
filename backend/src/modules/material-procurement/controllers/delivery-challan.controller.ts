import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DeliveryChallanService } from '../services/delivery-challan.service';
import { CreateDeliveryChallanDto } from '../dto/create-delivery-challan.dto';

/** 5. Staged deliveries — delivery challans tagged to a site stage. */
@Controller('procurement/delivery-challans')
export class DeliveryChallanController {
  constructor(private readonly service: DeliveryChallanService) {}

  @Post()
  create(@Body() dto: CreateDeliveryChallanDto) {
    return this.service.create(dto);
  }

  @Get('by-purchase-order/:purchaseOrderId')
  findAllForPurchaseOrder(@Param('purchaseOrderId') purchaseOrderId: string) {
    return this.service.findAllForPurchaseOrder(purchaseOrderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
