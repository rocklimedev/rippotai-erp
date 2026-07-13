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

  @Post()
  create(@Body() dto: CreateProjectTypeDto) {
    return this.projectTypeService.create(dto);
  }

  @Get()
  findAll() {
    return this.projectTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectTypeDto) {
    return this.projectTypeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectTypeService.remove(id);
  }
}
