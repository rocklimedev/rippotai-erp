import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SiteInventoryService } from '../services/site-inventory.service';
import { RecordInventoryTransactionDto } from '../dto/record-inventory-transaction.dto';

/** 6. Site inventory register. */
@Controller('material-procurement/site-inventory')
export class SiteInventoryController {
  constructor(private readonly service: SiteInventoryService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.service.getTransactions(id);
  }

  @Post('transactions')
  recordTransaction(@Body() dto: RecordInventoryTransactionDto) {
    return this.service.recordTransaction(dto);
  }

  @Get('reconcile/:purchaseOrderId')
  reconcile(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Query('poDeliveredTotal') poDeliveredTotal: string,
  ) {
    return this.service.reconcileAgainstPurchaseOrder(
      purchaseOrderId,
      Number(poDeliveredTotal ?? 0),
    );
  }
}
