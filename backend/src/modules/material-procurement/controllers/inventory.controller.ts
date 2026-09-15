import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { InventoryService } from '../services/inventory.service';

import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
} from '../dto/inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('transactions')
  create(
    @Body()
    dto: CreateInventoryTransactionDto,
    @Req() req: any,
  ) {
    return this.inventoryService.create(dto, req.user?.id);
  }

  @Post('issue')
  issue(@Body() dto: IssueMaterialDto, @Req() req: any) {
    return this.inventoryService.issue(dto, req.user?.id);
  }

  @Get('transactions')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('materialId') materialId?: string,
    @Query('transactionType')
    transactionType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.findAll({
      projectId,
      siteId,
      materialId,
      transactionType,
      fromDate,
      toDate,
    });
  }

  @Get('stock/:projectId')
  getProjectStock(
    @Param('projectId') projectId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getProjectStock(projectId, siteId);
  }

  @Get('stock/:projectId/:materialId')
  getMaterialStock(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getCurrentStock(projectId, siteId, materialId);
  }

  @Get('transactions/:id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }
}
