import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialQuotationService } from '../services/material-quotation.service';
import { CreateMaterialQuotationDto } from '../dto/create-material-quotation.dto';

/** 3b. Material quotation — generated only from an approved estimate. */
@Controller('procurement/quotations')
export class MaterialQuotationController {
  constructor(private readonly service: MaterialQuotationService) {}

  @Post()
  create(@Body() dto: CreateMaterialQuotationDto) {
    return this.service.createFromEstimate(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
