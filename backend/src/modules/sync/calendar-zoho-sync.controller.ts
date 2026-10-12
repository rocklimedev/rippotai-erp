import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { ReminderSyncService } from './reminder-sync.service';
import { LocalZohoSyncService } from './local-zoho-sync.service';
import { ReminderSettingsDto } from './dto/reminder-settings.dto';
import { SyncOptionsDto } from './dto/sync-options.dto';
import { ReconcileReminderDto } from './dto/reconcile-reminder.dto';

@Controller('calendar/zoho-sync')
@UseGuards(JwtAuthGuard)
export class CalendarZohoSyncController {
  constructor(private readonly local: LocalZohoSyncService, private readonly reminders: ReminderSyncService) {}

  @RequirePermission('calendar-events:read')
  @Get('status')
  status(@CurrentUser() user: any) { return this.local.status(user.id, 'calendar'); }

  @RequirePermission('calendar-events:update')
  @Get('authorize')
  authorize(@CurrentUser() user: any) { return this.local.authorize(user.id, 'calendar'); }

  @RequirePermission('calendar-events:read')
  @Get('destinations')
  destinations(@CurrentUser() user: any) { return this.reminders.calendarDestinations(user.id); }

  @RequirePermission('calendar-events:update')
  @Put('settings')
  save(@CurrentUser() user: any, @Body() dto: ReminderSettingsDto) {
    return this.local.save(user.id, 'calendar', dto);
  }

  @RequirePermission('calendar-events:update')
  @Post('push')
  @HttpCode(200)
  push(@CurrentUser() user: any, @Body() dto: SyncOptionsDto) {
    return this.reminders.sync(user.id, 'calendar', dto);
  }

  @RequirePermission('calendar-events:update')
  @Post('reconcile/:localId')
  @HttpCode(200)
  reconcile(@CurrentUser() user: any, @Param('localId', ParseUUIDPipe) localId: string, @Body() dto: ReconcileReminderDto) {
    return this.reminders.reconcile(user.id, 'calendar', localId, dto.remote_id);
  }
}
