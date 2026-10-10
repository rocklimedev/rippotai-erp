import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calender-event.dto';
import { QueryCalendarEventDto } from './dto/query-calendar-event.dto';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@Controller('calendar/events')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Get all calendar events (Admin)
   * GET /calendar/events
   */
  @RequirePermission('calendar-events:read')
  @Get()
  findAll(@Query() query: QueryCalendarEventDto) {
    return this.calendarService.findAll(query);
  }

  /**
   * Get my calendar events
   * GET /calendar/events/my-events
   */
  @RequirePermission('calendar-events:read')
  @Get('my-events')
  getMyEvents(
    @CurrentUser() user: User,
    @Query() query: QueryCalendarEventDto,
  ) {
    return this.calendarService.getMyEvents(user.id, query);
  }

  /**
   * Get today's events
   * GET /calendar/events/today
   */
  @RequirePermission('calendar-events:read')
  @Get('today')
  getTodayEvents(@CurrentUser() user: User) {
    return this.calendarService.getTodayEvents(user.id);
  }

  /**
   * Get upcoming events
   * GET /calendar/events/upcoming?days=30
   */
  @RequirePermission('calendar-events:read')
  @Get('upcoming')
  getUpcomingEvents(
    @CurrentUser() user: User,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.calendarService.getUpcomingEvents(user.id, days ?? 30);
  }

  /**
   * Dashboard statistics
   * GET /calendar/events/stats
   */
  @RequirePermission('calendar-events:read')
  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.calendarService.getMyStats(user.id);
  }

  /**
   * Get events for a project
   * GET /calendar/events/project/:projectId
   */
  @RequirePermission('calendar-events:read')
  @Get('project/:projectId')
  getProjectEvents(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.calendarService.getProjectEvents(projectId);
  }

  /**
   * Get single event
   * GET /calendar/events/:id
   */
  @RequirePermission('calendar-events:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.findOne(id);
  }

  /**
   * Create calendar event
   * POST /calendar/events
   */
  @RequirePermission('calendar-events:create')
  @Post()
  create(@Body() dto: CreateCalendarEventDto, @CurrentUser() user: User) {
    return this.calendarService.create(dto, user);
  }

  /**
   * Update calendar event
   * PATCH /calendar/events/:id
   */
  @RequirePermission('calendar-events:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser() user: User,
  ) {
    return this.calendarService.update(id, dto, user);
  }

  /**
   * Delete calendar event
   * DELETE /calendar/events/:id
   */
  @RequirePermission('calendar-events:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.calendarService.remove(id, user);
  }
}
