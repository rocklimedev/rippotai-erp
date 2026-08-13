import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SiteInventoryTransactionsService } from './site-inventory-transactions.service';
import { CreateSiteInventoryTransactionDto } from './dto/site-inventory-transaction.dto';

@Controller('site-inventory/transactions')
export class SiteInventoryTransactionsController {
  constructor(private readonly service: SiteInventoryTransactionsService) {}

  @Get()
  findAll(@Query('inventoryItemId') inventoryItemId: string) {
    return this.service.findAll(inventoryItemId);
  }

  @Post()
  create(@Body() dto: CreateSiteInventoryTransactionDto) {
    return this.service.create(dto);
  }
}
