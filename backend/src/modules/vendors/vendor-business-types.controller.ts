import { Controller, Get, Param, Query } from '@nestjs/common';
import { VendorBusinessTypesService } from './vendor-business-types.service';

@Controller('vendor/business-types')
export class VendorBusinessTypesController {
  constructor(
    private readonly businessTypesService: VendorBusinessTypesService,
  ) {}

  @Get()
  findAll(@Query('category_id') category_id?: string) {
    return this.businessTypesService.findAll(category_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessTypesService.findOne(id);
  }
}
