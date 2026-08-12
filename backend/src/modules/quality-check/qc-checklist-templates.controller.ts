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
import { QcChecklistTemplatesService } from './qc-checklist-templates.service';
import { CreateQcChecklistTemplateDto } from './dto/create-qc-checklist-template.dto';
import { UpdateQcChecklistTemplateDto } from './dto/update-qc-checklist-template.dto';

@Controller('qc-checklist-templates')
export class QcChecklistTemplatesController {
  constructor(
    private readonly qcChecklistTemplatesService: QcChecklistTemplatesService,
  ) {}

  @Post()
  create(@Body() dto: CreateQcChecklistTemplateDto) {
    return this.qcChecklistTemplatesService.create(dto);
  }

  @Get()
  findAll(@Query('tradeTeamId') tradeTeamId?: string) {
    return this.qcChecklistTemplatesService.findAll(tradeTeamId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.qcChecklistTemplatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQcChecklistTemplateDto,
  ) {
    return this.qcChecklistTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.qcChecklistTemplatesService.remove(id);
  }
}
