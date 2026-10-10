import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller(':projectId/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  /** Gantt-style bars (one per step) + gate markers for the project, plotted against the phase ruler. */
  @RequirePermission('workflow-timeline:read')
  @Get()
  getTimeline(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.timelineService.getProjectTimeline(projectId);
  }
}
