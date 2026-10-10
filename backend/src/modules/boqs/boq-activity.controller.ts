import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { BoqActivityService } from './boq-activity.service';
import { QueryActivityDto } from './dto/query-activity.dto';

@UseGuards(JwtAuthGuard)
@Controller('boq/activity')
export class BoqActivityController {
  constructor(private readonly activityService: BoqActivityService) {}

  @RequirePermission('boq-activity:read')
  @Get()
  findAll(@Query() query: QueryActivityDto) {
    return this.activityService.findAll(query);
  }
}
