import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VendorBusinessTypesService } from './vendor-business-types.service';
import { CreateVendorBusinessTypeDto } from './dto/create-vendor-business-types.dto';

@Controller('vendor/business-types')
export class VendorBusinessTypesController {
  constructor(
    private readonly businessTypesService: VendorBusinessTypesService,
  ) {}

  @Post()
  create(@Body() dto: CreateVendorBusinessTypeDto) {
    return this.businessTypesService.create(dto);
  }

  @Get()
  findAll(@Query('category_id') category_id?: string) {
    return this.businessTypesService.findAll(category_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessTypesService.findOne(id);
  }
}
