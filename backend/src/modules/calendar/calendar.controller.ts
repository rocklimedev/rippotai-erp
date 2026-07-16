import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calender-event.dto';
import { QueryCalendarEventDto } from './dto/query-calendar-event.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // wire up your real auth guard

@Controller('calendar/events')
// @UseGuards(JwtAuthGuard) // uncomment once your auth guard is available
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findAll(@Query() query: QueryCalendarEventDto) {
    return this.calendarService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCalendarEventDto, @Req() req: any) {
    const userId = req.user?.id; // populated by your auth guard, optional
    return this.calendarService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.calendarService.remove(id);
  }
}
