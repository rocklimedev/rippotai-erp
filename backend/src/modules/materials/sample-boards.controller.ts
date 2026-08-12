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
import { SampleBoardsService } from './sample-boards.service';
import {
  CreateSampleBoardDto,
  UpdateSampleBoardDto,
} from './dto/sample-board.dto';

@Controller('sample-boards')
export class SampleBoardsController {
  constructor(private readonly service: SampleBoardsService) {}

  @Get()
  findAll(@Query('materialRequirementId') materialRequirementId?: string) {
    return this.service.findAll(materialRequirementId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSampleBoardDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSampleBoardDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
