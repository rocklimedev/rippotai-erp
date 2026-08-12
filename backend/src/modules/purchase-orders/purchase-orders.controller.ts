import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  IssuePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';

import { PurchaseOrderItemsService } from './purchase-order-items.service';
import {
  CreatePurchaseOrderItemDto,
  UpdatePurchaseOrderItemDto,
} from './dto/purchase-order-item.dto';

@Controller()
export class PurchaseOrdersController {
  constructor(
    private readonly service: PurchaseOrdersService,
    private readonly itemsService: PurchaseOrderItemsService,
  ) {}

  // =========================
  // Purchase Orders
  // =========================

  @Get('purchase-orders')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.service.findAll(projectId, vendorId);
  }

  @Get('purchase-orders/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('purchase-orders')
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(dto);
  }

  @Patch('purchase-orders/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.service.update(id, dto);
  }

  @Post('purchase-orders/:id/issue')
  issue(@Param('id') id: string, @Body() dto: IssuePurchaseOrderDto) {
    return this.service.issue(id, dto);
  }

  @Delete('purchase-orders/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // =========================
  // Purchase Order Items
  // =========================

  @Get('purchase-order-items')
  findAllItems(@Query('purchaseOrderId') purchaseOrderId: string) {
    return this.itemsService.findAll(purchaseOrderId);
  }

  @Get('purchase-order-items/:id')
  findOneItem(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post('purchase-order-items')
  createItem(@Body() dto: CreatePurchaseOrderItemDto) {
    return this.itemsService.create(dto);
  }

  @Patch('purchase-order-items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete('purchase-order-items/:id')
  removeItem(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
