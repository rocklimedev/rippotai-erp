import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ContractorLineupService } from './contractor-lineup.service';
import { CreateContractorLineupDto } from './dto/create-contractor-lineup.dto';
import { UpdateContractorLineupDto } from './dto/update-contractor-lineup.dto';
import { UpdateLineupStatusDto } from './dto/update-lineup-status.dto';
import { ContractorLineupStatus } from '@/common/enums/estimate.enums';

@Controller('contractor-lineup')
export class ContractorLineupController {
  constructor(private readonly service: ContractorLineupService) {}

  @Post()
  create(@Body() dto: CreateContractorLineupDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: ContractorLineupStatus,
  ) {
    return this.service.findAll({ projectId, vendorId, status });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractorLineupDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/mobilise')
  mobilise(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLineupStatusDto,
  ) {
    return this.service.mobilise(id, dto);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLineupStatusDto,
  ) {
    return this.service.complete(id, dto);
  }

  @Post(':id/release')
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLineupStatusDto,
  ) {
    return this.service.release(id, dto);
  }
}
