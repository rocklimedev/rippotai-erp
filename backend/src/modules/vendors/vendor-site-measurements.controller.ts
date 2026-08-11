import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VendorSiteMeasurementsService } from './vendor-site-measurements.service';
import { CreateVendorSiteMeasurementDto } from './dto/create-vendor-site-measurement.dto';
import { UpdateVendorSiteMeasurementDto } from './dto/update-vendor-site-measurement.dto';

@Controller('vendor-site-measurements')
export class VendorSiteMeasurementsController {
  constructor(private readonly service: VendorSiteMeasurementsService) {}

  @Post()
  create(@Body() dto: CreateVendorSiteMeasurementDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('tradeTeamId') tradeTeamId?: string,
  ) {
    return this.service.findAll({ projectId, vendorId, tradeTeamId });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVendorSiteMeasurementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
