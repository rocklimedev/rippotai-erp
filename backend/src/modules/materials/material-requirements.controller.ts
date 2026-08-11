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
import { MaterialRequirementsService } from './material-requirements.service';
import {
  CreateMaterialRequirementDto,
  UpdateMaterialRequirementDto,
} from './dto/material-requirement.dto';

@Controller('material-requirements')
export class MaterialRequirementsController {
  constructor(private readonly service: MaterialRequirementsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaterialRequirementDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialRequirementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
