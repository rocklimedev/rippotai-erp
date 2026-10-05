import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';
import { ZohoAuthService } from '@/modules/auth/zoho-auth.service';

import { CreateZohoCalendarDto } from './dto/create-calendar.dto';
import { CreateZohoEventDto } from './dto/create-event.dto';
import { UpdateZohoEventDto } from './dto/update-event.dto';

@Injectable()
export class ZohoCalendarService {
  // Calendar uses its own regional API host, derived from the connected account.

  constructor(
    private readonly zohoHttpService: ZohoHttpService,
    private readonly zohoAuthService: ZohoAuthService,
  ) {}

  private async getBaseUrl(userId: string) {
    const domain = await this.zohoAuthService.getApiDomain(userId);
    if (!domain) throw new BadRequestException('Reconnect your Zoho account');
    const region = new URL(domain).hostname.replace(/^(www\.)?zohoapis\./, '');
    if (
      !['com', 'in', 'eu', 'com.au', 'jp', 'com.cn', 'ca', 'sa'].includes(
        region,
      )
    )
      throw new BadRequestException('Unsupported Zoho account region');
    return `https://calendar.zoho.${region}/api/v1`;
  }

  private eventRecord(response: any) {
    const data = response?.data ?? response;
    return data?.events?.[0] ?? data?.event ?? data;
  }

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
      baseURL: await this.getBaseUrl(userId),
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
        baseURL: await this.getBaseUrl(userId),
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
      baseURL: await this.getBaseUrl(userId),
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
        baseURL: await this.getBaseUrl(userId),
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
        baseURL: await this.getBaseUrl(userId),
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
        baseURL: await this.getBaseUrl(userId),
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

    const current = this.eventRecord(
      await this.getEvent(userId, calendarUid, eventUid),
    );
    if (!current?.etag) throw new BadRequestException('Zoho event has no etag');
    return this.zohoHttpService.put(
      userId,
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}`,
      {
        baseURL: await this.getBaseUrl(userId),
        params: {
          eventdata: JSON.stringify({ ...dto, etag: current.etag }),
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

    const current = this.eventRecord(
      await this.getEvent(userId, calendarUid, eventUid),
    );
    if (!current?.etag) throw new BadRequestException('Zoho event has no etag');

    return this.zohoHttpService.delete(
      userId,
      `/calendars/${encodeURIComponent(
        calendarUid,
      )}/events/${encodeURIComponent(eventUid)}`,
      {
        baseURL: await this.getBaseUrl(userId),
        headers: { etag: String(current.etag) },
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
        baseURL: await this.getBaseUrl(userId),
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
      baseURL: await this.getBaseUrl(userId),
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
