import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, fn, col } from 'sequelize';
import { AdminDailyLog } from './models/admin-daily-log.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { DprWorkStatus } from '@/common/enums/dpr.enums';
import {
  CreateAdminDailyLogDto,
  QueryAdminDailyLogDto,
  UpdateAdminDailyLogDto,
} from './dto/admin-daily-log.dto';

const INCLUDES = [
  {
    model: Project,
    as: 'project',
    attributes: ['id', 'name', 'slug'],
    required: false,
  },
  { model: User, as: 'creator', attributes: ['id', 'name'], required: false },
];

const today = () => new Date().toISOString().slice(0, 10);

@Injectable()
export class AdminDailyLogService {
  constructor(
    @InjectModel(AdminDailyLog) private readonly model: typeof AdminDailyLog,
  ) {}

  async create(dto: CreateAdminDailyLogDto, userId?: string) {
    const row = await this.model.create({
      ...dto,
      log_date: dto.log_date ?? today(),
      completed_at: dto.status === DprWorkStatus.COMPLETED ? new Date() : null,
      created_by: userId ?? null,
    } as any);
    return this.findOne(row.id);
  }

  async findAll(q: QueryAdminDailyLogDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: WhereOptions<any> = {};
    const and: any[] = [];

    if (q.project_id) where.project_id = q.project_id;
    if (q.status) where.status = q.status;
    if (q.work_type) where.work_type = q.work_type;
    if (q.pending_with)
      where.pending_with = { [Op.like]: `%${q.pending_with}%` };
    if (q.from_date || q.to_date) {
      where.log_date = {
        ...(q.from_date && { [Op.gte]: q.from_date }),
        ...(q.to_date && { [Op.lte]: q.to_date }),
      };
    }
    if (q.overdue) {
      and.push({
        status: { [Op.ne]: DprWorkStatus.COMPLETED },
        due_date: { [Op.lt]: today() },
      });
    }
    if (q.search) {
      const like = { [Op.like]: `%${q.search}%` };
      and.push({
        [Op.or]: [{ details: like }, { remarks: like }, { work_type: like }],
      });
    }
    if (and.length) (where as any)[Op.and] = and;

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: INCLUDES,
      order: [
        ['log_date', 'DESC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
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
    if (!row) throw new NotFoundException('Admin log entry not found');
    return row;
  }

  async update(id: string, dto: UpdateAdminDailyLogDto, userId?: string) {
    const row = await this.findOne(id);
    const patch: any = { ...dto, updated_by: userId ?? null };
    if (dto.status === DprWorkStatus.COMPLETED && !row.completed_at) {
      patch.completed_at = new Date();
    } else if (dto.status && dto.status !== DprWorkStatus.COMPLETED) {
      patch.completed_at = null;
    }
    await row.update(patch);
    return this.findOne(id);
  }

  async remove(id: string, userId?: string) {
    const row = await this.findOne(id);
    await row.update({ deleted_by: userId ?? null } as any);
    await row.destroy();
    return { message: 'Admin log entry deleted' };
  }

  /** Open items summary: counts by status + overdue + grouped by "pending with" */
  async summary() {
    const open = { status: { [Op.ne]: DprWorkStatus.COMPLETED } };
    const [by_status, overdue, by_pending_with] = await Promise.all([
      this.model.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      this.model.count({ where: { ...open, due_date: { [Op.lt]: today() } } }),
      this.model.findAll({
        where: open,
        attributes: ['pending_with', [fn('COUNT', col('id')), 'count']],
        group: ['pending_with'],
        raw: true,
      }),
    ]);
    return { by_status, overdue, by_pending_with };
  }
}
