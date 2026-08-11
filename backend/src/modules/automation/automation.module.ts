import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import { AUTOMATION_ENGINE_ENTITIES } from './persistence/entities';
import { AUTOMATION_QUEUE_NAME } from './jobs/job.types';

import { EventValidator } from './events/event.validator';
import { EventRegistry } from './events/event.registry';

import { TriggerEngine } from './triggers/trigger.engine';
import { TriggerRegistry } from './triggers/trigger.registry';

import { ConditionEngine } from './conditions/condition.engine';
import { RuleEngine } from './rules/rule.engine';

import { ActionRegistry } from './actions/action.registry';
import { ActionEngine } from './actions/action-engine';
import { LogAction, NoOpAction } from './actions/adapters/log.action';
import { SetVariableAction } from './actions/adapters/set-variable.action';
import { DelayAction } from './actions/adapters/delay.action';
import { EmitEventAction } from './actions/adapters/emit-event.action';
import { CallRegisteredActionAction } from './actions/adapters/call-registered-action.action';

import { WorkflowEngine } from './workflows/workflow.engine';
import { AutomationScheduler } from './scheduler/automation.scheduler';

import { IdempotencyService } from './idempotency/idempotency.service';
import { CycleGuardService } from './concurrency/cycle-guard.service';
import { AutomationAuditService } from './audit/automation-audit.service';

import { ExecutionEngine } from './core/execution.engine';
import { AutomationEngine } from './core/automation.engine';
import { AutomationQueueService } from './jobs/automation.queue';
import { AutomationProcessor } from './jobs/automation.processor';

import { AutomationsController } from './controllers/automations.controller';
import { AutomationRunsController } from './controllers/automation-runs.controller';
import { AutomationEventsController } from './controllers/automation-events.controller';

import {
  AUTOMATION_AUDIT_SINK,
  AUTOMATION_AUTHORIZATION,
  AUTOMATION_CREDENTIAL_PROVIDER,
  DOMAIN_EVENT_PUBLISHER,
} from './interfaces/tokens';
import {
  AutomationAuditSink,
  AutomationAuthorization,
  AutomationCredentialProvider,
  DomainEventPublisher,
} from './interfaces/extension-points';

export interface AutomationModuleOptions {
  /** Redis connection for BullMQ. Omit if the host app already registers BullModule.forRoot() globally. */
  redis?: { host: string; port: number; password?: string; db?: number };
  /** Skip registering BullModule.forRoot at all (host app manages it globally). */
  registerBullRoot?: boolean;
  /** Skip registering ScheduleModule.forRoot (host app manages @nestjs/schedule globally). */
  registerScheduleRoot?: boolean;

  /** Extension-point bindings. All optional — the engine runs standalone without any of them. */
  domainEventPublisher?: Type<DomainEventPublisher>;
  authorization?: Type<AutomationAuthorization>;
  credentialProvider?: Type<AutomationCredentialProvider>;
  auditSink?: Type<AutomationAuditSink>;
}

const CORE_PROVIDERS: Provider[] = [
  EventValidator,
  EventRegistry,
  TriggerEngine,
  TriggerRegistry,
  ConditionEngine,
  RuleEngine,
  ActionRegistry,
  ActionEngine,
  LogAction,
  NoOpAction,
  SetVariableAction,
  DelayAction,
  EmitEventAction,
  CallRegisteredActionAction,
  WorkflowEngine,
  AutomationScheduler,
  IdempotencyService,
  CycleGuardService,
  AutomationAuditService,
  ExecutionEngine,
  AutomationEngine,
  AutomationQueueService,
  AutomationProcessor,
];

/**
 * Standalone, business-agnostic Automation Engine module.
 *
 * Import via `AutomationModule.forRoot({...})` in the host application's
 * root module. Extension-point providers (event publisher, authorization,
 * credential provider, audit sink) are optional — omit any of them and the
 * engine falls back to safe no-op/logging defaults so it runs even before
 * any business integration exists.
 */
@Module({})
export class AutomationModule {
  static forRoot(options: AutomationModuleOptions = {}): DynamicModule {
    const imports = [
      TypeOrmModule.forFeature(AUTOMATION_ENGINE_ENTITIES),
      BullModule.registerQueue({ name: AUTOMATION_QUEUE_NAME }),
      ...(options.registerBullRoot === false
        ? []
        : [
            BullModule.forRoot({
              connection: options.redis ?? { host: 'localhost', port: 6379 },
            }),
          ]),
      ...(options.registerScheduleRoot === false
        ? []
        : [ScheduleModule.forRoot()]),
    ];

    const extensionProviders: Provider[] = [];
    if (options.domainEventPublisher) {
      extensionProviders.push({
        provide: DOMAIN_EVENT_PUBLISHER,
        useClass: options.domainEventPublisher,
      });
    }
    if (options.authorization) {
      extensionProviders.push({
        provide: AUTOMATION_AUTHORIZATION,
        useClass: options.authorization,
      });
    }
    if (options.credentialProvider) {
      extensionProviders.push({
        provide: AUTOMATION_CREDENTIAL_PROVIDER,
        useClass: options.credentialProvider,
      });
    }
    if (options.auditSink) {
      extensionProviders.push({
        provide: AUTOMATION_AUDIT_SINK,
        useClass: options.auditSink,
      });
    }

    return {
      module: AutomationModule,
      imports,
      controllers: [
        AutomationsController,
        AutomationRunsController,
        AutomationEventsController,
      ],
      providers: [...CORE_PROVIDERS, ...extensionProviders],
      exports: [
        AutomationEngine,
        ExecutionEngine,
        ActionRegistry,
        WorkflowEngine,
        AutomationQueueService,
        TriggerRegistry,
        ConditionEngine,
        AutomationAuditService,
      ],
    };
  }
}
