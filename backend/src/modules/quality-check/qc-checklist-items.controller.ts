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
import { QcChecklistItemsService } from './qc-checklist-items.service';
import { CreateQcChecklistItemDto } from './dto/create-qc-checklist-item.dto';
import { UpdateQcChecklistItemDto } from './dto/update-qc-checklist-item.dto';

@Controller('qc/checklist-items')
export class QcChecklistItemsController {
  constructor(
    private readonly qcChecklistItemsService: QcChecklistItemsService,
  ) {}

  @Post()
  create(@Body() dto: CreateQcChecklistItemDto) {
    return this.qcChecklistItemsService.create(dto);
  }

  @Get()
  findAll(@Query('checklistId') checklistId?: string) {
    return this.qcChecklistItemsService.findAll(checklistId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.qcChecklistItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQcChecklistItemDto,
  ) {
    return this.qcChecklistItemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.qcChecklistItemsService.remove(id);
  }
}
