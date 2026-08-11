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
import { VendorTenderResponsesService } from './vendor-tender-responses.service';
import { CreateVendorTenderResponseDto } from './dto/create-vendor-tender-response.dto';
import { UpdateVendorTenderResponseDto } from './dto/update-vendor-tender-response.dto';
import { CreateEstimateFromResponseDto } from './dto/create-estimate-from-response.dto';
import { TenderResponseStatus } from '@/common/enums/estimate.enums';

@Controller('vendor-tender-responses')
export class VendorTenderResponsesController {
  constructor(private readonly service: VendorTenderResponsesService) {}

  @Post()
  create(@Body() dto: CreateVendorTenderResponseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: TenderResponseStatus,
  ) {
    return this.service.findAll({ projectId, vendorId, status });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorTenderResponseDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/rework-into-estimate')
  reworkIntoEstimate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEstimateFromResponseDto,
  ) {
    return this.service.reworkIntoEstimate(id, dto);
  }
}
