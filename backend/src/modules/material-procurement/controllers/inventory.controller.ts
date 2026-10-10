import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

import { InventoryService } from '../services/inventory.service';

import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
  AdjustInventoryDto,
  TransferInventoryDto,
  ReturnInventoryDto,
} from '../dto/inventory.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================================
  // ADD / RECEIVE INVENTORY
  // ============================================================

  @RequirePermission('inventory:create')
  @Post('transactions')
  create(@Body() dto: CreateInventoryTransactionDto, @Req() req: any) {
    return this.inventoryService.create(dto, req.user?.id);
  }

  // ============================================================
  // ISSUE MATERIAL
  // ============================================================

  @RequirePermission('inventory:issue')
  @Post('issue')
  issue(@Body() dto: IssueMaterialDto, @Req() req: any) {
    return this.inventoryService.issue(dto, req.user?.id);
  }

  // ============================================================
  // ADJUST INVENTORY
  // ============================================================

  @RequirePermission('inventory:adjust')
  @Post('adjust')
  adjust(@Body() dto: AdjustInventoryDto, @Req() req: any) {
    return this.inventoryService.adjust(dto, req.user?.id);
  }

  // ============================================================
  // TRANSFER BETWEEN SITES
  // ============================================================

  @RequirePermission('inventory:transfer')
  @Post('transfer')
  transfer(@Body() dto: TransferInventoryDto, @Req() req: any) {
    return this.inventoryService.transfer(dto, req.user?.id);
  }

  // ============================================================
  // RETURN MATERIAL
  // ============================================================

  @RequirePermission('inventory:return')
  @Post('return')
  returnMaterial(@Body() dto: ReturnInventoryDto, @Req() req: any) {
    return this.inventoryService.returnMaterial(dto, req.user?.id);
  }

  // ============================================================
  // RECEIVE FROM DELIVERY CHALLAN
  // ============================================================

  @RequirePermission('inventory:deliver')
  @Post('receive-delivery')
  receiveFromDelivery(@Body() dto: any, @Req() req: any) {
    return this.inventoryService.receiveFromDelivery(dto, req.user?.id);
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('transactions')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('siteLocation') siteLocation?: string,
    @Query('materialId') materialId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('referenceType') referenceType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.findAll({
      projectId,
      siteLocation,
      materialId,
      transactionType,
      referenceType,
      fromDate,
      toDate,
    });
  }

  // ============================================================
  // PROJECT INVENTORY
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('stock/:projectId')
  getProjectStock(
    @Param('projectId') projectId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getProjectStock(projectId, siteId);
  }

  // ============================================================
  // MATERIAL STOCK
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('stock/:projectId/:materialId')
  getMaterialStock(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getCurrentStock(projectId, siteId, materialId);
  }

  // ============================================================
  // MATERIAL HISTORY
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('material/:projectId/:materialId/history')
  getMaterialHistory(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getMaterialHistory(
      projectId,
      materialId,
      siteId,
    );
  }

  // ============================================================
  // INVENTORY SUMMARY
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('summary/:projectId')
  getSummary(
    @Param('projectId') projectId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.inventoryService.getInventorySummary(projectId, siteId);
  }

  // ============================================================
  // SINGLE TRANSACTION
  // ============================================================

  @RequirePermission('inventory:read')
  @Get('transactions/:id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }
}
