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
import { MaterialRateSheetsService } from './material-rate-sheets.service';
import {
  CreateMaterialRateSheetDto,
  UpdateMaterialRateSheetDto,
} from './dto/material-rate-sheet.dto';

@Controller('material/rate-sheets')
export class MaterialRateSheetsController {
  constructor(private readonly service: MaterialRateSheetsService) {}

  @Get()
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.findAll(vendorId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaterialRateSheetDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialRateSheetDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
