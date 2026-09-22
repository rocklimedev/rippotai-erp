import {
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

  /**
   * ---------------------------------------------------------
   * CALENDARS
   * ---------------------------------------------------------
   *
   * GET /api/v1/zoho/calendar/:ownerKey/calendars
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
      showHiddenCal === 'true',
    );
  }

  /**
   * GET /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid
   */

  @Get(':ownerKey/calendars/:calendarUid')
  getCalendar(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
  ) {
    return this.zohoCalendarService.getCalendar(ownerKey, calendarUid);
  }

  /**
   * POST /api/v1/zoho/calendar/:ownerKey/calendars
   */

  @Post(':ownerKey/calendars')
  createCalendar(
    @Param('ownerKey') ownerKey: string,
    @Body() dto: CreateZohoCalendarDto,
  ) {
    return this.zohoCalendarService.createCalendar(ownerKey, dto);
  }

  /**
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events
   *
   * Optional:
   * ?start=2026-09-22T00:00:00
   * &end=2026-09-30T23:59:59
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
    const range =
      start && end
        ? {
            start,
            end,
          }
        : undefined;

    return this.zohoCalendarService.listEvents(
      ownerKey,
      calendarUid,
      range,
      byInstance === 'true',
    );
  }

  /**
   * GET /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
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
   * POST /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events
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
   * PUT /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
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
   * DELETE /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid
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

  /**
   * ---------------------------------------------------------
   * RECURRING EVENT INSTANCES
   * ---------------------------------------------------------
   */

  /**
   * GET /api/v1/zoho/calendar/:ownerKey/calendars/:calendarUid/events/:eventUid/instances
   */

  @Get(':ownerKey/calendars/:calendarUid/events/:eventUid/instances')
  getEventInstances(
    @Param('ownerKey') ownerKey: string,
    @Param('calendarUid') calendarUid: string,
    @Param('eventUid') eventUid: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
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

  /**
   * ---------------------------------------------------------
   * SMART ADD
   * ---------------------------------------------------------
   */

  /**
   * POST /api/v1/zoho/calendar/:ownerKey/smart-add
   */

  @Post(':ownerKey/smart-add')
  smartAddEvent(
    @Param('ownerKey') ownerKey: string,
    @Body()
    body: {
      title: string;
    },
  ) {
    return this.zohoCalendarService.smartAddEvent(ownerKey, body.title);
  }
}
