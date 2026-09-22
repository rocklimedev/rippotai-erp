import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';

import { CreateZohoCalendarDto } from './dto/create-calendar.dto';
import { CreateZohoEventDto } from './dto/create-event.dto';
import { UpdateZohoEventDto } from './dto/update-event.dto';

@Injectable()
export class ZohoCalendarService {
  /**
   * Zoho Calendar API - India Data Center
   *
   * NOTE:
   * ZohoHttpService already resolves the user's api_domain
   * from OAuth, so this path is intentionally relative.
   */
  private readonly baseUrl = '/calendar/v1';

  constructor(private readonly zohoHttpService: ZohoHttpService) {}

  /**
   * ---------------------------------------------------------
   * CALENDARS
   * ---------------------------------------------------------
   */

  async listCalendars(
    userId: string,
    category?: string,
    showHiddenCal = false,
  ) {
    this.validateUserId(userId);

    const params: Record<string, any> = {
      showhiddencal: showHiddenCal,
    };

    if (category) {
      params.category = category;
    }

    return this.zohoHttpService.get(userId, `${this.baseUrl}/calendars`, {
      params,
    });
  }

  async getCalendar(userId: string, calendarUid: string) {
    this.validateUserId(userId);

    if (!calendarUid) {
      throw new BadRequestException('calendarUid is required');
    }

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}`,
    );
  }

  async createCalendar(userId: string, dto: CreateZohoCalendarDto) {
    this.validateUserId(userId);

    return this.zohoHttpService.post(userId, `${this.baseUrl}/calendars`, {
      params: {
        calendarData: dto,
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  async listEvents(
    userId: string,
    calendarUid: string,
    range?: {
      start: string;
      end: string;
    },
    byInstance = false,
  ) {
    this.validateUserId(userId);

    if (!calendarUid) {
      throw new BadRequestException('calendarUid is required');
    }

    const params: Record<string, any> = {
      byinstance: byInstance,
    };

    if (range) {
      params.range = range;
    }

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events`,
      {
        params,
      },
    );
  }

  async getEvent(userId: string, calendarUid: string, eventUid: string) {
    this.validateEventParams(userId, calendarUid, eventUid);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events/${eventUid}`,
    );
  }

  async createEvent(
    userId: string,
    calendarUid: string,
    dto: CreateZohoEventDto,
  ) {
    this.validateUserId(userId);

    if (!calendarUid) {
      throw new BadRequestException('calendarUid is required');
    }

    if (dto.description && dto.richtext_description) {
      throw new BadRequestException(
        'Use either description or richtext_description, not both',
      );
    }

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events`,
      {
        params: {
          eventdata: dto,
        },
      },
    );
  }

  async updateEvent(
    userId: string,
    calendarUid: string,
    eventUid: string,
    dto: UpdateZohoEventDto,
  ) {
    this.validateEventParams(userId, calendarUid, eventUid);

    return this.zohoHttpService.put(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events/${eventUid}`,
      {
        params: {
          eventdata: dto,
        },
      },
    );
  }

  async deleteEvent(userId: string, calendarUid: string, eventUid: string) {
    this.validateEventParams(userId, calendarUid, eventUid);

    return this.zohoHttpService.delete(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events/${eventUid}`,
    );
  }

  /**
   * ---------------------------------------------------------
   * RECURRING EVENTS
   * ---------------------------------------------------------
   */

  async getEventInstances(
    userId: string,
    calendarUid: string,
    eventUid: string,
    range: {
      start: string;
      end: string;
    },
  ) {
    this.validateEventParams(userId, calendarUid, eventUid);

    if (!range?.start || !range?.end) {
      throw new BadRequestException('range.start and range.end are required');
    }

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/calendars/${calendarUid}/events/${eventUid}/byinstance`,
      {
        params: {
          range,
        },
      },
    );
  }

  /**
   * ---------------------------------------------------------
   * SMART ADD
   * ---------------------------------------------------------
   */

  async smartAddEvent(userId: string, title: string) {
    this.validateUserId(userId);

    if (!title) {
      throw new BadRequestException('title is required');
    }

    return this.zohoHttpService.post(userId, `${this.baseUrl}/smartadd`, {
      params: {
        title,
      },
    });
  }

  /**
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  private validateUserId(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
  }

  private validateEventParams(
    userId: string,
    calendarUid: string,
    eventUid: string,
  ) {
    this.validateUserId(userId);

    if (!calendarUid) {
      throw new BadRequestException('calendarUid is required');
    }

    if (!eventUid) {
      throw new BadRequestException('eventUid is required');
    }
  }
}
