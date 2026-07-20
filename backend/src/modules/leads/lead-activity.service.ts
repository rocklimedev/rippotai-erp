import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LeadActivity } from './models/lead-activity.model';
import { Lead } from './models/lead.model';
import { Op } from 'sequelize';

@Injectable()
export class LeadActivityService {
  constructor(
    @InjectModel(LeadActivity)
    private readonly activityModel: typeof LeadActivity,

    @InjectModel(Lead)
    private readonly leadModel: typeof Lead,
  ) {}

  /**
   * Get activities of a lead
   */
  async findByLead(leadId: string) {
    return this.activityModel.findAll({
      where: {
        leadId,
      },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Global activity listing
   * for activity page
   */
  async findAll(filters?: {
    leadId?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const where: any = {};

    if (filters?.leadId) {
      where.leadId = filters.leadId;
    }

    if (filters?.date_from || filters?.date_to) {
      where.created_at = {};

      if (filters.date_from) {
        where.created_at[Op.gte] = new Date(filters.date_from);
      }

      if (filters.date_to) {
        const end = new Date(filters.date_to);

        end.setHours(23, 59, 59, 999);

        where.created_at[Op.lte] = end;
      }
    }

    return this.activityModel.findAll({
      where,

      include: [
        {
          model: Lead,
          attributes: ['id', 'name', 'phone', 'owner', 'stage'],
        },
      ],

      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Delete activity
   */
  async remove(id: string) {
    return this.activityModel.destroy({
      where: {
        id,
      },
    });
  }
}
