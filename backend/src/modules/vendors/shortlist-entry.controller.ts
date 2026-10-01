import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShortlistEntryService } from './shortlist-entry.service';
import { CreateShortlistEntryDto } from './dto/create-shortlist-entry.dto';
import { UpdateShortlistEntryDto } from './dto/update-shortlist-entry.dto';
import { BulkCreateShortlistEntriesDto } from './dto/bulk-create-shortlist-entries.dto';
import { QueryShortlistEntryDto } from './dto/query-shortlist.dto';

@Controller('shortlist-entries')
export class ShortlistEntryController {
  constructor(private readonly service: ShortlistEntryService) {}

  /**
   * POST /shortlist-entries
   */
  @Post()
  async create(@Body() dto: CreateShortlistEntryDto) {
    return this.service.create(dto);
  }

  /**
   * POST /shortlist-entries/bulk
   */
  @Post('bulk')
  async bulkCreate(@Body() dto: BulkCreateShortlistEntriesDto) {
    return this.service.bulkCreate(dto);
  }

  /**
   * GET /shortlist-entries?...
   */
  @Get()
  async findAll(@Query() query: QueryShortlistEntryDto) {
    return this.service.findAll(query);
  }

  /**
   * GET /shortlist-entries/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * PUT /shortlist-entries/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShortlistEntryDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * POST /shortlist-entries/:id/select
   * Mark this entry as the selected one for its trade
   */
  @Post(':id/select')
  async select(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.selectEntry(id);
  }

  /**
   * DELETE /shortlist-entries/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
