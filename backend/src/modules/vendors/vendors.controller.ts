import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { VendorsService } from './vendors.service';
import { VendorDashboardService } from './vendor-dashboard.service';

import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly vendorDashboardService: VendorDashboardService,
  ) {}

  // =========================
  // CREATE
  // =========================
  @Post()
  create(@Body() dto: CreateVendorDto, @CurrentUser() user?: any) {
    return this.vendorsService.create(dto, user);
  }

  // =========================
  // GET ALL
  // =========================
  @Get()
  findAll(
    @Query('status') status?: VendorStatus,
    @Query('vendor_category_id') vendor_category_id?: string,
    @Query('business_type_id') business_type_id?: string,
  ) {
    return this.vendorsService.findAll({
      status,
      vendor_category_id,
      business_type_id,
    });
  }

  // =========================
  // GET ONE
  // =========================
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  // =========================
  // GET QUOTATIONS BY VENDOR
  // =========================
  @Get(':id/quotations')
  getQuotationsByVendor(@Param('id') id: string) {
    return this.vendorsService.getQuotationsByVendor(id);
  }

  // =========================
  // UPDATE
  // =========================
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser() user?: any,
  ) {
    return this.vendorsService.update(id, dto, user);
  }

  // =========================
  // SET STATUS
  // =========================
  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body('status') status: VendorStatus,
    @CurrentUser() user?: any,
  ) {
    return this.vendorsService.setStatus(id, status, user);
  }

  // =========================
  // DELETE
  // =========================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.vendorsService.remove(id, user);
  }

  // =========================
  // DASHBOARD ROUTES
  // =========================
  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.vendorDashboardService.getDashboardSummary();
  }

  @Get('dashboard/by-category')
  getVendorsByCategory() {
    return this.vendorDashboardService.getVendorsByCategory();
  }

  @Get('dashboard/project-wise')
  getVendorsProjectWise() {
    return this.vendorDashboardService.getVendorsProjectWise();
  }

  @Get('dashboard/requiring-attention')
  getVendorsRequiringAttention() {
    return this.vendorDashboardService.getVendorsRequiringAttention();
  }

  @Get('dashboard/onboarding-trend')
  getVendorsOnboardingTrend(@Query('months') months?: string) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.vendorDashboardService.getVendorsOnboardingTrend(monthsNum);
  }

  @Get('dashboard/availability-mix')
  getVendorsAvailabilityMix() {
    return this.vendorDashboardService.getVendorsAvailabilityMix();
  }

  @Get('dashboard/recently-added')
  getVendorsRecentlyAdded(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.vendorDashboardService.getVendorsRecentlyAdded(limitNum);
  }
}
