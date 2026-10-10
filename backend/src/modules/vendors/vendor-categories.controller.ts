import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { VendorCategoriesService } from './vendor-categories.service';

@Controller('vendor/categories')
export class VendorCategoriesController {
  constructor(
    private readonly vendorCategoriesService: VendorCategoriesService,
  ) {}

  @RequirePermission('vendor-categories:read')
  @Get()
  findAll() {
    return this.vendorCategoriesService.findAll();
  }

  @RequirePermission('vendor-categories:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorCategoriesService.findOne(id);
  }
}
