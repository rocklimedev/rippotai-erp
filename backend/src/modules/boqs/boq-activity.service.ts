import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { BoqActivity } from './models/boq-activity.model';
import { User } from '@/modules/users/models/user.model';
import { QueryActivityDto } from './dto/query-activity.dto';
import { BoqActivityAction } from '@/common/enums/boq-enums';

import { Transaction } from 'sequelize';

interface LogActivityInput {
  boq_id?: string | null;
  user_id?: string | null;
  action: BoqActivityAction;
  target: string;
  details?: string | null;
  transaction?: Transaction;
}
@Injectable()
export class BoqActivityService {
  constructor(
    @InjectModel(BoqActivity)
    private readonly activityModel: typeof BoqActivity,
  ) {}

  /** Fire-and-forget style logger called from BoqService / LibraryService / BoqTemplateService. */
  async log(input: LogActivityInput): Promise<BoqActivity> {
    return this.activityModel.create(
      {
        boq_id: input.boq_id ?? null,
        user_id: input.user_id ?? null,
        action: input.action,
        target: input.target,
        details: input.details ?? null,
      } as BoqActivity,
      { transaction: input.transaction },
    );
  }
  async findAll(query: QueryActivityDto) {
    const where: WhereOptions = {};

    if (query.user_id) {
      where.user_id = query.user_id;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.boq_id) {
      where.boq_id = query.boq_id;
    }
    if (query.date_from || query.date_to) {
      where.created_at = {
        ...(query.date_from ? { [Op.gte]: new Date(query.date_from) } : {}),
        ...(query.date_to ? { [Op.lte]: new Date(query.date_to) } : {}),
      };
    }

    const include: any[] = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        ...(query.user
          ? { where: { name: { [Op.like]: `%${query.user}%` } } }
          : {}),
      },
    ];

    const rows = await this.activityModel.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    // Shape to what BoqActivityPage.jsx renders: at, user, action, target, details
    return rows.map((r) => ({
      id: r.id,
      at: r.get('created_at'),
      user: r.user?.name ?? null,
      action: r.action,
      target: r.target,
      details: r.details,
    }));
  }
}
