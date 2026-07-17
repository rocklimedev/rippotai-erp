import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CalendarEvent } from './models/calender-event.model';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calender-event.dto';
import { QueryCalendarEventDto } from './dto/query-calendar-event.dto';
import { Op, literal, WhereOptions } from 'sequelize';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent)
    private readonly calendarEventModel: typeof CalendarEvent,
  ) {}

  /**
   * Admin / All Events
   */
  async findAll(query: QueryCalendarEventDto): Promise<CalendarEvent[]> {
    const where: WhereOptions = {};

    if (query.type) {
      where['type'] = query.type;
    }

    if (query.project_id) {
      where['project_id'] = query.project_id;
    }

    if (query.from || query.to) {
      where['starts_at'] = {};

      if (query.from) {
        where['starts_at'][Op.gte] = new Date(query.from);
      }

      if (query.to) {
        where['starts_at'][Op.lte] = new Date(query.to);
      }
    }

    return this.calendarEventModel.findAll({
      where,
      order: [['starts_at', 'ASC']],
      limit: query.limit ?? 500,
      offset: query.offset ?? 0,
    });
  }

  /**
   * Logged in user's events
   */
  async getMyEvents(
    userId: string,
    query: QueryCalendarEventDto,
  ): Promise<CalendarEvent[]> {
    const where: any = {
      [Op.or]: [
        {
          created_by: userId,
        },
        literal(`JSON_CONTAINS(attendees, '"${userId}"')`),
      ],
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.project_id) {
      where.project_id = query.project_id;
    }

    if (query.from || query.to) {
      where.starts_at = {};

      if (query.from) {
        where.starts_at[Op.gte] = new Date(query.from);
      }

      if (query.to) {
        where.starts_at[Op.lte] = new Date(query.to);
      }
    }

    return this.calendarEventModel.findAll({
      where,
      order: [['starts_at', 'ASC']],
      limit: query.limit ?? 500,
      offset: query.offset ?? 0,
    });
  }

  /**
   * Today's events
   */
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          {
            created_by: userId,
          },
          literal(`JSON_CONTAINS(attendees, '"${userId}"')`),
        ],
        starts_at: {
          [Op.between]: [start, end],
        },
      },
      order: [['starts_at', 'ASC']],
    });
  }

  /**
   * Upcoming events
   */
  async getUpcomingEvents(userId: string, days = 30): Promise<CalendarEvent[]> {
    const now = new Date();

    const end = new Date();
    end.setDate(end.getDate() + days);

    return this.calendarEventModel.findAll({
      where: {
        [Op.or]: [
          {
            created_by: userId,
          },
          literal(`JSON_CONTAINS(attendees, '"${userId}"')`),
        ],
        starts_at: {
          [Op.between]: [now, end],
        },
      },
      order: [['starts_at', 'ASC']],
    });
  }

  /**
   * Events for project
   */
  async getProjectEvents(projectId: string): Promise<CalendarEvent[]> {
    return this.calendarEventModel.findAll({
      where: {
        project_id: projectId,
      },
      order: [['starts_at', 'ASC']],
    });
  }

  /**
   * Dashboard Stats
   */
  async getMyStats(userId: string) {
    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const total = await this.calendarEventModel.count({
      where: {
        created_by: userId,
      },
    });

    const today = await this.calendarEventModel.count({
      where: {
        created_by: userId,
        starts_at: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const upcoming = await this.calendarEventModel.count({
      where: {
        created_by: userId,
        starts_at: {
          [Op.gt]: now,
        },
      },
    });

    return {
      total,
      today,
      upcoming,
    };
  }

  /**
   * Get single event
   */
  async findOne(id: string): Promise<CalendarEvent> {
    const event = await this.calendarEventModel.findByPk(id);

    if (!event) {
      throw new NotFoundException(`Calendar event ${id} not found`);
    }

    return event;
  }

  /**
   * Create event
   */
  async create(
    dto: CreateCalendarEventDto,
    userId?: string,
  ): Promise<CalendarEvent> {
    this.assertValidRange(dto.starts_at, dto.ends_at);

    return this.calendarEventModel.create({
      title: dto.title,
      type: dto.type,
      starts_at: new Date(dto.starts_at),
      ends_at: dto.ends_at ? new Date(dto.ends_at) : new Date(dto.starts_at),
      all_day: dto.all_day ?? false,
      project_id: dto.project_id ?? null,
      location: dto.location ?? null,
      description: dto.description ?? null,
      attendees: dto.attendees ?? [],
      created_by: userId ?? null,
    } as any);
  }

  /**
   * Update event
   */
  async update(
    id: string,
    dto: UpdateCalendarEventDto,
  ): Promise<CalendarEvent> {
    const event = await this.findOne(id);

    if (dto.starts_at || dto.ends_at) {
      this.assertValidRange(
        dto.starts_at ?? event.starts_at.toISOString(),
        dto.ends_at ?? event.ends_at?.toISOString(),
      );
    }

    const updates: Record<string, any> = {
      ...dto,
    };

    if (dto.starts_at) {
      updates.starts_at = new Date(dto.starts_at);
    }

    if (dto.ends_at) {
      updates.ends_at = new Date(dto.ends_at);
    }

    await event.update(updates);

    return event;
  }

  /**
   * Delete event
   */
  async remove(id: string): Promise<{
    id: string;
    deleted: true;
  }> {
    const event = await this.findOne(id);

    await event.destroy();

    return {
      id,
      deleted: true,
    };
  }

  /**
   * Validate dates
   */
  private assertValidRange(starts_at: string, ends_at?: string) {
    if (!ends_at) {
      return;
    }

    if (new Date(ends_at).getTime() < new Date(starts_at).getTime()) {
      throw new BadRequestException('ends_at cannot be before starts_at');
    }
  }
}
