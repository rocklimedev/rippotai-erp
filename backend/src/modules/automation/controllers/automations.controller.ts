import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AutomationEntity } from '../persistence/entities/automation.entity';
import {
  AutomationVersionEntity,
  AutomationVersionStatus,
} from '../persistence/entities/automation-version.entity';
import { AutomationRunEntity } from '../persistence/entities/automation-run.entity';
import type {
  CreateAutomationDto,
  UpdateAutomationDto,
} from '../dto/automation.dto';
import { NotFoundError, ValidationError } from '../errors/automation.errors';
import { ActionEngine } from '../actions/action-engine';
import { ConditionEngine } from '../conditions/condition.engine';
import {
  AutomationAuditService,
  AutomationAuditEventType,
} from '../audit/automation-audit.service';
import { AutomationEngine } from '../core/automation.engine';
import { DEFAULT_RETRY_POLICY } from '../jobs/job.types';

/**
 * Conceptual REST surface per spec §54. Adjust route prefixes/guards to
 * match the host NestJS application's conventions when wiring this in.
 */
@Controller('automations')
export class AutomationsController {
  constructor(
    @InjectRepository(AutomationEntity)
    private readonly automations: Repository<AutomationEntity>,
    @InjectRepository(AutomationVersionEntity)
    private readonly versions: Repository<AutomationVersionEntity>,
    @InjectRepository(AutomationRunEntity)
    private readonly runs: Repository<AutomationRunEntity>,
    private readonly actionEngine: ActionEngine,
    private readonly conditionEngine: ConditionEngine,
    private readonly audit: AutomationAuditService,
    private readonly engine: AutomationEngine,
  ) {}

  @Get()
  async list(
    @Query('tenantId') tenantId?: string,
  ): Promise<AutomationEntity[]> {
    return this.automations.find({ where: tenantId ? { tenantId } : {} });
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<{
    automation: AutomationEntity;
    version: AutomationVersionEntity | null;
  }> {
    const automation = await this.mustFind(id);
    const version = await this.versions.findOne({
      where: {
        automationId: automation.id,
        version: automation.currentVersion,
      },
    });
    return { automation, version };
  }

  @Post()
  async create(@Body() dto: CreateAutomationDto): Promise<AutomationEntity> {
    if (!dto.name) throw new ValidationError('"name" is required');
    if (!dto.trigger) throw new ValidationError('"trigger" is required');
    if (!Array.isArray(dto.actions) || dto.actions.length === 0) {
      throw new ValidationError('"actions" must be a non-empty array');
    }

    // Validate every step against its registered action before persisting.
    for (const step of dto.actions) {
      await this.actionEngine.validateStep(step);
    }

    const automation = await this.automations.save(
      this.automations.create({
        name: dto.name,
        tenantId: dto.tenantId ?? null,
        enabled: dto.enabled ?? false,
        currentVersion: 1,
      }),
    );

    await this.versions.save(
      this.versions.create({
        automationId: automation.id,
        version: 1,
        status: AutomationVersionStatus.ACTIVE,
        trigger: dto.trigger,
        conditions: dto.conditions ?? null,
        actions: dto.actions,
        retryPolicy: dto.retryPolicy ?? DEFAULT_RETRY_POLICY,
      }),
    );

    await this.audit.record(AutomationAuditEventType.AUTOMATION_CREATED, {
      automationId: automation.id,
      automationVersion: 1,
    });

    return automation;
  }

  /** Creates a new immutable version and points the automation at it (spec §12). */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
  ): Promise<AutomationEntity> {
    const automation = await this.mustFind(id);
    const currentVersion = await this.versions.findOne({
      where: {
        automationId: automation.id,
        version: automation.currentVersion,
      },
    });
    if (!currentVersion)
      throw new NotFoundError(`Current version not found for automation ${id}`);

    const nextActions = dto.actions ?? currentVersion.actions;
    for (const step of nextActions) {
      await this.actionEngine.validateStep(step);
    }

    const nextVersionNumber = automation.currentVersion + 1;

    await this.versions.save(
      this.versions.create({
        automationId: automation.id,
        version: nextVersionNumber,
        status: AutomationVersionStatus.ACTIVE,
        trigger: dto.trigger ?? currentVersion.trigger,
        conditions: dto.conditions ?? currentVersion.conditions,
        actions: nextActions,
        retryPolicy: dto.retryPolicy ?? currentVersion.retryPolicy,
      }),
    );

    currentVersion.status = AutomationVersionStatus.ARCHIVED;
    await this.versions.save(currentVersion);

    automation.currentVersion = nextVersionNumber;
    if (dto.name) automation.name = dto.name;
    await this.automations.save(automation);

    await this.audit.record(AutomationAuditEventType.AUTOMATION_UPDATED, {
      automationId: automation.id,
      automationVersion: nextVersionNumber,
    });

    return automation;
  }

  @Post(':id/enable')
  async enable(@Param('id') id: string): Promise<AutomationEntity> {
    const automation = await this.mustFind(id);
    automation.enabled = true;
    await this.automations.save(automation);
    await this.audit.record(AutomationAuditEventType.AUTOMATION_ENABLED, {
      automationId: id,
    });
    return automation;
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string): Promise<AutomationEntity> {
    const automation = await this.mustFind(id);
    automation.enabled = false;
    await this.automations.save(automation);
    await this.audit.record(AutomationAuditEventType.AUTOMATION_DISABLED, {
      automationId: id,
    });
    return automation;
  }

  @Post(':id/trigger')
  async triggerManually(
    @Param('id') id: string,
    @Body() body: { actorId?: string },
  ): Promise<AutomationRunEntity> {
    return this.engine.triggerManually(id, body?.actorId);
  }

  @Get(':id/runs')
  async listRuns(
    @Param('id') id: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ): Promise<AutomationRunEntity[]> {
    await this.mustFind(id);
    return this.runs.find({
      where: { automationId: id },
      order: { createdAt: 'DESC' },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  private async mustFind(id: string): Promise<AutomationEntity> {
    const automation = await this.automations.findOne({ where: { id } });
    if (!automation) throw new NotFoundError(`Automation ${id} not found`);
    return automation;
  }
}
