import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { ZohoCalendarService } from './zoho-calendar.service';

import { CreateZohoCalendarDto } from './dto/create-calendar.dto';
import { CreateZohoEventDto } from './dto/create-event.dto';
import { UpdateZohoEventDto } from './dto/update-event.dto';

@Controller('zoho/calendar')
export class ZohoCalendarController {
  constructor(private readonly zohoCalendarService: ZohoCalendarService) {}

  // =========================================================
  // CALENDARS
  // =========================================================

  /**
   * GET
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars
   *
   * Optional:
   *
   * ?category=...
   * ?showhiddencal=true
   */
  @Get(':ownerKey/calendars')
  listCalendars(
    @Param('ownerKey') ownerKey: string,
    @Query('category') category?: string,
    @Query('showhiddencal') showHiddenCal?: string,
  ) {
    return this.zohoCalendarService.listCalendars(
      ownerKey,
      category,
      this.toBoolean(showHiddenCal),
    );
  }

  /**
   * GET
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid
   */
  @Get(':ownerKey/calendars/:calendarUid')
  getCalendar(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
  ) {
    return this.zohoCalendarService.getCalendar(ownerKey, calendarUid);
  }

  /**
   * POST
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars
   */
  @Post(':ownerKey/calendars')
  createCalendar(
    @Param('ownerKey') ownerKey: string,
    @Body() dto: CreateZohoCalendarDto,
  ) {
    return this.zohoCalendarService.createCalendar(ownerKey, dto);
  }

  // =========================================================
  // EVENTS
  // =========================================================

  /**
   * GET
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events
   *
   * Optional:
   *
   * ?start=20260923T000000Z
   * &end=20260930T235959Z
   * &byinstance=true
   */
  @Get(':ownerKey/calendars/:calendarUid/events')
  listEvents(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('byinstance') byInstance?: string,
  ) {
    let range:
      | {
          start: string;
          end: string;
        }
      | undefined;

    /**
     * If either start or end is supplied,
     * require both.
     */
    if (start || end) {
      if (!start || !end) {
        throw new BadRequestException(
          'Both start and end are required when using a date range',
        );
      }

      range = {
        start,
        end,
      };
    }

    return this.zohoCalendarService.listEvents(
      ownerKey,
      calendarUid,
      range,
      this.toBoolean(byInstance),
    );
  }

  /**
   * GET
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
   */
  @Get(':ownerKey/calendars/:calendarUid/events/:eventUid')
  getEvent(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Param('eventUid') eventUid: string,
  ) {
    return this.zohoCalendarService.getEvent(ownerKey, calendarUid, eventUid);
  }

  /**
   * POST
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events
   */
  @Post(':ownerKey/calendars/:calendarUid/events')
  createEvent(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Body() dto: CreateZohoEventDto,
  ) {
    return this.zohoCalendarService.createEvent(ownerKey, calendarUid, dto);
  }

  /**
   * PUT
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
   */
  @Put(':ownerKey/calendars/:calendarUid/events/:eventUid')
  updateEvent(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Param('eventUid') eventUid: string,
    @Body() dto: UpdateZohoEventDto,
  ) {
    return this.zohoCalendarService.updateEvent(
      ownerKey,
      calendarUid,
      eventUid,
      dto,
    );
  }

  /**
   * DELETE
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
   */
  @Delete(':ownerKey/calendars/:calendarUid/events/:eventUid')
  deleteEvent(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Param('eventUid') eventUid: string,
  ) {
    return this.zohoCalendarService.deleteEvent(
      ownerKey,
      calendarUid,
      eventUid,
    );
  }

  // =========================================================
  // RECURRING EVENT INSTANCES
  // =========================================================

  /**
   * GET
   *
   * /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid/instances
   *
   * Required:
   *
   * ?start=20260923T000000Z
   * &end=20260930T235959Z
   */
  @Get(':ownerKey/calendars/:calendarUid/events/:eventUid/instances')
  getEventInstances(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Param('eventUid') eventUid: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!start || !end) {
      throw new BadRequestException('Both start and end are required');
    }

    return this.zohoCalendarService.getEventInstances(
      ownerKey,
      calendarUid,
      eventUid,
      {
        start,
        end,
      },
    );
  }

  // =========================================================
  // SMART ADD
  // =========================================================

  /**
   * POST
   *
   * /api/v1/zoho/calendar/:ownerKey/smart-add
   *
   * Body:
   *
   * {
   *   "title": "Site visit tomorrow at 11 AM"
   * }
   */
  @Post(':ownerKey/smart-add')
  smartAddEvent(
    @Param('ownerKey') ownerKey: string,
    @Body()
    body: {
      title: string;
    },
  ) {
    return this.zohoCalendarService.smartAddEvent(ownerKey, body?.title);
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private toBoolean(value?: string): boolean {
    return value?.toLowerCase() === 'true';
  }
}
