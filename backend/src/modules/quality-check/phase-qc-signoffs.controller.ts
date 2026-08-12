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
import { PhaseQcSignoffsService } from './phase-qc-signoffs.service';
import { CreatePhaseQcSignoffDto } from './dto/create-phase-qc-signoff.dto';
import { UpdatePhaseQcSignoffDto } from './dto/update-phase-qc-signoff.dto';

@Controller('phase-qc-signoffs')
export class PhaseQcSignoffsController {
  constructor(
    private readonly phaseQcSignoffsService: PhaseQcSignoffsService,
  ) {}

  @Post()
  create(@Body() dto: CreatePhaseQcSignoffDto) {
    return this.phaseQcSignoffsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.phaseQcSignoffsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.phaseQcSignoffsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePhaseQcSignoffDto,
  ) {
    return this.phaseQcSignoffsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.phaseQcSignoffsService.remove(id);
  }
}
