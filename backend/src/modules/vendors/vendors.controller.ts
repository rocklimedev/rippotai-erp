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
import { VendorDashboardService } from './vendor-dashboard.service'; // ← Import added
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly vendorDashboardService: VendorDashboardService, // ← Injected
  ) {}

  // Existing routes...
  @Post()
  create(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.vendorsService.create(dto, user);
  }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.update(id, dto, user);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body('status') status: VendorStatus,
    @CurrentUser() user: any,
  ) {
    return this.vendorsService.setStatus(id, status, user);
  }

  @Get(':id/quotations')
  async getQuotations(@Param('id') id: string) {
    return {
      success: true,
      data: await this.vendorsService.getQuotationsByVendor(id),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vendorsService.remove(id, user);
  }

  // ==================== NEW DASHBOARD ROUTES ====================
  /**
   * Dashboard summary cards
   */
  @Get('dashboard/summary')
  async getDashboardSummary() {
    return this.vendorDashboardService.getDashboardSummary();
  }
  /** Get vendors grouped by category with counts */
  @Get('dashboard/by-category')
  async getVendorsByCategory() {
    return this.vendorDashboardService.getVendorsByCategory();
  }

  /** Project-wise assigned vendors (top 10) */
  @Get('dashboard/project-wise')
  async getVendorsProjectWise() {
    return this.vendorDashboardService.getVendorsProjectWise();
  }

  /** Count of vendors requiring attention */
  @Get('dashboard/requiring-attention')
  async getVendorsRequiringAttention() {
    return this.vendorDashboardService.getVendorsRequiringAttention();
  }

  /** Vendor onboarding trend (cumulative verified) */
  @Get('dashboard/onboarding-trend')
  async getVendorsOnboardingTrend(@Query('months') months?: string) {
    const monthsNum = months ? parseInt(months) : 6;
    return this.vendorDashboardService.getVendorsOnboardingTrend(monthsNum);
  }

  /** Current vendor availability mix (for donut/pie chart) */
  @Get('dashboard/availability-mix')
  async getVendorsAvailabilityMix() {
    return this.vendorDashboardService.getVendorsAvailabilityMix();
  }

  /** Recently added vendors */
  @Get('dashboard/recently-added')
  async getVendorsRecentlyAdded(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 5;
    return this.vendorDashboardService.getVendorsRecentlyAdded(limitNum);
  }
}
