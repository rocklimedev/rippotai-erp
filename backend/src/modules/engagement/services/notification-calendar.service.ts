import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { CalendarEvent } from '@/modules/calendar/models/calender-event.model';
@Injectable()
export class NotificationForCalendarService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyCalendarEventCreated(
    event: CalendarEvent,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CALENDAR_EVENT_CREATED,
      title: 'Calendar Event Created',
      message: `Event "${event.title}" has been scheduled for ${this.formatDate(event.starts_at)}.`,
    });
  }

  async notifyCalendarEventUpdated(
    event: CalendarEvent,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CALENDAR_EVENT_UPDATED,
      title: 'Calendar Event Updated',
      message: `Event "${event.title}" has been updated.`,
    });
  }

  async notifyCalendarEventDeleted(
    title: string,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.CALENDAR_EVENT_DELETED,
      title: 'Calendar Event Deleted',
      message: `Event "${title}" has been deleted.`,
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
