import { Injectable } from '@nestjs/common';
import { Op, fn, col, literal } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { Quotation } from '../quotations/models/quotations.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';

interface QuotationSummary {
  total: number;
  drafts: number;
  awaiting_review: number;
  awaiting_approval: number;
  total_value: number;
  avg_variation_pct?: number;
}

@Injectable()
export class QuotationDashboardService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * GET /quotations/summary
   */
  async getSummary() {
    const [summary] = await this.sequelize.query<QuotationSummary>(
      `
      SELECT
        COUNT(*) AS total,

        COUNT(
          CASE 
            WHEN status IN ('draft', 'returned_for_editing') 
            THEN 1 
          END
        ) AS drafts,

        COUNT(
          CASE 
            WHEN status = 'submitted' 
            THEN 1 
          END
        ) AS awaiting_review,

        COUNT(
          CASE 
            WHEN status = 'approved' 
            THEN 1 
          END
        ) AS awaiting_approval,

        COALESCE(SUM(total_amount),0) AS total_value,

        0 AS avg_variation_pct

      FROM quotations
      WHERE deleted_at IS NULL;
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    const expiringSoonCount = await this.quotationModel.count({
      where: {
        deletedAt: null,
        expiryDate: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total: Number(summary?.total ?? 0),
      drafts: Number(summary?.drafts ?? 0),
      awaiting_review: Number(summary?.awaiting_review ?? 0),
      awaiting_approval: Number(summary?.awaiting_approval ?? 0),
      total_value: Number(summary?.total_value ?? 0),
      expiring_soon: expiringSoonCount,
      avg_variation_pct: Number(
        Number(summary?.avg_variation_pct ?? 0).toFixed(2),
      ),
    };
  }

  /**
   * GET /dashboards/quotations/project-wise
   */
  async getProjectWise() {
    return this.quotationModel.findAll({
      attributes: [
        [col('project.id'), 'project_id'],
        [col('project.name'), 'project_name'],

        [fn('COUNT', col('Quotation.id')), 'quotation_count'],

        [fn('SUM', col('Quotation.total_amount')), 'combined_value'],

        [fn('COUNT', literal('DISTINCT Quotation.vendor_id')), 'vendor_count'],

        [fn('MAX', col('Quotation.status')), 'latest_status'],
      ],

      include: [
        {
          model: Project,
          attributes: [],
          required: true,
        },
      ],

      where: {
        deletedAt: null,
      },

      group: ['project.id', 'project.name'],

      order: [[fn('SUM', col('Quotation.total_amount')), 'DESC']],

      raw: true,
    });
  }

  /**
   * GET /dashboards/quotations/expiring-soon
   */
  async getExpiringSoon(withinDays: number = 7) {
    const expiryThreshold = new Date();

    expiryThreshold.setDate(expiryThreshold.getDate() + withinDays);

    return this.quotationModel.findAll({
      attributes: [
        'id',
        'quotationNumber',
        'vendorId',
        'projectId',
        'totalAmount',
        'status',
        'expiryDate',

        [literal('DATEDIFF(expiry_date, CURDATE())'), 'days_left'],
      ],

      include: [
        {
          model: Vendor,
          attributes: ['name'],
        },

        {
          model: Project,
          attributes: ['name'],
        },
      ],

      where: {
        deletedAt: null,

        expiryDate: {
          [Op.between]: [new Date(), expiryThreshold],
        },
      },

      order: [[literal('days_left'), 'ASC']],

      limit: 20,

      raw: true,
    });
  }

  /**
   * GET /dashboards/quotations/boq-variance
   *
   * Waiting for BOQ budget table integration
   */
  async getBoqVariance() {
    return {
      avg_variation_pct: 0,
    };
  }

  /**
   * GET /dashboards/quotations/value-trend
   */
  /**
   * GET /dashboards/quotations/value-trend
   */
  async getValueTrend(months: number = 6) {
    return this.quotationModel.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('Quotation.total_amount')), 'total_value'],
        [fn('COUNT', col('Quotation.id')), 'quotation_count'],
      ],

      where: {
        [Op.and]: [
          { deletedAt: null },
          literal(
            `created_at >= DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)`,
          ),
        ],
      },

      group: ['month'],
      order: [[literal('month'), 'ASC']],
      raw: true,
    });
  }

  /**
   * GET /dashboards/quotations/status-mix
   */
  async getStatusMix() {
    const stats = await this.quotationModel.findAll({
      attributes: ['status', [fn('COUNT', col('Quotation.id')), 'count']],

      where: {
        deletedAt: null,
      },

      group: ['status'],
    });

    return stats.reduce(
      (acc, item) => {
        acc[item.status] = Number(item.get('count'));

        return acc;
      },

      {} as Record<string, number>,
    );
  }

  /**
   * GET /dashboards/quotations/variation-by-project
   */
  async getVariationByProject(limit: number = 6) {
    return this.quotationModel.findAll({
      attributes: [
        [col('project.name'), 'project_name'],

        [literal('0'), 'avg_variation_pct'],
      ],

      include: [
        {
          model: Project,
          attributes: [],
          required: true,
        },
      ],

      where: {
        deletedAt: null,
      },

      group: ['project.id', 'project.name'],

      order: [[literal('avg_variation_pct'), 'DESC']],

      limit,

      raw: true,
    });
  }
}
