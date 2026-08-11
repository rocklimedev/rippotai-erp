import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AutomationRunEntity } from '../persistence/entities/automation-run.entity';
import { AutomationRunStepEntity } from '../persistence/entities/automation-run-step.entity';
import { AutomationEngine } from '../core/automation.engine';
import { NotFoundError } from '../errors/automation.errors';

@Controller('automation-runs')
export class AutomationRunsController {
  constructor(
    @InjectRepository(AutomationRunEntity)
    private readonly runs: Repository<AutomationRunEntity>,
    @InjectRepository(AutomationRunStepEntity)
    private readonly steps: Repository<AutomationRunStepEntity>,
    private readonly engine: AutomationEngine,
  ) {}

  @Get(':id')
  async get(
    @Param('id') id: string,
  ): Promise<{ run: AutomationRunEntity; steps: AutomationRunStepEntity[] }> {
    const run = await this.runs.findOne({ where: { id } });
    if (!run) throw new NotFoundError(`Run ${id} not found`);
    const steps = await this.steps.find({
      where: { automationRunId: id },
      order: { createdAt: 'ASC' },
    });
    return { run, steps };
  }

  @Get()
  async list(
    @Query('correlationId') correlationId?: string,
    @Query('status') status?: string,
    @Query('limit') limit = '50',
  ): Promise<AutomationRunEntity[]> {
    const where: Record<string, unknown> = {};
    if (correlationId) where.correlationId = correlationId;
    if (status) where.status = status;
    return this.runs.find({
      where,
      order: { createdAt: 'DESC' },
      take: Number(limit),
    });
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string): Promise<{ ok: true }> {
    await this.engine.retryRun(id);
    return { ok: true };
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string): Promise<{ ok: true }> {
    await this.engine.cancelRun(id);
    return { ok: true };
  }
}
