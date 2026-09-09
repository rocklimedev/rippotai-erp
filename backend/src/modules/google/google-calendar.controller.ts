import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

import { GoogleCalendarService } from './google-calendar.service';
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
interface AuthenticatedRequest {
  user: {
    id?: string | number;
    userId?: string | number;
  };
}

@Controller('google/calendar')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      throw new Error('Authenticated user ID not found');
    }

    return String(userId);
  }

  /**
   * GET /google/calendar/calendars
   *
   * Returns all calendars belonging to the
   * currently connected Google account.
   */
  @Get('calendars')
  async listCalendars(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);

    return this.googleCalendar.listCalendars(userId);
  }

  /**
   * GET /google/calendar/calendars/:calendarId
   */
  @Get('calendars/:calendarId')
  async getCalendar(
    @Req() req: AuthenticatedRequest,
    @Param('calendarId') calendarId: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.getCalendar(userId, calendarId);
  }

  /**
   * GET /google/calendar/events
   *
   * Query:
   * ?calendarId=primary
   * &timeMin=2026-09-08T00:00:00+05:30
   * &timeMax=2026-09-09T00:00:00+05:30
   */
  @Get('events')
  async listEvents(
    @Req() req: AuthenticatedRequest,

    @Query('calendarId')
    calendarId?: string,

    @Query('timeMin')
    timeMin?: string,

    @Query('timeMax')
    timeMax?: string,

    @Query('maxResults')
    maxResults?: string,

    @Query('pageToken')
    pageToken?: string,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.listEvents(userId, {
      calendarId,
      timeMin,
      timeMax,
      maxResults: maxResults ? Number(maxResults) : undefined,
      pageToken,
    });
  }

  /**
   * POST /google/calendar/events
   */
  @Post('events')
  async createEvent(
    @Req() req: AuthenticatedRequest,
    @Body() event: CalendarEventInput,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.createEvent(userId, event, 'primary');
  }

  /**
   * POST /google/calendar/calendars/:calendarId/events
   *
   * Allows explicitly creating an event
   * inside a selected personal calendar.
   */
  @Post('calendars/:calendarId/events')
  async createEventInCalendar(
    @Req() req: AuthenticatedRequest,
    @Param('calendarId') calendarId: string,
    @Body() event: CalendarEventInput,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.createEvent(userId, event, calendarId);
  }

  /**
   * PATCH /google/calendar/events/:eventId
   */
  @Patch('events/:eventId')
  async updateEvent(
    @Req() req: AuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body()
    event: Partial<CalendarEventInput>,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.updateEvent(userId, eventId, event, 'primary');
  }

  /**
   * PATCH /google/calendar/calendars/:calendarId/events/:eventId
   */
  @Patch('calendars/:calendarId/events/:eventId')
  async updateEventInCalendar(
    @Req() req: AuthenticatedRequest,
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
    @Body()
    event: Partial<CalendarEventInput>,
  ) {
    const userId = this.getUserId(req);

    return this.googleCalendar.updateEvent(userId, eventId, event, calendarId);
  }

  /**
   * DELETE /google/calendar/events/:eventId
   */
  @Delete('events/:eventId')
  async deleteEvent(
    @Req() req: AuthenticatedRequest,
    @Param('eventId') eventId: string,
  ) {
    const userId = this.getUserId(req);

    await this.googleCalendar.deleteEvent(userId, eventId, 'primary');

    return {
      success: true,
      message: 'Google Calendar event deleted',
    };
  }

  /**
   * DELETE
   * /google/calendar/calendars/:calendarId/events/:eventId
   */
  @Delete('calendars/:calendarId/events/:eventId')
  async deleteEventFromCalendar(
    @Req() req: AuthenticatedRequest,
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string,
  ) {
    const userId = this.getUserId(req);

    await this.googleCalendar.deleteEvent(userId, eventId, calendarId);

    return {
      success: true,
      message: 'Google Calendar event deleted',
    };
  }
}
