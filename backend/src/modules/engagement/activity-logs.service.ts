import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ActivityLog } from './models/activity-log.model';
import { CreateActivityLogDto } from './dto/activity-log.dto';
import { ActivityAction } from '../../common/enums';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async log(dto: Partial<CreateActivityLogDto>): Promise<ActivityLog | void> {
    try {
      // Fill defaults
      const data = {
        user_email: dto.user_email || 'system@internal',
        user_role: dto.user_role || 'SYSTEM',
        entity_type: dto.entity_type || null,
        entity_id: dto.entity_id || null,
        ...dto,
      };

      return await this.activityLogModel.create(data as any);
    } catch (err: any) {
      console.error('Activity Log Failed:', {
        action: dto.action,
        entity_type: dto.entity_type,
        entity_id: dto.entity_id,
        error: err.message,
        stack: err.stack?.substring(0, 500),
      });
      return undefined;
    }
  }
  findAll(
    filters: {
      user_id?: string;
      action?: ActivityAction;
      entity_type?: string;
      entity_id?: string;
      from?: Date;
      to?: Date;
    } = {},
  ): Promise<ActivityLog[]> {
    const where: Record<string, any> = {};
    if (filters.user_id) where.user_id = filters.user_id;
    if (filters.action) where.action = filters.action;
    if (filters.entity_type) where.entity_type = filters.entity_type;
    if (filters.entity_id) where.entity_id = filters.entity_id;
    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) where.created_at[Op.gte] = filters.from;
      if (filters.to) where.created_at[Op.lte] = filters.to;
    }

    return this.activityLogModel.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 500,
    });
  }
}
