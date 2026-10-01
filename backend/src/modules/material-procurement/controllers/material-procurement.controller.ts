import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import { MaterialProcurementService } from '../services/material-procurement.service';

import { CreateMaterialProcurementDto } from '../dto/create-material-procurement.dto';

import { UpdateMaterialProcurementDto } from '../dto/update-material-procurement.dto';

@Controller('material-procurement')
export class MaterialProcurementController {
  constructor(
    private readonly materialProcurementService: MaterialProcurementService,
  ) {}

  @Post()
  async create(@Body() dto: CreateMaterialProcurementDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;

    return this.materialProcurementService.create(dto, userId);
  }

  @Get()
  async findAll(@Query('projectId') projectId?: string) {
    return this.materialProcurementService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialProcurementService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialProcurementDto,
  ) {
    return this.materialProcurementService.update(id, dto);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.materialProcurementService.submit(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.materialProcurementService.remove(id);
  }
}
