import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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

  @RequirePermission('document-requirements:create')
  @Post()
  create(@Body() dto: CreateDocumentRequirementDto) {
    return this.requirementsService.create(dto);
  }

  @RequirePermission('document-requirements:read')
  @Get()
  findAllForProject(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.requirementsService.findAllForProject(projectId);
  }

  @RequirePermission('document-requirements:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requirementsService.findOne(id);
  }

  @RequirePermission('document-requirements:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentRequirementDto,
  ) {
    return this.requirementsService.update(id, dto);
  }

  @RequirePermission('document-requirements:update')
  @Patch(':id/completed')
  markCompleted(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.requirementsService.markCompleted(id, isCompleted);
  }

  @RequirePermission('document-requirements:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.requirementsService.remove(id);
  }
}
