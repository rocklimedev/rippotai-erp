import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationEntity } from '../persistence/entities/automation.entity';
import {
  AutomationVersionEntity,
  AutomationVersionStatus,
} from '../persistence/entities/automation-version.entity';
import { AutomationEvent } from '../events/event.types';
import { TriggerEngine } from './trigger.engine';
import { TriggerType } from './trigger.types';

export interface MatchedAutomation {
  automation: AutomationEntity;
  version: AutomationVersionEntity;
}

/**
 * Finds which enabled automations should react to a given inbound event.
 * Tenant isolation is enforced here: an event never matches an automation
 * belonging to a different tenant (spec §49).
 */
@Injectable()
export class TriggerRegistry {
  constructor(
    @InjectRepository(AutomationEntity)
    private readonly automations: Repository<AutomationEntity>,
    @InjectRepository(AutomationVersionEntity)
    private readonly versions: Repository<AutomationVersionEntity>,
    private readonly triggerEngine: TriggerEngine,
  ) {}

  async findMatchingAutomations(
    event: AutomationEvent,
  ): Promise<MatchedAutomation[]> {
    const enabledAutomations = await this.automations.find({
      where: event.tenantId
        ? { enabled: true, tenantId: event.tenantId }
        : { enabled: true },
    });

    const results: MatchedAutomation[] = [];

    for (const automation of enabledAutomations) {
      // Tenant isolation: if the automation has a tenant but the event doesn't match, skip.
      if (automation.tenantId && automation.tenantId !== event.tenantId) {
        continue;
      }

      const version = await this.versions.findOne({
        where: {
          automationId: automation.id,
          version: automation.currentVersion,
          status: AutomationVersionStatus.ACTIVE,
        },
      });

      if (!version || version.trigger.type !== TriggerType.EVENT) {
        continue;
      }

      const matchResult = this.triggerEngine.matchesEvent(
        version.trigger,
        event,
      );
      if (matchResult.matched) {
        results.push({ automation, version });
      }
    }

    return results;
  }
}
