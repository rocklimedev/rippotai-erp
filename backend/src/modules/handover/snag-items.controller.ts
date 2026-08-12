import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SnagItemsService } from './snag-items.service';
import { CreateSnagItemDto } from './dto/create-snag-item.dto';
import { UpdateSnagItemDto } from './dto/update-snag-item.dto';
import { SnagItemStatus } from './models/snag-item.model';

@Controller('snag-items')
export class SnagItemsController {
  constructor(private readonly snagItemsService: SnagItemsService) {}

  @Post()
  create(@Body() dto: CreateSnagItemDto) {
    return this.snagItemsService.create(dto);
  }

  @Get()
  findAll(
    @Query('snagListId') snagListId?: string,
    @Query('status') status?: SnagItemStatus,
  ) {
    return this.snagItemsService.findAll(snagListId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSnagItemDto,
  ) {
    return this.snagItemsService.update(id, dto);
  }

  @Patch(':id/rectify')
  markRectified(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagItemsService.markRectified(id);
  }

  @Patch(':id/verify')
  verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagItemsService.verify(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagItemsService.remove(id);
  }
}
