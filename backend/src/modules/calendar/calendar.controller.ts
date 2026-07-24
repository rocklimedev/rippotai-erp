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
  @Get()
  findAll(@Query() query: QueryCalendarEventDto) {
    return this.calendarService.findAll(query);
  }

  /**
   * Get my calendar events
   * GET /calendar/events/my-events
   */
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
  @Get('today')
  getTodayEvents(@CurrentUser() user: User) {
    return this.calendarService.getTodayEvents(user.id);
  }

  /**
   * Get upcoming events
   * GET /calendar/events/upcoming?days=30
   */
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
  @Get('stats')
  getStats(@CurrentUser() user: User) {
    return this.calendarService.getMyStats(user.id);
  }

  /**
   * Get events for a project
   * GET /calendar/events/project/:projectId
   */
  @Get('project/:projectId')
  getProjectEvents(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.calendarService.getProjectEvents(projectId);
  }

  /**
   * Get single event
   * GET /calendar/events/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.findOne(id);
  }

  /**
   * Create calendar event
   * POST /calendar/events
   */
  @Post()
  create(@Body() dto: CreateCalendarEventDto, @CurrentUser() user: User) {
    return this.calendarService.create(dto, user);
  }

  /**
   * Update calendar event
   * PATCH /calendar/events/:id
   */
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
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.calendarService.remove(id, user);
  }
}
