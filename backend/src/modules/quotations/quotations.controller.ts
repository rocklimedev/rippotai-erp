import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuotationExportService } from './quotation-export.service';

import { QuotationsService } from './quotations.service';
import { QuotationDashboardService } from './quotation-dashboard.service';

import {
  CreateQuotationDto,
  UpdateQuotationDto,
  ReviewQuotationDto,
} from './dto/quotation.dto';
import { CreateQuotationComparisonDto } from './dto/quotation-comparison.dto';

import { QuotationStatus } from '../../common/enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly quotationDashboardService: QuotationDashboardService,
    private readonly quotationExportService: QuotationExportService,
  ) {}

  // =========================
  // CREATE
  // =========================
  @RequirePermission('quotations:create')
  @Post()
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user?: any) {
    return this.quotationsService.create(dto, user);
  }

  // =========================
  // GET ALL
  // =========================
  @RequirePermission('quotations:read')
  @Get()
  findAll(
    @Query('status') status?: QuotationStatus,
    @Query('project_id') project_id?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.quotationsService.findAll({
      status,
      project_id,
      vendor_id,
      includeDeleted: includeDeleted === 'true',
    });
  }

  // =========================
  // DASHBOARD
  // =========================
  @RequirePermission('quotations:read')
  @Get('summary')
  getSummary() {
    return this.quotationDashboardService.getSummary();
  }

  @RequirePermission('quotations:read')
  @Get('project-wise')
  getProjectWise() {
    return this.quotationDashboardService.getProjectWise();
  }

  @RequirePermission('quotations:read')
  @Get('expiring-soon')
  getExpiringSoon(@Query('within_days') within_days?: string) {
    return this.quotationDashboardService.getExpiringSoon(
      within_days ? Number(within_days) : 7,
    );
  }

  @RequirePermission('quotations:read')
  @Get('boq-variance')
  getBoqVariance() {
    return this.quotationDashboardService.getBoqVariance();
  }

  @RequirePermission('quotations:read')
  @Get('value-trend')
  getValueTrend(@Query('months') months?: string) {
    return this.quotationDashboardService.getValueTrend(
      months ? Number(months) : 6,
    );
  }

  @RequirePermission('quotations:read')
  @Get('status-mix')
  getStatusMix() {
    return this.quotationDashboardService.getStatusMix();
  }

  @RequirePermission('quotations:read')
  @Get('variation-by-project')
  getVariationByProject(@Query('limit') limit?: string) {
    return this.quotationDashboardService.getVariationByProject(
      limit ? Number(limit) : 6,
    );
  }

  // =========================
  // COMPARISON
  // =========================
  @RequirePermission('quotations:read')
  @Get('compare')
  async compare(@Query('ids') ids: string) {
    if (!ids) {
      throw new BadRequestException('Query parameter "ids" is required');
    }

    const idList = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return this.quotationsService.compareQuotations(idList);
  }

  @RequirePermission('quotations:create')
  @Post('quotation-comparisons')
  saveComparison(
    @Body() dto: CreateQuotationComparisonDto,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.saveComparison(dto, user);
  }

  // =========================
  // SINGLE QUOTATION ROUTES
  // =========================
  @RequirePermission('quotations:export')
  @Get(':id/export/excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.quotationExportService.toExcel(id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @RequirePermission('quotations:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @RequirePermission('quotations:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.update(id, dto, user);
  }

  @RequirePermission('quotations:submit')
  @Patch(':id/submit')
  submit(
    @Param('id') id: string,
    @Body('submitted_by') submitted_by?: string,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.submit(id, submitted_by, user);
  }

  @RequirePermission('quotations:approve')
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.approve(id, dto, user);
  }

  @RequirePermission('quotations:update')
  @Patch(':id/return')
  returnForEditing(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.returnForEditing(id, dto, user);
  }

  @RequirePermission('quotations:update')
  @Patch(':id/decline')
  decline(
    @Param('id') id: string,
    @Body() dto: ReviewQuotationDto,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.decline(id, dto, user);
  }

  @RequirePermission('quotations:update')
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('updated_by') updated_by?: string,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.cancel(id, updated_by, user);
  }

  @RequirePermission('quotations:restore')
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.quotationsService.restore(id, user);
  }

  @RequirePermission('quotations:select')
  @Post(':id/mark-selected')
  markSelected(
    @Param('id') id: string,
    @Body('remarks') remarks?: string,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.markQuotationSelected(id, remarks, user);
  }

  // =========================
  // DELETE
  // =========================
  @RequirePermission('quotations:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(
    @Param('id') id: string,
    @Body('deleted_by') deleted_by?: string,
    @CurrentUser() user?: any,
  ) {
    return this.quotationsService.softDelete(id, deleted_by, user);
  }

  @RequirePermission('quotations:delete')
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
