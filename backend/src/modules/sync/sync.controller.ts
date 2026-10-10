import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { ReminderSyncService } from './reminder-sync.service';
import { ReminderKind } from './models/reminder-sync.model';
import { ReminderSettingsDto } from './dto/reminder-settings.dto';
import { SyncOptionsDto } from './dto/sync-options.dto';
class ReconcileReminderDto {
  @IsString() @MaxLength(255) remote_id: string;
}
@Controller('sync')
@ApiTags('Zoho reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly reminders: ReminderSyncService) {}
  @RequirePermission('sync:read')
  @Get('tasks/portals')
  taskPortals(@CurrentUser() user: any) {
    return this.reminders.taskPortals(user.id);
  }
  @RequirePermission('sync:read')
  @Get('tasks/portals/:portalId/projects')
  taskProjects(@CurrentUser() user: any, @Param('portalId') portalId: string) {
    return this.reminders.taskProjects(user.id, portalId);
  }
  @RequirePermission('sync:read')
  @Get('calendar/destinations')
  calendarDestinations(@CurrentUser() user: any) {
    return this.reminders.calendarDestinations(user.id);
  }
  private kind(value: string): ReminderKind {
    if (value !== 'tasks' && value !== 'calendar')
      throw new BadRequestException('Expected tasks or calendar');
    return value;
  }
  @RequirePermission('sync:read')
  @Get(':kind/settings')
  settings(@CurrentUser() user: any, @Param('kind') kind: string) {
    return this.reminders.getSettings(user.id, this.kind(kind));
  }
  @RequirePermission('sync:update')
  @Put(':kind/settings')
  save(
    @CurrentUser() user: any,
    @Param('kind') kind: string,
    @Body() body: ReminderSettingsDto,
  ) {
    return this.reminders.saveSettings(user.id, this.kind(kind), body);
  }
  @RequirePermission('sync:read')
  @Get(':kind/status')
  status(@CurrentUser() user: any, @Param('kind') kind: string) {
    return this.reminders.status(user.id, this.kind(kind));
  }
  @RequirePermission('sync:sync')
  @Post(':kind/push')
  @HttpCode(200)
  push(
    @CurrentUser() user: any,
    @Param('kind') kind: string,
    @Body() body: SyncOptionsDto,
  ) {
    return this.reminders.sync(user.id, this.kind(kind), body);
  }
  @RequirePermission('sync:sync')
  @Post(':kind/full')
  @HttpCode(200)
  full(
    @CurrentUser() user: any,
    @Param('kind') kind: string,
    @Body() body: SyncOptionsDto,
  ) {
    return this.push(user, kind, body);
  }
  @RequirePermission('sync:sync')
  @Post(':kind/pull')
  pull() {
    throw new BadRequestException(
      'Local database owns reminder data. Pull sync is disabled.',
    );
  }
  @RequirePermission('sync:sync')
  @Post(':kind/reconcile/:localId')
  @HttpCode(200)
  reconcile(
    @CurrentUser() user: any,
    @Param('kind') kind: string,
    @Param('localId') localId: string,
    @Body() body: ReconcileReminderDto,
  ) {
    return this.reminders.reconcile(
      user.id,
      this.kind(kind),
      localId,
      body.remote_id,
    );
  }
  @RequirePermission('sync:read')
  @Get('status')
  async allStatus(@CurrentUser() user: any) {
    const [tasks, calendar] = await Promise.all([
      this.reminders.status(user.id, 'tasks'),
      this.reminders.status(user.id, 'calendar'),
    ]);
    return { tasks, calendar };
  }
  @RequirePermission('sync:sync')
  @Post('full')
  @HttpCode(200)
  async allSync(@CurrentUser() user: any, @Body() body: SyncOptionsDto) {
    const kinds: ReminderKind[] = ['tasks', 'calendar'];

    const results = await Promise.allSettled(
      kinds.map((kind) => this.reminders.sync(user.id, kind, body)),
    );

    const unwrap = (result: PromiseSettledResult<any>) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            success: false,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          };

    return {
      success: results.every(
        (r) => r.status === 'fulfilled' && r.value.success,
      ),
      tasks: unwrap(results[0]),
      calendar: unwrap(results[1]),
    };
  }
}
