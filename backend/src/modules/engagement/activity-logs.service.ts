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

  /** Fire-and-forget style log write - never throws back into business logic callers. */
  async log(dto: CreateActivityLogDto): Promise<ActivityLog | void> {
    try {
      return await this.activityLogModel.create({ ...dto } as any);
    } catch {
      // Swallow logging failures so they never break the primary operation.
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
