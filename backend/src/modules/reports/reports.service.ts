import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Quotation } from '../quotations/models/quotations.model';
import { Project } from '../projects/models/projects.model';
import { Vendor } from '../vendors/models/vendors.model';
import { User } from '../users/models/user.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Quotation)
    private quotationModel: typeof Quotation,
    private sequelize: Sequelize,
  ) {}

  // ==================== OVERVIEW ====================
  async getOverview() {
    const result = await this.quotationModel.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'draft' THEN 1 ELSE 0 END`,
            ),
          ),
          'draft',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'submitted' THEN 1 ELSE 0 END`,
            ),
          ),
          'submitted',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'returned_for_editing' THEN 1 ELSE 0 END`,
            ),
          ),
          'returned',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN 1 ELSE 0 END`,
            ),
          ),
          'approved',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'declined' THEN 1 ELSE 0 END`,
            ),
          ),
          'declined',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN \`Quotation\`.\`total_amount\` ELSE 0 END`,
            ),
          ),
          'approved_value',
        ],
      ],
      raw: true,
    });

    return (
      result[0] || {
        total: 0,
        draft: 0,
        submitted: 0,
        returned: 0,
        approved: 0,
        declined: 0,
        approved_value: 0,
      }
    );
  }

  // ==================== BY PROJECT ====================
  async getByProject() {
    return this.quotationModel.findAll({
      attributes: [
        [Sequelize.col('project.name'), 'project_name'],
        [Sequelize.fn('COUNT', Sequelize.col('Quotation.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'submitted' THEN 1 ELSE 0 END`,
            ),
          ),
          'pending',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN 1 ELSE 0 END`,
            ),
          ),
          'approved',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'declined' THEN 1 ELSE 0 END`,
            ),
          ),
          'declined',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN \`Quotation\`.\`total_amount\` ELSE 0 END`,
            ),
          ),
          'approved_value',
        ],
      ],
      include: [{ model: Project, attributes: [], required: true }],
      group: ['project.id', 'project.name'],
      order: [[Sequelize.col('project.name'), 'ASC']],
      raw: true,
    });
  }

  // ==================== BY VENDOR ====================
  async getByVendor() {
    return this.quotationModel.findAll({
      attributes: [
        [Sequelize.col('vendor.name'), 'vendor_name'],
        [Sequelize.fn('COUNT', Sequelize.col('Quotation.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'submitted' THEN 1 ELSE 0 END`,
            ),
          ),
          'pending',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN 1 ELSE 0 END`,
            ),
          ),
          'approved',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'declined' THEN 1 ELSE 0 END`,
            ),
          ),
          'declined',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN \`Quotation\`.\`total_amount\` ELSE 0 END`,
            ),
          ),
          'approved_value',
        ],
      ],
      include: [{ model: Vendor, attributes: [], required: true }],
      group: ['vendor.id', 'vendor.name'],
      order: [[Sequelize.col('vendor.name'), 'ASC']],
      raw: true,
    });
  }

  // ==================== BY STATUS ====================
  async getByStatus() {
    return this.quotationModel.findAll({
      attributes: [
        ['status', '_id'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_value'],
      ],
      group: ['status'],
      order: [['status', 'ASC']],
      raw: true,
    });
  }

  // ==================== BY EMPLOYEE ====================
  async getByEmployee() {
    return this.quotationModel.findAll({
      attributes: [
        [Sequelize.col('creator.name'), 'employee_name'], // Correct column from User model
        [Sequelize.fn('COUNT', Sequelize.col('Quotation.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'draft' THEN 1 ELSE 0 END`,
            ),
          ),
          'draft',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'submitted' THEN 1 ELSE 0 END`,
            ),
          ),
          'pending',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'approved' THEN 1 ELSE 0 END`,
            ),
          ),
          'approved',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              `CASE WHEN \`Quotation\`.\`status\` = 'declined' THEN 1 ELSE 0 END`,
            ),
          ),
          'declined',
        ],
      ],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: [],
          required: true,
        },
      ],
      group: ['creator.id', 'creator.name'],
      order: [[Sequelize.col('creator.name'), 'ASC']],
      raw: true,
    });
  }
}
