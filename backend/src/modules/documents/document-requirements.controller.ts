import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentRequirementsService } from './document-requirements.service';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';
import { UpdateDocumentRequirementDto } from './dto/update-document-requirement.dto';

@Controller('document-requirements')
export class DocumentRequirementsController {
  constructor(
    private readonly requirementsService: DocumentRequirementsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDocumentRequirementDto) {
    return this.requirementsService.create(dto);
  }

  @Get()
  findAllForProject(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.requirementsService.findAllForProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requirementsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentRequirementDto,
  ) {
    return this.requirementsService.update(id, dto);
  }

  @Patch(':id/completed')
  markCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.requirementsService.markCompleted(id, isCompleted);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.requirementsService.remove(id);
  }
}
