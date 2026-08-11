import { Body, Controller, Post } from '@nestjs/common';
import { AutomationEngine, IngestResult } from '../core/automation.engine';
import type { PublishEventDto } from '../dto/event.dto';

/**
 * The ONLY HTTP entrypoint through which external business events enter the
 * engine. A host application either calls AutomationEngine.ingestEvent(...)
 * directly in-process, or POSTs here if it prefers an HTTP boundary (e.g.
 * a separate service, or a webhook-style integration).
 */
@Controller('automation-events')
export class AutomationEventsController {
  constructor(private readonly engine: AutomationEngine) {}

  @Post()
  async publish(@Body() dto: PublishEventDto): Promise<IngestResult> {
    return this.engine.ingestEvent(dto);
  }
}
