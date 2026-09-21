import {
  Body,
  Controller,
  Delete,
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

  // ============================================================
  // CREATE
  // POST /purchase-orders
  // ============================================================

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.purchaseOrderService.create(dto, req.user?.id);
  }

  // ============================================================
  // LIST
  // GET /purchase-orders
  // ============================================================

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

  // ============================================================
  // GET ONE
  // GET /purchase-orders/:id
  // ============================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrderService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /purchase-orders/:id
  // ============================================================

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrderService.update(id, dto);
  }

  // ============================================================
  // APPROVE
  // POST /purchase-orders/:id/approve
  // ============================================================

  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.purchaseOrderService.approve(id, req.user?.id);
  }

  // ============================================================
  // CANCEL
  // POST /purchase-orders/:id/cancel
  // ============================================================

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchaseOrderService.cancel(id);
  }

  // ============================================================
  // DELETE
  // DELETE /purchase-orders/:id
  // ============================================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseOrderService.delete(id);
  }
}
