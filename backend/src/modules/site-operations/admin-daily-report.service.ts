import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, fn, col } from 'sequelize';
import { AdminDailyReport } from './models/admin-daily-report.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import {
  CreateAdminDailyReportDto,
  QueryAdminDailyReportDto,
  UpdateAdminDailyReportDto,
} from './dto/admin-daily-report.dto';

const INCLUDES = [
  {
    model: Project,
    as: 'project',
    attributes: ['id', 'name', 'slug', 'site_location'],
  },
  { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
];

const NOT_EMPTY = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };

@Injectable()
export class AdminDailyReportService {
  constructor(
    @InjectModel(AdminDailyReport)
    private readonly model: typeof AdminDailyReport,
  ) {}

  async create(dto: CreateAdminDailyReportDto, userId?: string) {
    const row = await this.model.create({
      ...dto,
      created_by: userId ?? null,
    } as any);
    return this.findOne(row.id);
  }

  async findAll(q: QueryAdminDailyReportDto, paginate = true) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: WhereOptions<any> = {};
    const and: any[] = [];

    if (q.project_id) where.project_id = q.project_id;
    if (q.work_status) where.work_status = q.work_status;
    if (q.date) where.report_date = q.date;
    else if (q.from_date || q.to_date) {
      where.report_date = {
        ...(q.from_date && { [Op.gte]: q.from_date }),
        ...(q.to_date && { [Op.lte]: q.to_date }),
      };
    }
    if (q.has_blockers) and.push({ issues_blockers: NOT_EMPTY });
    if (q.search) {
      const like = { [Op.like]: `%${q.search}%` };
      and.push({
        [Op.or]: [
          { work_details: like },
          { contractor_working: like },
          { issues_blockers: like },
          { work_planned_tomorrow: like },
        ],
      });
    }
    if (and.length) (where as any)[Op.and] = and;

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: INCLUDES,
      order: [
        ['report_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      ...(paginate ? { limit, offset: (page - 1) * limit } : {}),
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: string) {
    const row = await this.model.findByPk(id, { include: INCLUDES });
    if (!row) throw new NotFoundException('Daily report not found');
    return row;
  }

  async update(id: string, dto: UpdateAdminDailyReportDto, userId?: string) {
    const row = await this.findOne(id);
    await row.update({ ...dto, updated_by: userId ?? null } as any);
    return this.findOne(id);
  }

  async remove(id: string, userId?: string) {
    const row = await this.findOne(id);
    await row.update({ deleted_by: userId ?? null } as any);
    await row.destroy();
    return { message: 'Daily report deleted' };
  }

  /** Dashboard helper: counts by work_status for a given day */
  async daySummary(date: string) {
    const by_status = await this.model.findAll({
      where: { report_date: date },
      attributes: ['work_status', [fn('COUNT', col('id')), 'count']],
      group: ['work_status'],
      raw: true,
    });
    const with_blockers = await this.model.count({
      where: { report_date: date, issues_blockers: NOT_EMPTY },
    });
    return { date, by_status, with_blockers };
  }
}
