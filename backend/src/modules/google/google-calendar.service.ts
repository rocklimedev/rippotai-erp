// google/services/google-calendar.service.ts

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { GoogleAuthService } from '../auth/google-auth.service';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEventInput {
  summary: string;

  description?: string;

  location?: string;

  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  attendees?: {
    email: string;
    displayName?: string;
    optional?: boolean;
  }[];

  reminders?: {
    useDefault?: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };

  recurrence?: string[];

  colorId?: string;

  visibility?: 'default' | 'public' | 'private';

  status?: 'confirmed' | 'tentative' | 'cancelled';
}

@Injectable()
export class GoogleCalendarService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  /**
   * Get events from THIS user's Google Calendar.
   *
   * calendarId defaults to "primary", which means:
   *
   * the primary calendar belonging to the
   * currently authenticated Google account.
   */
  async listEvents(
    userId: string,
    opts: {
      timeMin?: string;
      timeMax?: string;
      calendarId?: string;
      maxResults?: number;
      pageToken?: string;
    } = {},
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    const calendarId = opts.calendarId ?? 'primary';

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (opts.timeMin) {
      params.set('timeMin', opts.timeMin);
    }

    if (opts.timeMax) {
      params.set('timeMax', opts.timeMax);
    }

    if (opts.maxResults) {
      params.set('maxResults', String(opts.maxResults));
    }

    if (opts.pageToken) {
      params.set('pageToken', opts.pageToken);
    }

    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    );
  }

  /**
   * Get THIS user's calendars.
   *
   * This is important because a personal Google account
   * can have multiple calendars.
   */
  async listCalendars(userId: string) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(accessToken, '/users/me/calendarList');
  }

  /**
   * Get one calendar.
   */
  async getCalendar(userId: string, calendarId = 'primary') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}`,
    );
  }

  /**
   * Create event in THIS user's calendar.
   */
  async createEvent(
    userId: string,
    event: CalendarEventInput,
    calendarId = 'primary',
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      },
    );
  }

  /**
   * Update event belonging to THIS user's calendar.
   */
  async updateEvent(
    userId: string,
    eventId: string,
    event: Partial<CalendarEventInput>,
    calendarId = 'primary',
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(event),
      },
    );
  }

  /**
   * Delete event.
   */
  async deleteEvent(userId: string, eventId: string, calendarId = 'primary') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);

    await this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
      },
      true,
    );
  }

  private async request(
    accessToken: string,
    path: string,
    init: RequestInit = {},
    noContent = false,
  ) {
    const res = await fetch(`${CALENDAR_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();

      if (res.status === 401) {
        throw new UnauthorizedException(
          'Google Calendar authorization has expired or is invalid.',
        );
      }

      throw new InternalServerErrorException(
        `Google Calendar API error: ${errorText}`,
      );
    }

    if (noContent) {
      return undefined;
    }

    return res.json();
  }
}
