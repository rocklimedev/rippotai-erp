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
import { SiteMockupsService } from './site-mockups.service';
import { CreateSiteMockupDto } from './dto/create-site-mockup.dto';
import { UpdateSiteMockupDto } from './dto/update-site-mockup.dto';

@Controller('qc/site-mockups')
export class SiteMockupsController {
  constructor(private readonly siteMockupsService: SiteMockupsService) {}

  @Post()
  create(@Body() dto: CreateSiteMockupDto) {
    return this.siteMockupsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.siteMockupsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.siteMockupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteMockupDto,
  ) {
    return this.siteMockupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.siteMockupsService.remove(id);
  }
}
