import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { randomUUID } from 'crypto';
import { Task } from '../tasks/models/task.model';
import { CalendarEvent } from '../calendar/models/calender-event.model';
import { ZohoTasksService } from '../zoho/tasks/zoho-tasks.service';
import { ZohoCalendarService } from '../zoho/calendar/zoho-calendar.service';
import {
  ReminderKind,
  ReminderSyncRecord,
  ReminderSyncSettings,
} from './models/reminder-sync.model';
import { ReminderSettingsDto } from './dto/reminder-settings.dto';
import { SyncOptionsDto } from './dto/sync-options.dto';
import {
  calendarPayload,
  fingerprint,
  remoteId,
  taskPayload,
} from './reminder-payload';

@Injectable()
export class ReminderSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSyncService.name);
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;
  constructor(
    @InjectModel(Task) private readonly tasks: typeof Task,
    @InjectModel(CalendarEvent) private readonly events: typeof CalendarEvent,
    @InjectModel(ReminderSyncSettings)
    private readonly settings: typeof ReminderSyncSettings,
    @InjectModel(ReminderSyncRecord)
    private readonly records: typeof ReminderSyncRecord,
    private readonly zohoTasks: ZohoTasksService,
    private readonly zohoCalendar: ZohoCalendarService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.poll(), 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll() {
    if (this.polling) return;
    this.polling = true;
    try {
      const configs = await this.settings.findAll({ where: { enabled: true } });
      for (const config of configs) {
        try {
          await this.sync(config.user_id, config.kind);
        } catch (error) {
          if (!(error instanceof ConflictException))
            this.logger.warn(this.message(error));
        }
      }
    } catch (error) {
      this.logger.warn(this.message(error));
    } finally {
      this.polling = false;
    }
  }

  private message(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
  private scope(userId: string, kind: ReminderKind) {
    return kind === 'tasks'
      ? {
          [Op.or]: [
            { assigned_to: userId },
            { created_by: userId, assigned_to: null },
          ],
        }
      : { created_by: userId };
  }
  private async localRecords(userId: string, kind: ReminderKind) {
    const where = this.scope(userId, kind);
    return kind === 'tasks'
      ? this.tasks.findAll({ where: { ...where, due_date: { [Op.ne]: null } } })
      : this.events.findAll({ where });
  }
  private payload(row: any, kind: ReminderKind, config: Record<string, any>) {
    return kind === 'tasks'
      ? taskPayload(row, config)
      : calendarPayload(row, config);
  }

  async getSettings(userId: string, kind: ReminderKind) {
    const row = await this.settings.findOne({
      where: { user_id: userId, kind },
    });
    return {
      enabled: row?.enabled ?? false,
      ...(row?.config ?? {}),
      last_run: row?.last_run ?? null,
      last_error: row?.last_error ?? null,
    };
  }

  private destinationList(response: any, key: string) {
    const data = response?.data ?? response;
    const items = Array.isArray(data) ? data : data?.[key];
    if (!Array.isArray(items))
      throw new BadRequestException(`Could not load Zoho ${key}. Reconnect Zoho reminders and try again.`);
    return items.filter((item) => item?.id_string || item?.id).map((item) => ({
      id: String(item.id_string || item.id),
      name: item.name || String(item.id_string || item.id),
    }));
  }

  async taskPortals(userId: string) {
    return this.destinationList(await this.zohoTasks.listPortals(userId), 'portals');
  }

  async taskProjects(userId: string, portalId: string) {
    const projects: { id: string; name: string }[] = [];
    const limit = 100;
    for (let index = 1; ; index += limit) {
      const page = this.destinationList(await this.zohoTasks.listProjects(userId, portalId, { index, range: limit }), 'projects');
      if (page.some((item) => projects.some((project) => project.id === item.id)))
        throw new BadRequestException('Could not load all Zoho projects. Try again later.');
      projects.push(...page);
      if (page.length < limit) return projects;
    }
  }

  async calendarDestinations(userId: string) {
    const response = await this.zohoCalendar.listCalendars(userId, 'own', true);
    const data = response?.data ?? response;
    const calendars = Array.isArray(data) ? data : data?.calendars;
    if (!Array.isArray(calendars))
      throw new BadRequestException(
        'Could not load Zoho calendars. Reconnect Zoho reminders and try again.',
      );
    return calendars
      .filter((calendar) => typeof calendar?.uid === 'string' && calendar.uid)
      .map((calendar) => ({
        uid: calendar.uid,
        name: calendar.name || calendar.uid,
      }));
  }

  private async validateCalendarDestination(
    userId: string,
    calendarId: string,
  ) {
    const calendars = await this.calendarDestinations(userId);
    if (!calendars.some((calendar) => calendar.uid === calendarId)) {
      throw new BadRequestException(
        'Saved calendar was not found in your connected Zoho account. Choose a calendar from Reminder settings and save it before retrying.',
      );
    }
  }

  private validate(kind: ReminderKind, config: Record<string, any>) {
    const required =
      kind === 'tasks'
        ? ['portal_id', 'project_id', 'assignee_id']
        : ['calendar_id'];
    for (const key of required)
      if (!config[key]?.trim() || config[key] === 'default')
        throw new BadRequestException(`${key} is required for Zoho reminders`);
    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: config.timezone || 'Asia/Kolkata',
      }).format();
    } catch {
      throw new BadRequestException('Invalid reminder timezone');
    }
  }

  private async claim(row: ReminderSyncSettings) {
    const token = randomUUID();
    const [count] = await this.settings.update(
      { lock_token: token, lock_until: new Date(Date.now() + 120000) },
      {
        where: {
          id: row.id,
          [Op.or]: [
            { lock_until: null },
            { lock_until: { [Op.lt]: new Date() } },
          ],
        },
      },
    );
    if (!count)
      throw new ConflictException(
        'Reminder sync is already running. Try again shortly.',
      );
    return token;
  }
  private async release(id: string, token: string) {
    await this.settings.update(
      { lock_token: null, lock_until: null },
      { where: { id, lock_token: token } },
    );
  }

  private async renew(id: string, token: string) {
    const now = new Date();
    const where = { id, lock_token: token, lock_until: { [Op.gt]: now } };
    const [changed] = await this.settings.update(
      { lock_until: new Date(now.getTime() + 120000) },
      { where },
    );
    // MySQL DATETIME stores whole seconds. A renewal in the same second can
    // report zero changed rows even though this run still owns a valid lease.
    if (!changed && !(await this.settings.findOne({ where }))) {
      throw new ConflictException('Sync lease expired. Retry shortly.');
    }
  }

  async saveSettings(
    userId: string,
    kind: ReminderKind,
    dto: ReminderSettingsDto,
  ) {
    const { enabled, ...config } = dto;
    if (enabled) this.validate(kind, config);
    const [row] = await this.settings.findOrCreate({
      where: { user_id: userId, kind },
      defaults: { config: {}, enabled: false },
    });
    const token = await this.claim(row);
    try {
      if (kind === 'calendar' && config.calendar_id)
        await this.validateCalendarDestination(userId, config.calendar_id);
      // Keep existing remote destinations stable: retargeting must not orphan old reminders.
      const mappings = await this.records.count({
        where: {
          user_id: userId,
          kind,
          [Op.or]: [{ remote_id: { [Op.ne]: null } }, { status: 'uncertain' }],
        },
      });
      const targetKeys =
        kind === 'tasks' ? ['portal_id', 'project_id'] : ['calendar_id'];
      if (mappings && targetKeys.some((key) => config[key] !== row.config[key]))
        throw new BadRequestException(
          'Destination cannot change while mirrored records exist. Disable sync to pause reminders.',
        );
      await row.update({ enabled, config, last_error: null });
      // Definitively rejected creates have no remote reminder to orphan.
      // Keep them retryable, but point them at the corrected destination.
      await this.records.update(
        { destination: config, fingerprint: null },
        {
          where: {
            user_id: userId,
            kind,
            remote_id: null,
            status: { [Op.ne]: 'uncertain' },
          },
        },
      );
    } finally {
      await this.release(row.id, token);
    }
    return this.getSettings(userId, kind);
  }

  async status(userId: string, kind: ReminderKind) {
    const settings = await this.getSettings(userId, kind);
    const mappings = await this.records.findAll({
      where: { user_id: userId, kind },
    });
    const local = await this.localRecords(userId, kind);
    let pending = 0;
    for (const row of local) {
      const mapping = mappings.find((m) => m.local_id === row.id);
      if (mapping && ['failed', 'uncertain'].includes(mapping.status)) continue;
      try {
        if (
          !mapping ||
          mapping.fingerprint !==
            fingerprint(this.payload(row, kind, settings)) ||
          mapping.status === 'pending'
        )
          pending++;
      } catch {
        pending++;
      }
    }
    pending += mappings.filter(
      (m) =>
        !['failed', 'uncertain'].includes(m.status) &&
        !local.some((row) => row.id === m.local_id),
    ).length;
    return {
      settings,
      total: local.length,
      synced: mappings.filter((m) => m.status === 'synced').length,
      pending,
      failed: mappings.filter((m) => m.status === 'failed').length,
      uncertain: mappings.filter((m) => m.status === 'uncertain').length,
      errors: mappings
        .filter((m) => m.error)
        .map((m) => ({
          local_id: m.local_id,
          message: m.error,
          status: m.status,
        })),
      last_sync: settings.last_run,
      direction: 'local_to_zoho',
    };
  }

  async sync(userId: string, kind: ReminderKind, options: SyncOptionsDto = {}) {
    if (options.pull_only)
      throw new BadRequestException(
        'Local database owns reminder data. Pull sync is disabled.',
      );
    const settings = await this.settings.findOne({
      where: { user_id: userId, kind },
    });
    if (!settings)
      throw new BadRequestException(
        'Save your Zoho reminder destination first.',
      );
    this.validate(kind, settings.config);
    const token = await this.claim(settings);
    const result = {
      success: true,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      failed: 0,
      uncertain: 0,
    };
    try {
      if (kind === 'calendar')
        await this.validateCalendarDestination(
          userId,
          settings.config.calendar_id,
        );
      const rows = await this.localRecords(userId, kind);
      const mappings = await this.records.findAll({
        where: { user_id: userId, kind },
      });
      const ids = new Set(rows.map((row) => row.id));
      const work = [
        ...rows.map((row) => ({
          row,
          mapping: mappings.find((m) => m.local_id === row.id),
          id: row.id,
        })),
        ...mappings
          .filter((m) => !ids.has(m.local_id))
          .map((mapping) => ({
            row: undefined,
            mapping,
            id: mapping.local_id,
          })),
      ];
      for (const item of work) {
        if (options.entity_id && item.id !== options.entity_id) continue;
        if (options.retry_failed && item.mapping?.status !== 'failed') continue;
        await this.renew(settings.id, token);
        let mapping = item.mapping;
        if (mapping?.status === 'uncertain') {
          result.uncertain++;
          continue;
        }
        let creating = false;
        try {
          if (!item.row) {
            if (mapping!.remote_id) await this.remove(userId, kind, mapping!);
            await mapping!.destroy();
            result.deleted++;
            continue;
          }
          const payload = this.payload(item.row, kind, settings.config);
          const hash = fingerprint(payload);
          if (
            !options.force_full_sync &&
            mapping?.status === 'synced' &&
            mapping.fingerprint === hash
          ) {
            result.skipped++;
            continue;
          }
          if (!mapping)
            mapping = await this.records.create({
              user_id: userId,
              kind,
              local_id: item.id,
              destination: settings.config,
              status: 'pending',
            });
          if (mapping.remote_id) {
            await this.update(userId, kind, mapping, payload);
            result.updated++;
          } else {
            await mapping.update({ destination: settings.config });
            // Persist uncertainty before HTTP so process death never blindly creates a duplicate.
            await mapping.update({
              status: 'uncertain',
              error:
                'Creation may have reached Zoho. Inspect the destination and reconcile this record before retrying.',
            });
            creating = true;
            const response =
              kind === 'tasks'
                ? await this.zohoTasks.createTask(
                    userId,
                    mapping.destination.portal_id,
                    mapping.destination.project_id,
                    payload as any,
                  )
                : await this.zohoCalendar.createEvent(
                    userId,
                    mapping.destination.calendar_id,
                    payload as any,
                  );
            await mapping.update({ remote_id: remoteId(response, kind) });
            creating = false;
            result.created++;
          }
          await mapping.update({
            fingerprint: hash,
            status: 'synced',
            error: null,
            synced_at: new Date(),
          });
        } catch (error) {
          // A definitive 4xx means creation was rejected; transport/5xx outcomes are ambiguous.
          const statusCode = (error as any)?.getStatus?.();
          if (!creating && mapping?.remote_id && statusCode === 404) {
            // Confirmed absence can be recreated on the next run without duplicating a remote reminder.
            await mapping.update({ remote_id: null, fingerprint: null });
          }
          const uncertain =
            creating && !(statusCode >= 400 && statusCode < 500);
          if (!mapping && item.row)
            mapping = await this.records.create({
              user_id: userId,
              kind,
              local_id: item.id,
              destination: settings.config,
            });
          await mapping?.update({
            status: uncertain ? 'uncertain' : 'failed',
            error: this.message(error),
          });
          if (uncertain) result.uncertain++;
          else result.failed++;
        }
      }
      result.success = result.failed === 0 && result.uncertain === 0;
      await settings.update({
        last_run: new Date(),
        last_error: result.success
          ? null
          : `${result.failed} failed; ${result.uncertain} need reconciliation`,
      });
      return result;
    } catch (error) {
      await settings.update({ last_error: this.message(error) });
      throw error;
    } finally {
      await this.release(settings.id, token);
    }
  }

  private update(
    userId: string,
    kind: ReminderKind,
    record: ReminderSyncRecord,
    payload: any,
  ) {
    const d = record.destination;
    return kind === 'tasks'
      ? this.zohoTasks.updateTask(
          userId,
          d.portal_id,
          d.project_id,
          record.remote_id!,
          payload,
        )
      : this.zohoCalendar.updateEvent(
          userId,
          d.calendar_id,
          record.remote_id!,
          payload,
        );
  }
  private async remove(
    userId: string,
    kind: ReminderKind,
    record: ReminderSyncRecord,
  ) {
    const d = record.destination;
    try {
      if (kind === 'tasks')
        await this.zohoTasks.deleteTask(
          userId,
          d.portal_id,
          d.project_id,
          record.remote_id!,
        );
      else
        await this.zohoCalendar.deleteEvent(
          userId,
          d.calendar_id,
          record.remote_id!,
        );
    } catch (error) {
      if ((error as any)?.getStatus?.() !== 404) throw error;
    }
  }

  async reconcile(
    userId: string,
    kind: ReminderKind,
    localId: string,
    remote: string,
  ) {
    const settings = await this.settings.findOne({
      where: { user_id: userId, kind },
    });
    if (!settings) throw new BadRequestException('No sync settings');
    const token = await this.claim(settings);
    try {
      const record = await this.records.findOne({
        where: {
          user_id: userId,
          kind,
          local_id: localId,
          status: 'uncertain',
        },
      });
      if (!record)
        throw new BadRequestException('No uncertain reminder to reconcile');
      const d = record.destination;
      if (kind === 'tasks')
        await this.zohoTasks.getTask(userId, d.portal_id, d.project_id, remote);
      else await this.zohoCalendar.getEvent(userId, d.calendar_id, remote);
      await record.update({
        remote_id: remote,
        status: 'pending',
        error: null,
      });
      return { success: true };
    } finally {
      await this.release(settings.id, token);
    }
  }
}
