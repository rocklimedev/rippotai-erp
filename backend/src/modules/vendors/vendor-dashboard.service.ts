import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './models/vendors.model';
import { VendorCategory } from './models/vendor-category.model';
import { Project } from '../projects/models/projects.model';
import { Op, fn, col, literal } from 'sequelize';
import { VendorStatus } from '@/common/enums';
import { Quotation } from '../quotations/models/quotations.model';
import { QueryTypes } from 'sequelize';
@Injectable()
export class VendorDashboardService {
  constructor(
    @InjectModel(Vendor)
    private vendorModel: typeof Vendor,

    @InjectModel(VendorCategory)
    private vendorCategoryModel: typeof VendorCategory,

    @InjectModel(Project)
    private projectModel: typeof Project,

    @InjectModel(Quotation)
    private quotationModel: typeof Quotation,
  ) {}
  /**
   * Dashboard summary
   */
  async getDashboardSummary() {
    const [total, verified, active, attention] = await Promise.all([
      this.vendorModel.count(),

      this.vendorModel.count({
        where: {
          status: VendorStatus.ACTIVE,
        },
      }),

      this.vendorModel.count({
        where: {
          status: {
            [Op.in]: [VendorStatus.ACTIVE, VendorStatus.ACTIVE],
          },
        },
      }),

      this.vendorModel.count({
        where: {
          status: {
            [Op.notIn]: [VendorStatus.ACTIVE, VendorStatus.ACTIVE],
          },
        },
      }),
    ]);

    return {
      total,
      verified,
      available: active,
      attention,
    };
  }
  /**
   * Get vendors grouped by category with counts
   */
  async getVendorsByCategory() {
    const result = await this.vendorModel.findAll({
      attributes: [
        [
          fn('COALESCE', col('vendorCategory.name'), 'Uncategorized'),
          'category',
        ],
        [fn('COUNT', col('Vendor.id')), 'count'],
        [
          literal(`
    SUM(
      CASE
        WHEN Vendor.status IN ('verified', 'active')
        THEN 1
        ELSE 0
      END
    )
  `),
          'verified_count',
        ],
      ],
      include: [
        {
          model: VendorCategory,
          attributes: [],
          required: false,
        },
      ],
      group: ['category'],
      order: [[literal('count'), 'DESC']],
      raw: true,
    });

    return result.map((item: any) => ({
      category: item.category,
      count: parseInt(item.count),
      verified_count: parseInt(item.ACTIVE_count || '0'),
    }));
  }

  /**
   * Project-wise assigned vendors
   * Aggregates vendors per project (via quotations)
   */
  async getVendorsProjectWise() {
    const projects = await this.projectModel.sequelize!.query(
      `
    SELECT
      p.id,
      p.name,
      COUNT(DISTINCT q.vendor_id) AS assigned_vendor_count,
      GROUP_CONCAT(DISTINCT vc.name) AS categories
    FROM projects p
    LEFT JOIN quotations q
      ON q.project_id = p.id
      AND q.deleted_at IS NULL
    LEFT JOIN vendors v
      ON v.id = q.vendor_id
    LEFT JOIN vendor_categories vc
      ON vc.id = v.vendor_category_id
    WHERE
      p.deleted_at IS NULL
      AND p.status <> 'ARCHIVED'
    GROUP BY
      p.id,
      p.name
    ORDER BY
      assigned_vendor_count DESC
    LIMIT 10
    `,
      {
        type: QueryTypes.SELECT,
      },
    );

    return (projects as any[]).map((p) => ({
      project_id: p.id,
      project_name: p.name,
      assigned_vendor_count: Number(p.assigned_vendor_count) || 0,
      categories: p.categories
        ? String(p.categories).split(',').filter(Boolean)
        : [],
      availability_status:
        Number(p.assigned_vendor_count) > 0 ? 'available' : 'limited',
    }));
  }

  /**
   * Count of vendors requiring attention
   */
  async getVendorsRequiringAttention() {
    // TODO: Enhance with actual logic (expiring documents, inactive status, etc.)
    const count = await this.vendorModel.count({
      where: {
        // Example conditions - customize as needed
        // status: { [Op.in]: ['pending', 'suspended'] },
      },
    });

    return { count };
  }

  /**
   * Vendor onboarding trend (cumulative verified)
   */
  async getVendorsOnboardingTrend(months: number = 6) {
    const result = await this.vendorModel.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('COUNT', col('Vendor.id')), 'new_verified'],
      ],
      where: {
        created_at: {
          [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${months} MONTH)`),
        },
      },
      group: ['month'],
      order: [['month', 'ASC']],
      raw: true,
    });

    let cumulative = 0;
    return result.map((item: any) => {
      cumulative += parseInt(item.new_verified);
      return {
        month: item.month,
        new_verified: parseInt(item.new_verified),
        cumulative_verified: cumulative,
      };
    });
  }

  /**
   * Current vendor availability mix (for donut chart)
   */
  async getVendorsAvailabilityMix() {
    const mix = await this.vendorModel.findAll({
      attributes: [
        ['status', 'availability_status'],
        [fn('COUNT', col('Vendor.id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const result: Record<string, number> = { available: 0, limited: 0 };

    mix.forEach((item: any) => {
      const key = ['active', 'verified'].includes(item.availability_status)
        ? 'available'
        : 'limited';
      result[key] = (result[key] || 0) + parseInt(item.count);
    });

    return result;
  }

  /**
   * Recently added vendors
   */
  async getVendorsRecentlyAdded(limit: number = 5) {
    const vendors = await this.vendorModel.findAll({
      attributes: ['id', 'name', 'created_at'],
      include: [
        {
          model: VendorCategory,
          attributes: ['name'],
          as: 'vendorCategory',
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      raw: true,
      nest: true,
    });

    return vendors.map((v: any) => ({
      id: v.id,
      name: v.name,
      category: v.vendorCategory?.name || 'Uncategorized',
      created_at: v.created_at,
    }));
  }
}
