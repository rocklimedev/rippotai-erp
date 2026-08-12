import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SnagListsService } from './snag-lists.service';
import { CreateSnagListDto } from './dto/create-snag-list.dto';
import { UpdateSnagListDto } from './dto/update-snag-list.dto';

@Controller('snag-lists')
export class SnagListsController {
  constructor(private readonly snagListsService: SnagListsService) {}

  @Post()
  create(@Body() dto: CreateSnagListDto) {
    return this.snagListsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.snagListsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagListsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSnagListDto,
  ) {
    return this.snagListsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.snagListsService.remove(id);
  }
}
