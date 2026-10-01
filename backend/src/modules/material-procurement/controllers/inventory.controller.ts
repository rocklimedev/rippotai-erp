import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { InventoryService } from '../services/inventory.service';
import type { ReceiveFromDeliveryParams } from '../services/inventory.service';
import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
  AdjustInventoryDto,
  TransferInventoryDto,
  ReturnInventoryDto,
} from '../dto/inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================================
  // WRITE – STOCK MOVEMENTS
  // ============================================================

  /** Generic ledger entry (any transaction type). */
  @Post('transactions')
  create(@Body() dto: CreateInventoryTransactionDto, @Req() req: any) {
    return this.inventoryService.create(dto, req.user?.id);
  }

  /** Manual receipt (not from a Delivery Challan). */
  @Post('receive')
  receive(@Body() dto: CreateInventoryTransactionDto, @Req() req: any) {
    return this.inventoryService.receive(dto, req.user?.id);
  }

  /** Issue material to a contractor / trade. */
  @Post('issue')
  issue(@Body() dto: IssueMaterialDto, @Req() req: any) {
    return this.inventoryService.issue(dto, req.user?.id);
  }

  /** Stock count correction. */
  @Post('adjust')
  adjust(@Body() dto: AdjustInventoryDto, @Req() req: any) {
    return this.inventoryService.adjust(dto, req.user?.id);
  }

  /** Opening stock when a site starts using the register. */
  @Post('opening-stock')
  openingStock(@Body() dto: AdjustInventoryDto, @Req() req: any) {
    return this.inventoryService.addOpeningStock(dto, req.user?.id);
  }

  /** Transfer between site locations. */
  @Post('transfer')
  transfer(@Body() dto: TransferInventoryDto, @Req() req: any) {
    return this.inventoryService.transfer(dto, req.user?.id);
  }

  /** Return from contractor / to vendor. */
  @Post('return')
  returnMaterial(@Body() dto: ReturnInventoryDto, @Req() req: any) {
    return this.inventoryService.returnMaterial(dto, req.user?.id);
  }

  /** Receive accepted material from a Delivery Challan. */
  @Post('receive-delivery')
  receiveFromDelivery(@Body() dto: ReceiveFromDeliveryParams, @Req() req: any) {
    return this.inventoryService.receiveFromDelivery(dto, req.user?.id);
  }

  /** Correct a posted entry by posting its opposite. Reason required. */
  @Post('transactions/:id/reverse')
  reverse(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.inventoryService.reverse(id, body?.reason, req.user?.id);
  }

  // ============================================================
  // SITE INVENTORY REGISTER
  // ============================================================
  // GET /inventory/register/:projectId?siteLocation=...&fromDate=...&toDate=...
  //   -> { received[], issued[], balance[] }  (siteLocation required)
  // GET /inventory/register/:projectId/received   ("Material Received" tab)
  // GET /inventory/register/:projectId/issued     ("Material Issued" tab)
  // GET /inventory/register/:projectId/balance    (stock in store)

  @Get('register/:projectId')
  getSiteRegister(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
    @Query('materialId') materialId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getSiteRegister({
      projectId,
      siteLocation,
      materialId,
      fromDate,
      toDate,
    });
  }

  @Get('register/:projectId/received')
  getReceivedRegister(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
    @Query('materialId') materialId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getReceivedRegister({
      projectId,
      siteLocation,
      materialId,
      fromDate,
      toDate,
    });
  }

  @Get('register/:projectId/issued')
  getIssuedRegister(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
    @Query('materialId') materialId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getIssuedRegister({
      projectId,
      siteLocation,
      materialId,
      fromDate,
      toDate,
    });
  }

  @Get('register/:projectId/balance')
  getRegisterBalance(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
    @Query('materialId') materialId?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getRegisterBalance({
      projectId,
      siteLocation,
      materialId,
      toDate,
    });
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

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

  @Get('transactions/:id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  // ============================================================
  // STOCK
  // ============================================================

  @Get('stock/:projectId')
  getProjectStock(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
  ) {
    return this.inventoryService.getProjectStock(projectId, siteLocation);
  }

  @Get('stock/:projectId/:materialId')
  getMaterialStock(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteLocation') siteLocation?: string,
  ) {
    return this.inventoryService.getCurrentStock(
      projectId,
      siteLocation,
      materialId,
    );
  }

  // ============================================================
  // MATERIAL HISTORY / DETAILS
  // ============================================================

  @Get('material/:projectId/:materialId/history')
  getMaterialHistory(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteLocation') siteLocation?: string,
  ) {
    return this.inventoryService.getMaterialHistory(
      projectId,
      materialId,
      siteLocation,
    );
  }

  @Get('material/:projectId/:materialId/details')
  getMaterialDetails(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
    @Query('siteLocation') siteLocation?: string,
  ) {
    return this.inventoryService.getMaterialStockDetails(
      projectId,
      materialId,
      siteLocation,
    );
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  @Get('summary/:projectId')
  getSummary(
    @Param('projectId') projectId: string,
    @Query('siteLocation') siteLocation?: string,
  ) {
    return this.inventoryService.getInventorySummary(projectId, siteLocation);
  }
}
