import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @RequirePermission('units:create')
  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @RequirePermission('units:read')
  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @RequirePermission('units:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @RequirePermission('units:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @RequirePermission('units:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}
