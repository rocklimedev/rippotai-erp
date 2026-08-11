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
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { RejectEstimateDto } from './dto/reject-estimate.dto';
import { EstimateStatus } from '@/common/enums/estimate.enums';

@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  create(@Body() dto: CreateEstimateDto) {
    // Replace with the authenticated user id, e.g. @Req() req -> req.user.id
    return this.estimatesService.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('tradeTeamId') tradeTeamId?: string,
    @Query('status') status?: EstimateStatus,
  ) {
    return this.estimatesService.findAll({
      projectId,
      vendorId,
      tradeTeamId,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstimateDto,
  ) {
    return this.estimatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatesService.remove(id);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatesService.submit(id);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.estimatesService.approve(id);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectEstimateDto,
  ) {
    return this.estimatesService.reject(id, dto);
  }
}
