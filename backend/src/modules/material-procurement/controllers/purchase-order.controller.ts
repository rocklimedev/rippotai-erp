import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

/** 4. Purchase orders — issued against accepted quotations. */
@Controller('procurement/purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }
}
