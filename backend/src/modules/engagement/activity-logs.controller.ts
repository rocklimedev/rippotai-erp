import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/activity-log.dto';
import { ActivityAction } from '../../common/enums';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @RequirePermission('activity-logs:create')
  @Post()
  log(@Body() dto: CreateActivityLogDto) {
    return this.activityLogsService.log(dto);
  }

  @RequirePermission('activity-logs:read')
  @Get()
  findAll(
    @Query('user_id') user_id?: string,
    @Query('action') action?: ActivityAction,
    @Query('entity_type') entity_type?: string,
    @Query('entity_id') entity_id?: string,
  ) {
    return this.activityLogsService.findAll({
      user_id,
      action,
      entity_type,
      entity_id,
    });
  }
  @RequirePermission('activity-logs:read')
  @Get('entity-label')
  async getByEntityLabel(@Query('entityLabel') entityLabel: string) {
    return this.activityLogsService.getActivityLogsByEntityLabel(entityLabel);
  }
}
