import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('workflow/projects/:projectId/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  /** Gantt-style bars (one per step) + gate markers for the project, plotted against the phase ruler. */
  @Get()
  getTimeline(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.timelineService.getProjectTimeline(projectId);
  }
}
