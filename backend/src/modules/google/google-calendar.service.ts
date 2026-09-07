// google/services/google-calendar.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleAuthService } from '../auth/google-auth.service';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string }; // ISO 8601
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

@Injectable()
export class GoogleCalendarService {
  constructor(private readonly googleAuth: GoogleAuthService) {}

  async listEvents(
    userId: string,
    opts: { timeMin?: string; timeMax?: string; calendarId?: string } = {},
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    const calendarId = opts.calendarId ?? 'primary';
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      ...(opts.timeMin ? { timeMin: opts.timeMin } : {}),
      ...(opts.timeMax ? { timeMax: opts.timeMax } : {}),
    });

    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    );
  }

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

  async updateEvent(
    userId: string,
    eventId: string,
    event: Partial<CalendarEventInput>,
    calendarId = 'primary',
  ) {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    return this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: 'PATCH', body: JSON.stringify(event) },
    );
  }

  async deleteEvent(userId: string, eventId: string, calendarId = 'primary') {
    const accessToken = await this.googleAuth.getValidAccessToken(userId);
    await this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: 'DELETE' },
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
      throw new InternalServerErrorException(
        `Google Calendar API error: ${await res.text()}`,
      );
    }
    return noContent ? undefined : res.json();
  }
}
