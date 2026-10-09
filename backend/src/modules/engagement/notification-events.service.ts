import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NotificationType } from '@/common/enums';
import { NotificationBroadcastService } from './notification-broadcast.service';

// These document services do not call the legacy notification helpers.
// Observe committed records so rolled-back drafts never produce notifications.
@Injectable()
export class NotificationEventsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventsService.name);
  constructor(
    @InjectConnection() private readonly db: Sequelize,
    private readonly broadcast: NotificationBroadcastService,
  ) {}

  onModuleInit() {
    const sources = [
      {
        model: 'ProjectBrief',
        entity: 'brief',
        label: 'Client Brief',
        created: NotificationType.BRIEF_CREATED,
        updated: NotificationType.BRIEF_UPDATED,
      },
      {
        model: 'SiteRecce',
        entity: 'site_recce',
        label: 'Site Recce',
        created: NotificationType.SITE_RECCE_CREATED,
        updated: NotificationType.SITE_RECCE_UPDATED,
      },
      {
        model: 'Lead',
        entity: 'lead',
        label: 'Lead',
        created: NotificationType.LEAD_CREATED,
        updated: NotificationType.LEAD_UPDATED,
      },
      {
        model: 'DrawingRevision',
        entity: 'drawing',
        label: 'Drawing revision',
        created: NotificationType.DRAWING_UPLOADED,
        updated: NotificationType.SYSTEM,
      },
      {
        model: 'Drawing',
        entity: 'drawing',
        label: 'Drawing',
        created: NotificationType.SYSTEM,
        updated: NotificationType.SYSTEM,
      },
      {
        model: 'Document',
        entity: 'document',
        label: 'Document',
        created: NotificationType.SYSTEM,
        updated: NotificationType.SYSTEM,
      },
      {
        model: 'BudgetEstimate',
        entity: 'business_proposal',
        label: 'Business Proposal',
        created: NotificationType.SYSTEM,
        updated: NotificationType.SYSTEM,
      },
      {
        model: 'PlanOfAction',
        entity: 'plan_of_action',
        label: 'Plan of Action',
        created: NotificationType.SYSTEM,
        updated: NotificationType.SYSTEM,
      },
      {
        model: 'ScopeOfWork',
        entity: 'scope_of_work',
        label: 'Scope of Work',
        created: NotificationType.SYSTEM,
        updated: NotificationType.SYSTEM,
      },
    ];
    for (const source of sources) {
      const model = this.db.models[source.model];
      if (!model) continue;
      for (const event of ['afterCreate', 'afterUpdate'] as const) {
        model.addHook(
          event,
          'committed-notification',
          async (record: any, options: any) => {
            const stageChanged =
              event === 'afterUpdate' &&
              source.model === 'Lead' &&
              record.changed('stage');
            const statusChanged =
              event === 'afterUpdate' && record.changed('status');
            // Drawing metadata is created before the file. Announce its upload
            // from DrawingRevision and only announce approval changes here.
            if (source.model === 'Drawing' && !statusChanged) return;
            const type = stageChanged
              ? NotificationType.LEAD_STAGE_CHANGED
              : event === 'afterCreate'
                ? source.created
                : source.updated;
            const name =
              record.title ||
              record.dealName ||
              record.name ||
              record.project_name ||
              source.label;
            const action = event === 'afterCreate' ? 'created' : 'updated';
            const payload = {
              excludedUserId:
                record.updated_by ||
                record.created_by ||
                record.uploadedBy ||
                undefined,
              type,
              entity_type: source.entity,
              entity_id:
                source.model === 'DrawingRevision'
                  ? record.drawingId
                  : record.id,
              title: `${source.label} ${stageChanged || statusChanged ? 'status changed' : action}`,
              message: `${name}${stageChanged ? ` moved to ${record.stage}` : statusChanged ? ` is now ${record.status}` : ` was ${action}`}.`,
            };
            const send = async () => {
              try {
                await this.broadcast.broadcast(payload);
              } catch (error) {
                this.logger.error(
                  `Notification failed for ${source.model} ${record.id}: ${error.message}`,
                );
              }
            };
            if (options.transaction) options.transaction.afterCommit(send);
            else await send();
          },
        );
      }
    }
  }
}
