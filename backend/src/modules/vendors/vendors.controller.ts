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
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body('status') status: VendorStatus) {
    return this.vendorsService.setStatus(id, status);
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
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}
