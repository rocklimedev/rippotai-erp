import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialQuotationService } from '../services/material-quotation.service';
import { CreateMaterialQuotationDto } from '../dto/create-material-quotation.dto';

/** 3b. Material quotation — generated only from an approved estimate. */
@Controller('procurement/quotations')
export class MaterialQuotationController {
  constructor(private readonly service: MaterialQuotationService) {}

  @RequirePermission('procurement-quotations:create')
  @Post()
  create(@Body() dto: CreateMaterialQuotationDto) {
    return this.service.createFromEstimate(dto);
  }

  @RequirePermission('procurement-quotations:read')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermission('procurement-quotations:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('procurement-quotations:send')
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @RequirePermission('procurement-quotations:accept')
  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @RequirePermission('procurement-quotations:reject')
  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
