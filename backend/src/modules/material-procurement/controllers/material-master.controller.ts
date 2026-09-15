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

import { MaterialMasterService } from '../services/material-master.service';
import {
  CreateMaterialMasterDto,
  UpdateMaterialMasterDto,
} from '../dto/material-master.dto';

@Controller('materials')
export class MaterialMasterController {
  constructor(private readonly materialService: MaterialMasterService) {}

  @Post()
  create(@Body() dto: CreateMaterialMasterDto, @Req() req: any) {
    return this.materialService.create(dto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.materialService.findAll({
      search,
      category,
      is_active: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialMasterDto,
    @Req() req: any,
  ) {
    return this.materialService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.materialService.deactivate(id, req.user?.id);
  }
}
