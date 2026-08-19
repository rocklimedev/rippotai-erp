import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MaterialRequirementService } from '../services/material-requirement.service';
import { CreateMaterialRequirementDto } from '../dto/create-material-requirement.dto';
import { UpdateMaterialRequirementDto } from '../dto/update-material-requirement.dto';

/** 1. Material requirements — captured directly from the design team. */
@Controller('procurement/requirements')
export class MaterialRequirementController {
  constructor(private readonly service: MaterialRequirementService) {}

  @Post()
  create(@Body() dto: CreateMaterialRequirementDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
