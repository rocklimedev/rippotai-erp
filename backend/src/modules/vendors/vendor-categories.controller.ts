import { Controller, Get, Param } from '@nestjs/common';
import { VendorCategoriesService } from './vendor-categories.service';

@Controller('vendor/categories')
export class VendorCategoriesController {
  constructor(
    private readonly vendorCategoriesService: VendorCategoriesService,
  ) {}

  @Get()
  findAll() {
    return this.vendorCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorCategoriesService.findOne(id);
  }
}
