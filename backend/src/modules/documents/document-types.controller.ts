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

import { DocumentTypesService } from './document-types.service';
import { ProjectDocumentPhaseService } from './project-document-phase.service';

import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Controller('document-types')
export class DocumentTypesController {
  constructor(
    private readonly documentTypesService: DocumentTypesService,
    private readonly projectDocumentPhaseService: ProjectDocumentPhaseService,
  ) {}

  /**
   * Create document type
   */
  @Post()
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(dto);
  }

  /**
   * Get all document types
   */
  @Get()
  findAll(
    @Query('phaseCode') phaseCode?: string,
    @Query('projectPhaseId') projectPhaseId?: string,
    @Query('targetType') targetType?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.documentTypesService.findAll({
      phaseCode,
      projectPhaseId,
      targetType,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('project-phase-tree')
  getProjectDocumentPhaseTree() {
    return this.projectDocumentPhaseService.getAllProjectsDocumentPhaseTree();
  }

  /**
   * Get project-wise document phases and upload status.
   *
   * Example:
   * GET /document-types/projects/:projectId/phases
   *
   * Returns:
   *
   * Project
   *   └── Document Phases
   *         └── Document Types
   *               ├── isUploaded
   *               ├── uploadCount
   *               ├── documentIds
   *               └── completion information
   */
  @Get('projects/:projectId/phases')
  getProjectDocumentPhases(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.projectDocumentPhaseService.getProjectDocumentPhaseList(
      projectId,
    );
  }

  /**
   * Get single document type
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.findOne(id);
  }

  /**
   * Update document type
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    return this.documentTypesService.update(id, dto);
  }

  /**
   * Delete document type
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.remove(id);
  }
}
