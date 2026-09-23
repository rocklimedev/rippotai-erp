import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';

import { CreateZohoCalendarDto } from './dto/create-calendar.dto';
import { CreateZohoEventDto } from './dto/create-event.dto';
import { UpdateZohoEventDto } from './dto/update-event.dto';

@Injectable()
export class ZohoCalendarService {
  /**
   * =========================================================
   * ZOHO CALENDAR API
   * =========================================================
   *
   * IMPORTANT:
   *
   * Zoho Calendar does NOT use the generic Zoho OAuth
   * api_domain such as:
   *
   * https://www.zohoapis.in
   *
   * For the India region, Calendar API uses:
   *
   * https://calendar.zoho.in/api/v1
   *
   * Therefore every request from this service explicitly
   * passes the Calendar API baseURL to ZohoHttpService.
   *
   * This keeps the generic ZohoHttpService working for:
   *
   * - Zoho Bigin
   * - Zoho CRM
   * - Zoho Tasks
   * - Zoho Mail
   * - Other Zoho APIs
   *
   * without changing their existing api_domain handling.
   */
  private readonly baseUrl = 'https://calendar.zoho.in/api/v1';

  constructor(private readonly zohoHttpService: ZohoHttpService) {}

  // =========================================================
  // CALENDARS
  // =========================================================

  /**
   * GET
   * https://calendar.zoho.in/api/v1/calendars
   *
   * Optional:
   * ?category=...
   * ?showhiddencal=true
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

    if (category?.trim()) {
      params.category = category.trim();
    }

    return this.zohoHttpService.get(userId, '/calendars', {
      baseURL: this.baseUrl,
      params,
    });
  }

  /**
   * GET
   * /calendars/:calendarUid
   */
  async getCalendar(userId: string, calendarUid: string) {
    this.validateCalendarParams(userId, calendarUid);

    return this.zohoHttpService.get(
      userId,
      `/calendars/${encodeURIComponent(calendarUid)}`,
      {
        baseURL: this.baseUrl,
      },
    );
  }

  /**
   * POST
   * /calendars
   *
   * Zoho Calendar expects:
   *
   * calendarData
   */
  async createCalendar(userId: string, dto: CreateZohoCalendarDto) {
    this.validateUserId(userId);

    if (!dto) {
      throw new BadRequestException('Calendar data is required');
    }

    return this.zohoHttpService.post(userId, '/calendars', {
      baseURL: this.baseUrl,
      params: {
        calendarData: JSON.stringify(dto),
      },
    });
  }

  // =========================================================
  // EVENTS
  // =========================================================

  /**
   * GET
   *
   * /calendars/:calendarUid/events
   *
   * Optional range:
   *
   * range={
   *   "start":"20260923T000000Z",
   *   "end":"20260930T235959Z"
   * }
   *
   * Optional:
   * byinstance=true
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
    this.validateCalendarParams(userId, calendarUid);

    const params: Record<string, any> = {
      byinstance: byInstance,
    };

    if (range) {
      if (!range.start || !range.end) {
        throw new BadRequestException(
          'Both range.start and range.end are required',
        );
      }

      params.range = JSON.stringify({
        start: range.start,
        end: range.end,
      });
    }

    return this.zohoHttpService.get(
      userId,
      `/calendars/${encodeURIComponent(calendarUid)}/events`,
      {
        baseURL: this.baseUrl,
        params,
      },
    );
  }

  /**
   * GET
   *
   * /calendars/:calendarUid/events/:eventUid
   */
  async getEvent(userId: string, calendarUid: string, eventUid: string) {
    this.validateEventParams(userId, calendarUid, eventUid);

    return this.zohoHttpService.get(
      userId,
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}`,
      {
        baseURL: this.baseUrl,
      },
    );
  }

  /**
   * POST
   *
   * /calendars/:calendarUid/events
   *
   * Zoho Calendar expects:
   *
   * eventdata
   */
  async createEvent(
    userId: string,
    calendarUid: string,
    dto: CreateZohoEventDto,
  ) {
    this.validateCalendarParams(userId, calendarUid);

    if (!dto) {
      throw new BadRequestException('Event data is required');
    }

    /**
     * Zoho Calendar does not allow both
     * description and richtext_description.
     */
    if (dto.description && dto.richtext_description) {
      throw new BadRequestException(
        'Use either description or richtext_description, not both',
      );
    }

    return this.zohoHttpService.post(
      userId,
      `/calendars/${encodeURIComponent(calendarUid)}/events`,
      {
        baseURL: this.baseUrl,
        params: {
          eventdata: JSON.stringify(dto),
        },
      },
    );
  }

  /**
   * PUT
   *
   * /calendars/:calendarUid/events/:eventUid
   */
  async updateEvent(
    userId: string,
    calendarUid: string,
    eventUid: string,
    dto: UpdateZohoEventDto,
  ) {
    this.validateEventParams(userId, calendarUid, eventUid);

    if (!dto) {
      throw new BadRequestException('Event data is required');
    }

    if (dto.description && dto.richtext_description) {
      throw new BadRequestException(
        'Use either description or richtext_description, not both',
      );
    }

    return this.zohoHttpService.put(
      userId,
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}`,
      {
        baseURL: this.baseUrl,
        params: {
          eventdata: JSON.stringify(dto),
        },
      },
    );
  }

  /**
   * DELETE
   *
   * /calendars/:calendarUid/events/:eventUid
   */
  async deleteEvent(userId: string, calendarUid: string, eventUid: string) {
    this.validateEventParams(userId, calendarUid, eventUid);

    return this.zohoHttpService.delete(
      userId,
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}`,
      {
        baseURL: this.baseUrl,
      },
    );
  }

  // =========================================================
  // RECURRING EVENT INSTANCES
  // =========================================================

  /**
   * GET
   *
   * /calendars/:calendarUid/events/:eventUid/byinstance
   *
   * Required:
   *
   * range={
   *   "start":"20260923T000000Z",
   *   "end":"20260930T235959Z"
   * }
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
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}/byinstance`,
      {
        baseURL: this.baseUrl,
        params: {
          range: JSON.stringify({
            start: range.start,
            end: range.end,
          }),
        },
      },
    );
  }

  // =========================================================
  // SMART ADD
  // =========================================================

  /**
   * POST
   *
   * /smartadd
   */
  async smartAddEvent(userId: string, title: string) {
    this.validateUserId(userId);

    if (!title?.trim()) {
      throw new BadRequestException('title is required');
    }

    return this.zohoHttpService.post(userId, '/smartadd', {
      baseURL: this.baseUrl,
      params: {
        title: title.trim(),
      },
    });
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  private validateUserId(userId: string) {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
  }

  private validateCalendarParams(userId: string, calendarUid: string) {
    this.validateUserId(userId);

    if (!calendarUid?.trim()) {
      throw new BadRequestException('calendarUid is required');
    }
  }

  private validateEventParams(
    userId: string,
    calendarUid: string,
    eventUid: string,
  ) {
    this.validateCalendarParams(userId, calendarUid);

    if (!eventUid?.trim()) {
      throw new BadRequestException('eventUid is required');
    }
  }
}
