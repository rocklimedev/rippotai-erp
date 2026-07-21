import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { CalendarEvent } from '../../calendar/models/calender-event.model';

import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class CalendarSearchService {
  private readonly logger = new Logger(CalendarSearchService.name);

  private readonly INDEX = 'calendar_events';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(CalendarEvent)
    private readonly calendarModel: typeof CalendarEvent,
  ) {}

  /**
   * Convert model into Elasticsearch document
   */
  private toDocument(event: CalendarEvent) {
    return {
      id: event.id,

      title: event.title,
      type: event.type,

      starts_at: event.starts_at,
      ends_at: event.ends_at,

      all_day: event.all_day,

      project_id: event.project_id,
      project: event.project?.name ?? '',

      location: event.location,
      description: event.description,

      attendees: event.attendees,

      created_by: event.created_by,

      created_at: event.createdAt,
      updated_at: event.updatedAt,
    };
  }

  /**
   * Index one calendar event
   */
  async indexEvent(id: string) {
    const event = await this.calendarModel.findByPk(id, {
      include: [
        {
          model: Project,
        },
      ],
    });

    if (!event) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      event.id,
      this.toDocument(event),
    );

    this.logger.log(`Indexed Calendar Event ${event.id}`);
  }

  /**
   * Update Elasticsearch document
   */
  async updateEvent(id: string) {
    return this.indexEvent(id);
  }

  /**
   * Remove from Elasticsearch
   */
  async removeEvent(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Calendar Event ${id}`);
  }

  /**
   * Search Calendar Events
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'title^5',
          'description^4',
          'project^3',
          'location^2',
          'type',
          'attendees',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all events
   */
  async reindexAll() {
    const events = await this.calendarModel.findAll({
      include: [
        {
          model: Project,
        },
      ],
    });

    for (const event of events) {
      await this.searchService.index(
        this.INDEX,
        event.id,
        this.toDocument(event),
      );
    }

    this.logger.log(`Indexed ${events.length} calendar events`);
  }
}
