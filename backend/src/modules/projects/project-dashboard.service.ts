import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Project } from '../projects/models/projects.model';
import { ProjectType } from '../projects/models/project-type.model';
import { Client } from '../clients/models/client.model';
import { Milestone } from './models/milestone.model';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
@Injectable()
export class ProjectDashboardService {
  constructor(
    @InjectModel(Project)
    private projectModel: typeof Project,
    @InjectModel(ProjectType)
    private projectTypeModel: typeof ProjectType,
    @InjectModel(Milestone)
    private milestoneModel: typeof Milestone,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  // =============================================
  // GET /projects/summary
  // =============================================
  // =============================================
  // GET /projects/summary
  // =============================================
  async getProjectsSummary() {
    const summary = await this.projectModel.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [
          fn('SUM', literal(`CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END`)),
          'active',
        ],
        [
          fn(
            'SUM',
            literal(`CASE WHEN timeline_status = 'ON_TIME' THEN 1 ELSE 0 END`),
          ),
          'on_time',
        ],
        [
          fn(
            'SUM',
            literal(`CASE WHEN timeline_status = 'AT_RISK' THEN 1 ELSE 0 END`),
          ),
          'at_risk',
        ],
        [
          fn(
            'SUM',
            literal(`CASE WHEN timeline_status = 'DELAYED' THEN 1 ELSE 0 END`),
          ),
          'delayed',
        ],
      ],
      where: { deleted_at: null, archived_at: null },
      raw: true,
    });

    const s = (summary[0] as any) || {};

    return {
      total: Number(s.total) || 0,
      active: Number(s.active) || 0,
      on_time: Number(s.on_time) || 0,
      at_risk: Number(s.at_risk) || 0,
      delayed: Number(s.delayed) || 0,
    };
  }
  // =============================================
  // GET /projects/full
  // =============================================
  async getProjectsFull() {
    return this.projectModel.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: ProjectType, as: 'project_type', attributes: ['name'] },
      ],
      where: { deleted_at: null, archived_at: null },
      order: [['updated_at', 'DESC']],
    });
  }

  // =============================================
  // GET /dashboards/projects/progress
  // =============================================
  async getProjectsProgress() {
    return this.projectModel.findAll({
      attributes: [
        'id',
        'name',

        'current_phase',
        'progress_pct',
        'next_milestone_name',
        'timeline_status',
        [col('client.name'), 'client_name'],
      ],
      include: [
        {
          model: Client,
          as: 'client',
          attributes: [],
        },
      ],
      where: { deleted_at: null, status: 'ACTIVE' },
      order: [['progress_pct', 'DESC']],
    });
  }

  // =============================================
  // GET /dashboards/projects/upcoming-milestones
  // =============================================
  async getUpcomingMilestones(limit = 4) {
    return this.milestoneModel.findAll({
      where: {
        due_date: { [Op.gte]: new Date() },
        completed_at: null,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      order: [['due_date', 'ASC']],
    });
  }

  // =============================================
  // GET /dashboards/projects/progress-trend
  // =============================================
  async getProjectsProgressTrend(months = 6) {
    const data = await this.sequelize.query(
      `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        AVG(progress_pct) as avg_progress
      FROM projects
      WHERE deleted_at IS NULL
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
      GROUP BY month
      ORDER BY month ASC
      `,
      {
        replacements: { months },
        type: 'SELECT',
      },
    );
    return data;
  }

  // =============================================
  // GET /dashboards/projects/phase-mix
  // ============================================
  async getProjectsPhaseMix() {
    const result = await this.projectModel.findAll({
      attributes: ['current_phase', [fn('COUNT', col('id')), 'count']],
      where: { deleted_at: null },
      group: ['current_phase'],
      raw: true,
    });

    return result.reduce(
      (acc: Record<string, number>, row: any) => {
        const phase = (row as any).current_phase || 'Unknown';
        acc[phase] = Number((row as any).count);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
  // =============================================
  // GET /dashboards/projects/variance-by-project
  // =============================================
  async getProjectsVarianceByProject(limit = 6) {
    return this.projectModel.findAll({
      attributes: [
        'id',
        ['name', 'project_name'],
        'schedule_variance',
        [
          literal(`ROUND((schedule_variance / planned_duration) * 100, 1)`),
          'variance_pct',
        ],
      ],
      where: {
        deleted_at: null,
        schedule_variance: { [Op.ne]: 0 },
        planned_duration: { [Op.gt]: 0 }, // avoid division by zero
      },
      order: [[literal('ABS(schedule_variance)'), 'DESC']],
      limit,
    });
  }

  // =============================================
  // GET /milestones/upcoming (global)
  // =============================================
  async getUpcomingMilestonesGlobal(limit = 5) {
    return this.milestoneModel.findAll({
      where: {
        due_date: { [Op.gte]: new Date() },
        completed_at: null,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      order: [['due_date', 'ASC']],
    });
  }

  // =============================================
  // GET /activity/recent
  // =============================================
  async getRecentActivity(limit = 10) {
    return this.sequelize.query(
      `
    SELECT
      a.id,
      a.action,
      a.entity_type,
      a.entity_id,
      a.entity_label,
      a.user_email,
      a.user_role,
      a.created_at,
      u.name AS user_name
    FROM activity_logs a
    LEFT JOIN users u
      ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT :limit
    `,
      {
        replacements: { limit },
        type: 'SELECT',
      },
    );
  }
}
