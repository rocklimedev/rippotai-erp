import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SiteInventoryItemsService } from './site-inventory-items.service';
import {
  CreateSiteInventoryItemDto,
  UpdateSiteInventoryItemDto,
} from './dto/site-inventory-item.dto';

@Controller('site-inventory-items')
export class SiteInventoryItemsController {
  constructor(private readonly service: SiteInventoryItemsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('belowReorderLevel') belowReorderLevel?: string,
  ) {
    return this.service.findAll(projectId, belowReorderLevel === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSiteInventoryItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSiteInventoryItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
