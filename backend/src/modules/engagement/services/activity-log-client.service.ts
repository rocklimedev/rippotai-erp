import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { Client } from '@/modules/clients/models/client.model';
@Injectable()
export class ActivityLogForClientService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logClientCreated(client: Client, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CLIENT_CREATED,
      entity_type: 'Client',
      entity_id: client.id,
      entity_label: client.name,
      changes: {
        slug: client.slug,
        name: client.name,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logClientUpdated(client: Client, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CLIENT_UPDATED,
      entity_type: 'Client',
      entity_id: client.id,
      entity_label: client.name,
      changes: {
        name: client.name,
        slug: client.slug,
        // Add other changed fields as needed
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logClientDeleted(
    clientName: string,
    clientId: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CLIENT_DELETED,
      entity_type: 'Client',
      entity_id: clientId,
      entity_label: clientName,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logClientRestored(client: Client, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.CLIENT_RESTORED,
      entity_type: 'Client',
      entity_id: client.id,
      entity_label: client.name,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
