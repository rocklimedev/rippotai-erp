import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { ReminderSyncService } from './reminder-sync.service';
import { LocalZohoSyncService } from './local-zoho-sync.service';
import { ReminderSettingsDto } from './dto/reminder-settings.dto';
import { SyncOptionsDto } from './dto/sync-options.dto';
import { ReconcileReminderDto } from './dto/reconcile-reminder.dto';

@Controller('tasks/zoho-sync')
@UseGuards(JwtAuthGuard)
export class TaskZohoSyncController {
  constructor(private readonly local: LocalZohoSyncService, private readonly reminders: ReminderSyncService) {}

  @RequirePermission('tasks:read')
  @Get('status')
  status(@CurrentUser() user: any) { return this.local.status(user.id, 'tasks'); }

  @RequirePermission('tasks:update')
  @Get('authorize')
  authorize(@CurrentUser() user: any) { return this.local.authorize(user.id, 'tasks'); }

  @RequirePermission('tasks:read')
  @Get('portals')
  portals(@CurrentUser() user: any) { return this.reminders.taskPortals(user.id); }

  @RequirePermission('tasks:read')
  @Get('portals/:portalId/projects')
  projects(@CurrentUser() user: any, @Param('portalId') portalId: string) {
    return this.reminders.taskProjects(user.id, portalId);
  }

  @RequirePermission('tasks:read')
  @Get('portals/:portalId/projects/:projectId/users')
  users(@CurrentUser() user: any, @Param('portalId') portalId: string, @Param('projectId') projectId: string) {
    return this.reminders.taskUsers(user.id, portalId, projectId);
  }

  @RequirePermission('tasks:update')
  @Put('settings')
  save(@CurrentUser() user: any, @Body() dto: ReminderSettingsDto) {
    return this.local.save(user.id, 'tasks', dto);
  }

  @RequirePermission('tasks:update')
  @Post('push')
  @HttpCode(200)
  push(@CurrentUser() user: any, @Body() dto: SyncOptionsDto) {
    return this.reminders.sync(user.id, 'tasks', dto);
  }

  @RequirePermission('tasks:update')
  @Post('reconcile/:localId')
  @HttpCode(200)
  reconcile(@CurrentUser() user: any, @Param('localId', ParseUUIDPipe) localId: string, @Body() dto: ReconcileReminderDto) {
    return this.reminders.reconcile(user.id, 'tasks', localId, dto.remote_id);
  }
}
