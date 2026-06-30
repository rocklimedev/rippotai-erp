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
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

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
}
