import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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

  @RequirePermission('material-procurement:create')
  @Post()
  async create(@Body() dto: CreateMaterialProcurementDto, @Req() req: Request) {
    const userId = (req as any).user?.id ?? undefined;

    return this.materialProcurementService.create(dto, userId);
  }

  @RequirePermission('material-procurement:read')
  @Get()
  async findAll(@Query('projectId') projectId?: string) {
    return this.materialProcurementService.findAll(projectId);
  }

  @RequirePermission('material-procurement:read')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialProcurementService.findOne(id);
  }

  @RequirePermission('material-procurement:update')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialProcurementDto,
  ) {
    return this.materialProcurementService.update(id, dto);
  }

  @RequirePermission('material-procurement:submit')
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.materialProcurementService.submit(id);
  }

  @RequirePermission('material-procurement:delete')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.materialProcurementService.remove(id);
  }
}
