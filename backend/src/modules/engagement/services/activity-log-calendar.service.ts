import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { CalendarEvent } from '@/modules/calendar/models/calender-event.model';
@Injectable()
export class ActivityLogForCalendarService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logCalendarEventCreated(
    event: CalendarEvent,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CALENDAR_EVENT_CREATED,
      entity_type: 'CalendarEvent',
      entity_id: event.id,
      entity_label: event.title,
      changes: {
        project_id: event.project_id,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        attendees: event.attendees,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logCalendarEventUpdated(
    event: CalendarEvent,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CALENDAR_EVENT_UPDATED,
      entity_type: 'CalendarEvent',
      entity_id: event.id,
      entity_label: event.title,
      changes: {
        title: event.title,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logCalendarEventDeleted(
    eventTitle: string,
    eventId: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CALENDAR_EVENT_DELETED,
      entity_type: 'CalendarEvent',
      entity_id: eventId,
      entity_label: eventTitle,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
