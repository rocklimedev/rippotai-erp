import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProjectTypeService } from './project-type.service';
import {
  CreateProjectTypeDto,
  UpdateProjectTypeDto,
} from './dto/project-type.dto';

@Controller('project-types')
export class ProjectTypeController {
  constructor(private readonly projectTypeService: ProjectTypeService) {}

  @RequirePermission('project-types:create')
  @Post()
  create(@Body() dto: CreateProjectTypeDto) {
    return this.projectTypeService.create(dto);
  }

  @RequirePermission('project-types:read')
  @Get()
  findAll() {
    return this.projectTypeService.findAll();
  }

  @RequirePermission('project-types:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectTypeService.findOne(id);
  }

  @RequirePermission('project-types:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectTypeDto) {
    return this.projectTypeService.update(id, dto);
  }

  @RequirePermission('project-types:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectTypeService.remove(id);
  }
}
