import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { parseExpression } from 'cron-parser';

import { ScheduledAutomationEntity } from '../persistence/entities/scheduled-automation.entity';
import { AutomationEntity } from '../persistence/entities/automation.entity';
import {
  AutomationVersionEntity,
  AutomationVersionStatus,
} from '../persistence/entities/automation-version.entity';
import { ScheduleTrigger, TriggerType } from '../triggers/trigger.types';
import { ExecutionEngine } from '../core/execution.engine';

/**
 * Lightweight tick-based scheduler: every minute, finds ScheduledAutomation
 * rows whose nextRunAt has passed, starts a run for each, and computes the
 * following nextRunAt from the automation's cron expression. Heavy work
 * always happens in the BullMQ worker via ExecutionEngine.startRun, never
 * directly on this tick (spec §33).
 */
@Injectable()
export class AutomationScheduler {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    @InjectRepository(ScheduledAutomationEntity)
    private readonly scheduled: Repository<ScheduledAutomationEntity>,
    @InjectRepository(AutomationEntity)
    private readonly automations: Repository<AutomationEntity>,
    @InjectRepository(AutomationVersionEntity)
    private readonly versions: Repository<AutomationVersionEntity>,
    private readonly executionEngine: ExecutionEngine,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    const due = await this.scheduled.find({
      where: { active: true, nextRunAt: LessThanOrEqual(new Date()) },
    });

    for (const entry of due) {
      try {
        await this.fire(entry);
      } catch (err) {
        this.logger.error(
          `Failed to fire scheduled automation ${entry.automationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async fire(entry: ScheduledAutomationEntity): Promise<void> {
    const automation = await this.automations.findOne({
      where: { id: entry.automationId },
    });
    const version = await this.versions.findOne({
      where: {
        automationId: entry.automationId,
        version: entry.automationVersion,
        status: AutomationVersionStatus.ACTIVE,
      },
    });

    if (!automation || !automation.enabled || !version) {
      entry.active = false;
      await this.scheduled.save(entry);
      return;
    }

    await this.executionEngine.startRun(automation, version, undefined, {
      triggerType: entry.triggerType,
    });

    entry.lastRunAt = new Date();
    if (version.trigger.type === TriggerType.SCHEDULE) {
      entry.nextRunAt = this.computeNextRun(version.trigger as ScheduleTrigger);
    } else {
      entry.active = false;
    }
    await this.scheduled.save(entry);
  }

  computeNextRun(trigger: ScheduleTrigger): Date {
    const interval = parseExpression(trigger.cron, {
      tz: trigger.timezone ?? 'UTC',
    });
    return interval.next().toDate();
  }

  /** Registers/updates the scheduling bookkeeping row for a SCHEDULE-triggered automation version. */
  async registerSchedule(
    automation: AutomationEntity,
    version: AutomationVersionEntity,
  ): Promise<void> {
    if (version.trigger.type !== TriggerType.SCHEDULE) return;

    const nextRunAt = this.computeNextRun(version.trigger as ScheduleTrigger);
    const existing = await this.scheduled.findOne({
      where: { automationId: automation.id },
    });

    if (existing) {
      existing.automationVersion = version.version;
      existing.nextRunAt = nextRunAt;
      existing.active = true;
      await this.scheduled.save(existing);
      return;
    }

    await this.scheduled.save(
      this.scheduled.create({
        automationId: automation.id,
        automationVersion: version.version,
        triggerType: TriggerType.SCHEDULE,
        nextRunAt,
        active: true,
      }),
    );
  }
}
