import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, WhereOptions, fn, col } from 'sequelize';
import { SnagItem } from './models/snag-item.model';
import { User } from '@/modules/users/models/user.model';
import { SnagStatus } from '@/common/enums/architect-visit.enums';
import { CreateSnagDto, QuerySnagDto, UpdateSnagDto } from './dto/snag.dto';

@Injectable()
export class SnagService {
  constructor(
    @InjectModel(SnagItem) private readonly model: typeof SnagItem,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateSnagDto, userId?: string) {
    const id = await this.sequelize.transaction(async (t) => {
      const latest = await this.model.findOne({
        where: {
          project_id: dto.project_id,
        },
        attributes: ['s_no'],
        order: [['s_no', 'DESC']],
        paranoid: false,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const nextSNo = (latest?.s_no ?? 0) + 1;

      const row = await this.model.create(
        {
          ...dto,
          s_no: nextSNo,
          status: dto.status ?? SnagStatus.OPEN,
          closed_at: dto.status === SnagStatus.CLOSED ? new Date() : null,
          created_by: userId ?? null,
        } as any,
        {
          transaction: t,
        },
      );

      return row.id;
    });

    return this.findOne(id);
  }

  async findAll(q: QuerySnagDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const where: WhereOptions<any> = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.visit_id) where.visit_id = q.visit_id;
    if (q.status) where.status = q.status;
    if (q.floor) where.floor = q.floor;
    if (q.room) where.room = { [Op.like]: `%${q.room}%` };
    if (q.category) where.category = q.category;
    if (q.scope) where.scope = q.scope;
    if (q.search) {
      const like = { [Op.like]: `%${q.search}%` };
      (where as any)[Op.or] = [
        { observation: like },
        { remarks: like },
        { room: like },
      ];
    }
    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [
        ['project_id', 'ASC'],
        ['s_no', 'ASC'],
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
    const row = await this.model.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
    if (!row) throw new NotFoundException('Snag item not found');
    return row;
  }

  async update(id: string, dto: UpdateSnagDto, userId?: string) {
    const row = await this.findOne(id);
    const patch: any = { ...dto, updated_by: userId ?? null };
    if (dto.status === SnagStatus.CLOSED && row.status !== SnagStatus.CLOSED) {
      patch.closed_at = new Date();
      patch.closed_by = userId ?? null;
    } else if (dto.status && dto.status !== SnagStatus.CLOSED) {
      patch.closed_at = null;
      patch.closed_by = null;
    }
    await row.update(patch);
    return this.findOne(id);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await row.destroy();
    return { message: 'Snag item deleted' };
  }

  /** Counts by status, by scope (who owes rework) and by floor for one project */
  async summary(projectId: string) {
    const group = (field: string) =>
      this.model.findAll({
        where: { project_id: projectId },
        attributes: [field, [fn('COUNT', col('id')), 'count']],
        group: [field],
        raw: true,
      });
    const [by_status, by_scope, by_floor] = await Promise.all([
      group('status'),
      group('scope'),
      group('floor'),
    ]);
    const open = await this.model.count({
      where: { project_id: projectId, status: { [Op.ne]: SnagStatus.CLOSED } },
    });
    return { open, by_status, by_scope, by_floor };
  }
}
