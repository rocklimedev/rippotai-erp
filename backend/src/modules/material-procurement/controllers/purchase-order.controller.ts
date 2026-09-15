import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { PurchaseOrderService } from '../services/purchase-order.service';

import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '../dto/purchase-order.dto';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.purchaseOrderService.create(dto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.purchaseOrderService.findAll({
      projectId,
      vendorId,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrderService.update(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.purchaseOrderService.approve(id, req.user?.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }
}
